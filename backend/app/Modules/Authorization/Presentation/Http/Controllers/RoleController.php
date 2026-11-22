<?php

declare(strict_types=1);

namespace App\Modules\Authorization\Presentation\Http\Controllers;

use App\Modules\Authorization\Application\Commands\RoleHandlers;
use App\Modules\Authorization\Application\Queries\RoleQueryService;
use App\Modules\Authorization\Domain\RoleErrors;
use App\Modules\Authorization\Presentation\Http\Requests\RoleRequest;
use App\Modules\Authorization\Presentation\Http\Resources\RoleResource;
use App\Shared\Presentation\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * @tags Roles & Permissions
 */
final readonly class RoleController
{
    public function __construct(
        private RoleQueryService $queries,
        private RoleHandlers $handlers,
    ) {}

    /**
     * List roles
     *
     * Requires `roles.view`. Not paginated.
     *
     * @response array{success: true, data: list<RoleResource>, meta: array{request_id: string}}
     */
    public function index(): JsonResponse
    {
        return ApiResponse::success(RoleResource::collection($this->queries->all()));
    }

    /**
     * Create a role
     *
     * Requires `roles.manage`. 409 `ROLE_NAME_TAKEN` when the name exists.
     *
     * @status 201
     *
     * @response array{success: true, data: RoleResource, message: string, meta: array{request_id: string}}
     */
    public function store(RoleRequest $request): JsonResponse
    {
        $result = $this->handlers->create($request->validated('name'), $request->permissions());

        return $result->isFailure()
            ? ApiResponse::error($result->error())
            : ApiResponse::created(new RoleResource($this->queries->find($result->value())), 'Role created.');
    }

    /**
     * Show a role
     *
     * Requires `roles.view`.
     *
     * @response array{success: true, data: RoleResource, meta: array{request_id: string}}
     */
    public function show(int $role): JsonResponse
    {
        $view = $this->queries->find($role);

        return $view === null ? ApiResponse::error(RoleErrors::notFound()) : ApiResponse::success(new RoleResource($view));
    }

    /**
     * Update a role
     *
     * Requires `roles.manage`. System roles keep their name (409 `SYSTEM_ROLE_IMMUTABLE`).
     *
     * @response array{success: true, data: RoleResource, message: string, meta: array{request_id: string}}
     */
    public function update(RoleRequest $request, int $role): JsonResponse
    {
        $result = $this->handlers->update($role, $request->validated('name'), $request->permissions());

        return $result->isFailure()
            ? ApiResponse::error($result->error())
            : ApiResponse::success(new RoleResource($this->queries->find($role)), 'Role updated.');
    }

    /**
     * Delete a role
     *
     * Requires `roles.manage`. 409 `SYSTEM_ROLE_IMMUTABLE` or `ROLE_IN_USE`.
     *
     * @response array{success: true, data: null, message: string, meta: array{request_id: string}}
     */
    public function destroy(int $role): JsonResponse
    {
        $result = $this->handlers->delete($role);

        return $result->isFailure()
            ? ApiResponse::error($result->error())
            : ApiResponse::success(null, 'Role deleted.');
    }
}
