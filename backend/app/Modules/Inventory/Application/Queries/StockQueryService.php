<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Application\Queries;

use App\Shared\Application\Pagination\PageRequest;
use App\Shared\Application\Pagination\PageResult;

/**
 * Read side of Inventory. All results are scoped to one branch.
 *
 * @phpstan-type StockItemRow array{product_id: string, sku: string, name: string, barcode: string|null, unit: array{code: string, allows_decimal: bool}, quantity: string, reorder_level: string, status: 'in_stock'|'low_stock'|'out_of_stock', stock_value: string, last_movement_at: string|null}
 * @phpstan-type MovementRow array{id: string, product_id: string, sku: string|null, product_name: string|null, type: string, reason: string|null, quantity: string, balance_after: string, note: string|null, user: array{id: string, name: string}|null, created_at: string|null}
 */
interface StockQueryService
{
    /**
     * Filters: `status`. Search: sku, name, barcode.
     *
     * @return PageResult<StockItemRow>
     */
    public function paginateStock(string $branchId, PageRequest $request): PageResult;

    /**
     * @return StockItemRow|null
     */
    public function findStock(string $branchId, string $productId): ?array;

    /**
     * @return array{tracked_products: int, in_stock: int, low_stock: int, out_of_stock: int, stock_value: string}
     */
    public function summary(string $branchId): array;

    /**
     * Filters: `product_id`, `type`, `from`, `to` (Y-m-d, inclusive).
     *
     * @return PageResult<MovementRow>
     */
    public function paginateMovements(string $branchId, PageRequest $request): PageResult;

    /**
     * @return MovementRow|null
     */
    public function findMovement(string $movementId): ?array;
}
