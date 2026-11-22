<?php

declare(strict_types=1);

namespace App\Modules\Products\Presentation\Http\Controllers;

use App\Modules\Products\Application\Commands\CategoryHandlers;
use App\Modules\Products\Application\Queries\CatalogQueryService;
use App\Modules\Products\Presentation\Http\Requests\CategoryRequest;
use App\Shared\Presentation\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @tags Catalog settings
 */
final readonly class CategoryController
{
    public function __construct(
        private CatalogQueryService $queries,
        private CategoryHandlers $handlers,
    ) {}

    /**
     * List categories
     *
     * Requires `products.view`. Not paginated.
     *
     * @response array{success: true, data: list<array{id: string, name: string, description: string|null, is_active: bool, products_count: int, created_at: string|null, updated_at: string|null}>, meta: array{request_id: string}}
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');

        return ApiResponse::success($this->queries->categories(is_string($search) ? $search : null));
    }

    /**
     * Create a category
     *
     * Requires `catalog.manage`. 409 `CATEGORY_NAME_TAKEN`.
     *
     * @status 201
     */
    public function store(CategoryRequest $request): JsonResponse
    {
        $result = $this->handlers->create(
            trim($request->validated('name')),
            $request->validated('description'),
            (bool) $request->validated('is_active', true),
        );

        return $result->isFailure()
            ? ApiResponse::error($result->error())
            : ApiResponse::created($this->queries->categories(id: $result->value())[0], 'Category created.');
    }

    /**
     * Update a category
     *
     * Requires `catalog.manage`.
     */
    public function update(CategoryRequest $request, string $category): JsonResponse
    {
        $result = $this->handlers->update(
            $category,
            trim($request->validated('name')),
            $request->validated('description'),
            (bool) $request->validated('is_active', true),
        );

        return $result->isFailure()
            ? ApiResponse::error($result->error())
            : ApiResponse::success($this->queries->categories(id: $category)[0], 'Category updated.');
    }

    /**
     * Delete a category
     *
     * Requires `catalog.manage`. 409 `CATEGORY_IN_USE` when products reference it.
     */
    public function destroy(string $category): JsonResponse
    {
        $result = $this->handlers->delete($category);

        return $result->isFailure() ? ApiResponse::error($result->error()) : ApiResponse::success(null, 'Category deleted.');
    }
}
