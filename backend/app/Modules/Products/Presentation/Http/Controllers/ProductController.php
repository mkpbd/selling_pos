<?php

declare(strict_types=1);

namespace App\Modules\Products\Presentation\Http\Controllers;

use App\Modules\Products\Application\Commands\ProductHandlers;
use App\Modules\Products\Application\DTOs\ProductData;
use App\Modules\Products\Application\Queries\CatalogQueryService;
use App\Modules\Products\Domain\CatalogErrors;
use App\Modules\Products\Presentation\Http\Requests\ListProductsRequest;
use App\Modules\Products\Presentation\Http\Requests\ProductRequest;
use App\Modules\Products\Presentation\Http\Resources\ProductResource;
use App\Shared\Presentation\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * @tags Products
 */
final readonly class ProductController
{
    public function __construct(
        private CatalogQueryService $queries,
        private ProductHandlers $handlers,
    ) {}

    /**
     * List products
     *
     * Requires `products.view`.
     *
     * @response array{success: true, data: list<ProductResource>, meta: array{request_id: string, pagination: array{page: int, per_page: int, total: int, last_page: int}}}
     */
    public function index(ListProductsRequest $request): JsonResponse
    {
        return ApiResponse::paginated(
            $this->queries->paginateProducts($request->toPageRequest()),
            static fn (array $items) => ProductResource::collection($items),
        );
    }

    /**
     * Create a product
     *
     * Requires `products.create`. 409 `SKU_TAKEN` / `BARCODE_TAKEN`.
     *
     * @status 201
     *
     * @response array{success: true, data: ProductResource, message: string, meta: array{request_id: string}}
     */
    public function store(ProductRequest $request): JsonResponse
    {
        $result = $this->handlers->create(ProductData::fromArray($request->validated()));

        return $result->isFailure()
            ? ApiResponse::error($result->error())
            : ApiResponse::created(new ProductResource($this->queries->findProduct($result->value())), 'Product created.');
    }

    /**
     * Show a product
     *
     * Requires `products.view`.
     *
     * @response array{success: true, data: ProductResource, meta: array{request_id: string}}
     */
    public function show(string $product): JsonResponse
    {
        $view = $this->queries->findProduct($product);

        return $view === null ? ApiResponse::error(CatalogErrors::productNotFound()) : ApiResponse::success(new ProductResource($view));
    }

    /**
     * Update a product
     *
     * Requires `products.update`. Deactivate with `is_active: false`.
     *
     * @response array{success: true, data: ProductResource, message: string, meta: array{request_id: string}}
     */
    public function update(ProductRequest $request, string $product): JsonResponse
    {
        $result = $this->handlers->update($product, ProductData::fromArray($request->validated()));

        return $result->isFailure()
            ? ApiResponse::error($result->error())
            : ApiResponse::success(new ProductResource($this->queries->findProduct($product)), 'Product updated.');
    }
}
