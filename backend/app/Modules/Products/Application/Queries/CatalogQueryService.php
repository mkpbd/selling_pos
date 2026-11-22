<?php

declare(strict_types=1);

namespace App\Modules\Products\Application\Queries;

use App\Shared\Application\Pagination\PageRequest;
use App\Shared\Application\Pagination\PageResult;

/**
 * Read side of the Products context.
 */
interface CatalogQueryService
{
    /**
     * Filters: `category_id`, `is_active`. Search: sku, name, barcode.
     *
     * @return PageResult<ProductView>
     */
    public function paginateProducts(PageRequest $request): PageResult;

    public function findProduct(string $id): ?ProductView;

    /**
     * @return list<array{id: string, name: string, description: string|null, is_active: bool, products_count: int, created_at: string|null, updated_at: string|null}>
     */
    public function categories(?string $search = null, ?string $id = null): array;

    /**
     * @return list<array{id: string, code: string, name: string, allows_decimal: bool, products_count: int, created_at: string|null, updated_at: string|null}>
     */
    public function units(?string $id = null): array;
}
