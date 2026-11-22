<?php

declare(strict_types=1);

namespace App\Modules\Authorization\Presentation\Http\Controllers;

use App\Shared\Application\Authorization\PermissionRegistry;
use App\Shared\Presentation\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * @tags Roles & Permissions
 */
final readonly class PermissionController
{
    /**
     * List permissions
     *
     * Requires `roles.view`. The permission catalog, grouped for display.
     *
     * @response array{success: true, data: list<array{group: string, permissions: list<array{name: string, label: string}>}>, meta: array{request_id: string}}
     */
    public function __invoke(PermissionRegistry $registry): JsonResponse
    {
        return ApiResponse::success($registry->grouped());
    }
}
