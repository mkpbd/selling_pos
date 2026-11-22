<?php

declare(strict_types=1);

namespace App\Shared\Presentation\Http\Controllers;

use App\Shared\Presentation\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

final class HealthController
{
    /**
     * Health check
     *
     * Liveness/readiness probe. Returns 503 when a dependency is unavailable.
     *
     * @unauthenticated
     *
     * @response array{success: bool, data: array{status: 'ok'|'degraded', checks: array{database: 'ok'|'fail'}, time: string}, meta: array{request_id: string}}
     */
    public function __invoke(): JsonResponse
    {
        $database = 'ok';

        try {
            DB::select('select 1');
        } catch (Throwable $e) {
            Log::error('Health check: database unavailable', ['exception' => $e->getMessage()]);
            $database = 'fail';
        }

        $healthy = $database === 'ok';

        return ApiResponse::success([
            'status' => $healthy ? 'ok' : 'degraded',
            'checks' => ['database' => $database],
            'time' => now()->toIso8601String(),
        ], status: $healthy ? 200 : 503);
    }
}
