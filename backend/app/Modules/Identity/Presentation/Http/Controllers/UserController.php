<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Controllers;

use App\Modules\Identity\Application\Commands\CreateUserHandler;
use App\Modules\Identity\Application\Commands\UpdateUserHandler;
use App\Modules\Identity\Application\DTOs\UserData;
use App\Modules\Identity\Application\Queries\UserQueryService;
use App\Modules\Identity\Domain\UserErrors;
use App\Modules\Identity\Presentation\Http\CurrentActor;
use App\Modules\Identity\Presentation\Http\Requests\ListUsersRequest;
use App\Modules\Identity\Presentation\Http\Requests\UserRequest;
use App\Modules\Identity\Presentation\Http\Resources\UserResource;
use App\Shared\Application\Context\Actor;
use App\Shared\Presentation\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @tags Users
 */
final readonly class UserController
{
    public function __construct(
        private UserQueryService $queries,
        private CurrentActor $actors,
    ) {}

    /**
     * List users
     *
     * Requires `users.view`. Non-super-admins only see members of their active branch.
     *
     * @response array{success: true, data: list<UserResource>, meta: array{request_id: string, pagination: array{page: int, per_page: int, total: int, last_page: int}}}
     */
    public function index(ListUsersRequest $request): JsonResponse
    {
        $actor = $this->actors->from($request);

        return ApiResponse::paginated(
            $this->queries->paginate($request->toPageRequest(), $this->scope($actor)),
            static fn (array $items) => UserResource::collection($items),
        );
    }

    /**
     * Create a user
     *
     * Requires `users.create`. You can only assign branches you can access, and only roles
     * whose permissions you hold yourself in that branch.
     *
     * @status 201
     *
     * @response array{success: true, data: UserResource, message: string, meta: array{request_id: string}}
     */
    public function store(UserRequest $request, CreateUserHandler $handler): JsonResponse
    {
        $actor = $this->actors->from($request);
        $result = $handler->handle($actor, UserData::fromArray($request->validated()));

        return $result->isFailure()
            ? ApiResponse::error($result->error())
            : ApiResponse::created(new UserResource($this->queries->findById($result->value())), 'User created.');
    }

    /**
     * Show a user
     *
     * Requires `users.view`.
     *
     * @response array{success: true, data: UserResource, meta: array{request_id: string}}
     */
    public function show(Request $request, string $user): JsonResponse
    {
        $view = $this->queries->findById($user, $this->scope($this->actors->from($request)));

        return $view === null ? ApiResponse::error(UserErrors::notFound()) : ApiResponse::success(new UserResource($view));
    }

    /**
     * Update a user
     *
     * Requires `users.update`. Deactivating a user revokes their sessions and tokens.
     * Assignments in branches outside your scope are preserved.
     *
     * @response array{success: true, data: UserResource, message: string, meta: array{request_id: string}}
     */
    public function update(UserRequest $request, string $user, UpdateUserHandler $handler): JsonResponse
    {
        $result = $handler->handle($this->actors->from($request), $user, UserData::fromArray($request->validated()));

        return $result->isFailure()
            ? ApiResponse::error($result->error())
            : ApiResponse::success(new UserResource($this->queries->findById($result->value())), 'User updated.');
    }

    private function scope(Actor $actor): ?string
    {
        return $actor->isSuperAdmin ? null : ($actor->currentBranchId ?? '00000000-0000-0000-0000-000000000000');
    }
}
