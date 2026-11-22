<?php

declare(strict_types=1);

namespace App\Modules\Products\Presentation\Http\Controllers;

use App\Modules\Products\Application\Commands\UnitHandlers;
use App\Modules\Products\Application\Queries\CatalogQueryService;
use App\Modules\Products\Presentation\Http\Requests\UnitRequest;
use App\Shared\Presentation\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * @tags Catalog settings
 */
final readonly class UnitController
{
    public function __construct(
        private CatalogQueryService $queries,
        private UnitHandlers $handlers,
    ) {}

    /**
     * List units of measure
     *
     * Requires `products.view`. Not paginated.
     *
     * @response array{success: true, data: list<array{id: string, code: string, name: string, allows_decimal: bool, products_count: int, created_at: string|null, updated_at: string|null}>, meta: array{request_id: string}}
     */
    public function index(): JsonResponse
    {
        return ApiResponse::success($this->queries->units());
    }

    /**
     * Create a unit
     *
     * Requires `catalog.manage`. 409 `UNIT_CODE_TAKEN`.
     *
     * @status 201
     */
    public function store(UnitRequest $request): JsonResponse
    {
        $result = $this->handlers->create($request->validated('code'), $request->validated('name'), (bool) $request->validated('allows_decimal'));

        return $result->isFailure()
            ? ApiResponse::error($result->error())
            : ApiResponse::created($this->queries->units($result->value())[0], 'Unit created.');
    }

    /**
     * Update a unit
     *
     * Requires `catalog.manage`.
     */
    public function update(UnitRequest $request, string $unit): JsonResponse
    {
        $result = $this->handlers->update($unit, $request->validated('code'), $request->validated('name'), (bool) $request->validated('allows_decimal'));

        return $result->isFailure()
            ? ApiResponse::error($result->error())
            : ApiResponse::success($this->queries->units($unit)[0], 'Unit updated.');
    }

    /**
     * Delete a unit
     *
     * Requires `catalog.manage`. 409 `UNIT_IN_USE` when products reference it.
     */
    public function destroy(string $unit): JsonResponse
    {
        $result = $this->handlers->delete($unit);

        return $result->isFailure() ? ApiResponse::error($result->error()) : ApiResponse::success(null, 'Unit deleted.');
    }
}
