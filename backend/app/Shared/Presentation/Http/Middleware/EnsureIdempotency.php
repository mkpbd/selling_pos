<?php

declare(strict_types=1);

namespace App\Shared\Presentation\Http\Middleware;

use App\Shared\Presentation\Http\ApiResponse;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Opt-in idempotency for critical writes via the `Idempotency-Key` header.
 *  - first request: executes and stores the response (non-5xx);
 *  - same key + same payload: replays the stored response;
 *  - same key + different payload: 422 IDEMPOTENCY_KEY_REUSED;
 *  - same key while the first is running: 409 IDEMPOTENCY_IN_PROGRESS.
 * Keys are scoped per user and expire after 24 hours.
 */
final class EnsureIdempotency
{
    public const string HEADER = 'Idempotency-Key';

    private const string TABLE = 'idempotency_keys';

    private const int TTL_HOURS = 24;

    public function handle(Request $request, Closure $next): Response
    {
        $key = trim((string) $request->headers->get(self::HEADER, ''));

        if ($key === '') {
            return $next($request);
        }

        if (preg_match('/^[A-Za-z0-9\-_]{8,100}$/', $key) !== 1) {
            return ApiResponse::failure('VALIDATION_FAILED', 'Invalid Idempotency-Key header.', 422, [
                self::HEADER => ['Use 8-100 characters: letters, digits, dashes or underscores.'],
            ]);
        }

        $userId = $request->user()?->getAuthIdentifier();
        $hash = hash('sha256', $request->method().'|'.$request->path().'|'.json_encode($request->all()));
        $scope = DB::table(self::TABLE)->where('key', $key)
            ->when($userId === null, fn ($q) => $q->whereNull('user_id'), fn ($q) => $q->where('user_id', $userId));

        $scope->clone()->where('expires_at', '<', now())->delete();

        $claimed = DB::table(self::TABLE)->insertOrIgnore([
            'user_id' => $userId,
            'key' => $key,
            'method' => $request->method(),
            'path' => substr($request->path(), 0, 255),
            'request_hash' => $hash,
            'created_at' => now(),
            'expires_at' => now()->addHours(self::TTL_HOURS),
        ]) === 1;

        if (! $claimed) {
            return $this->replay($scope->clone()->first(), $hash);
        }

        try {
            $response = $next($request);
        } catch (Throwable $e) {
            $scope->clone()->delete();

            throw $e;
        }

        if ($response->getStatusCode() >= 500) {
            $scope->clone()->delete(); // allow a retry after a server fault
        } else {
            $scope->clone()->update([
                'response_status' => $response->getStatusCode(),
                'response_body' => $response->getContent(),
            ]);
        }

        return $response;
    }

    private function replay(?object $record, string $hash): Response
    {
        if ($record === null) {
            return ApiResponse::failure('IDEMPOTENCY_IN_PROGRESS', 'A request with this Idempotency-Key is being processed.', 409);
        }

        if (! hash_equals($record->request_hash, $hash)) {
            return ApiResponse::failure('IDEMPOTENCY_KEY_REUSED', 'This Idempotency-Key was already used with a different request.', 422);
        }

        if ($record->response_status === null) {
            return ApiResponse::failure('IDEMPOTENCY_IN_PROGRESS', 'A request with this Idempotency-Key is being processed.', 409);
        }

        return new JsonResponse(
            json_decode((string) $record->response_body, true),
            (int) $record->response_status,
            ['Idempotent-Replayed' => 'true'],
        );
    }
}
