<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Infrastructure\Persistence;

use App\Modules\Inventory\Domain\InventoryProduct;
use App\Modules\Inventory\Domain\InventoryProductRepository;
use App\Modules\Products\Domain\Events\ProductChanged;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Reads and maintains the local catalog projection (inventory_products).
 */
final class DbInventoryProductRepository implements InventoryProductRepository
{
    public function find(string $productId): ?InventoryProduct
    {
        if (! Str::isUuid($productId)) {
            return null;
        }

        $row = DB::table('inventory_products')->where('product_id', $productId)->first();

        return $row === null ? null : new InventoryProduct(
            (string) $row->product_id,
            (bool) $row->allows_decimal,
            (bool) $row->track_stock,
            (bool) $row->is_active,
        );
    }

    public function project(ProductChanged $e): void
    {
        DB::table('inventory_products')->upsert([[
            'product_id' => $e->productId,
            'sku' => $e->sku,
            'name' => $e->productName,
            'barcode' => $e->barcode,
            'unit_id' => $e->unitId,
            'unit_code' => $e->unitCode,
            'allows_decimal' => $e->allowsDecimal,
            'cost_price' => $e->costPrice,
            'track_stock' => $e->trackStock,
            'is_active' => $e->isActive,
            'synced_at' => now(),
        ]], ['product_id'], ['sku', 'name', 'barcode', 'unit_id', 'unit_code', 'allows_decimal', 'cost_price', 'track_stock', 'is_active', 'synced_at']);
    }

    public function projectUnit(string $unitId, string $code, bool $allowsDecimal): void
    {
        DB::table('inventory_products')->where('unit_id', $unitId)->update([
            'unit_code' => $code,
            'allows_decimal' => $allowsDecimal,
            'synced_at' => now(),
        ]);
    }
}
