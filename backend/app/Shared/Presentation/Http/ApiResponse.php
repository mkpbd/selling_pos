<?php

declare(strict_types=1);

namespace App\Shared\Presentation\Http;

use App\Shared\Application\Pagination\PageResult;
use App\Shared\Domain\Result\Error;
use App\Shared\Domain\Result\ErrorType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Context;

/**
 * Single source of truth for the API envelope:
 *   success: { success: true,  data, message?, meta: { request_id, pagination? } }
 *   failure: { success: false, error: { code, message, details? }, meta: { request_id } }
 */
final class ApiResponse
{
    /**
     * @param  array<string, mixed>  $meta
     */
    public static function success(mixed $data = null, ?string $message = null, int $status = 200, array $meta = []): JsonResponse
    {
        $body = [
            'success' => true,
            'data' => self::resolve($data),
            'meta' => self::meta($meta),
        ];

        if ($message !== null) {
            $body['message'] = $message;
        }

        return new JsonResponse($body, $status);
    }

    public static function created(mixed $data, ?string $message = null): JsonResponse
    {
        return self::success($data, $message, 201);
    }

    /**
     * @template T
     *
     * @param  PageResult<T>  $page
     * @param  callable(list<T>): mixed  $transform  turns page items into the response data (e.g. a resource collection)
     */
    public static function paginated(PageResult $page, callable $transform): JsonResponse
    {
        return self::success($transform($page->items), meta: [
            'pagination' => [
                'page' => $page->page,
                'per_page' => $page->perPage,
                'total' => $page->total,
                'last_page' => $page->lastPage(),
            ],
        ]);
    }

    public static function error(Error $error): JsonResponse
    {
        return self::failure($error->code, $error->message, self::statusFor($error->type), $error->details);
    }

    /**
     * @param  array<string, mixed>  $details
     * @param  array<string, string>  $headers
     */
    public static function failure(string $code, string $message, int $status, array $details = [], array $headers = []): JsonResponse
    {
        $error = ['code' => $code, 'message' => $message];

        if ($details !== []) {
            $error['details'] = $details;
        }

        return new JsonResponse([
            'success' => false,
            'error' => $error,
            'meta' => self::meta(),
        ], $status, $headers);
    }

    public static function statusFor(ErrorType $type): int
    {
        return match ($type) {
            ErrorType::Validation, ErrorType::BusinessRule => 422,
            ErrorType::NotFound => 404,
            ErrorType::Conflict => 409,
            ErrorType::Forbidden => 403,
            ErrorType::Unauthorized => 401,
        };
    }

    private static function resolve(mixed $data): mixed
    {
        return $data instanceof JsonResource ? $data->resolve(request()) : $data;
    }

    /**
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    private static function meta(array $extra = []): array
    {
        return ['request_id' => Context::get('request_id'), ...$extra];
    }
}
