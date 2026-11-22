<?php

declare(strict_types=1);

namespace App\Modules\Organization\Presentation\Http\Controllers;

use App\Modules\Organization\Application\Commands\CreateBranchHandler;
use App\Modules\Organization\Application\Commands\UpdateBranchHandler;
use App\Modules\Organization\Application\DTOs\BranchData;
use App\Modules\Organization\Application\Queries\BranchQueryService;
use App\Modules\Organization\Domain\BranchErrors;
use App\Modules\Organization\Presentation\Http\Requests\BranchRequest;
use App\Modules\Organization\Presentation\Http\Requests\ListBranchesRequest;
use App\Modules\Organization\Presentation\Http\Resources\BranchResource;
use App\Shared\Presentation\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * @tags Branches
 */
final readonly class BranchController
{
    public function __construct(private BranchQueryService $queries) {}

    /**
     * List branches
     *
     * Requires `branches.view`.
     *
     * @response array{success: true, data: list<BranchResource>, meta: array{request_id: string, pagination: array{page: int, per_page: int, total: int, last_page: int}}}
     */
    public function index(ListBranchesRequest $request): JsonResponse
    {
        return ApiResponse::paginated(
            $this->queries->paginate($request->toPageRequest()),
            static fn (array $items) => BranchResource::collection($items),
        );
    }

    /**
     * Create a branch
     *
     * Requires `branches.create`. Returns 409 `BRANCH_CODE_TAKEN` when the code is in use.
     *
     * @status 201
     *
     * @response array{success: true, data: BranchResource, message: string, meta: array{request_id: string}}
     */
    public function store(BranchRequest $request, CreateBranchHandler $handler): JsonResponse
    {
        $result = $handler->handle(BranchData::fromArray($request->validated()));

        if ($result->isFailure()) {
            return ApiResponse::error($result->error());
        }

        return ApiResponse::created($this->resource($result->value()), 'Branch created.');
    }

    /**
     * Show a branch
     *
     * Requires `branches.view`.
     *
     * @response array{success: true, data: BranchResource, meta: array{request_id: string}}
     */
    public function show(string $branch): JsonResponse
    {
        $view = $this->queries->findById($branch);

        return $view === null
            ? ApiResponse::error(BranchErrors::notFound())
            : ApiResponse::success(new BranchResource($view));
    }

    /**
     * Update a branch
     *
     * Requires `branches.update`. Deactivate a branch with `is_active: false`.
     *
     * @response array{success: true, data: BranchResource, message: string, meta: array{request_id: string}}
     */
    public function update(BranchRequest $request, string $branch, UpdateBranchHandler $handler): JsonResponse
    {
        $result = $handler->handle($branch, BranchData::fromArray($request->validated()));

        if ($result->isFailure()) {
            return ApiResponse::error($result->error());
        }

        return ApiResponse::success($this->resource($result->value()), 'Branch updated.');
    }

    private function resource(string $id): BranchResource
    {
        return new BranchResource($this->queries->findById($id));
    }
}
