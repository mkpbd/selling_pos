<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Infrastructure\Persistence;

use App\Modules\Inventory\Domain\StockItem;
use App\Modules\Inventory\Domain\StockMovement;
use App\Modules\Inventory\Domain\StockRepository;
use App\Shared\Domain\ValueObjects\Quantity;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class DbStockRepository implements StockRepository
{
    public function nextMovementId(): string
    {
        return (string) Str::uuid7();
    }

    public function lockForUpdate(string $branchId, string $productId): StockItem
    {
        DB::table('inventory_stocks')->insertOrIgnore([
            'branch_id' => $branchId,
            'product_id' => $productId,
            'quantity' => '0',
            'reorder_level' => '0',
            'updated_at' => now(),
        ]);

        $row = DB::table('inventory_stocks')
            ->where('branch_id', $branchId)
            ->where('product_id', $productId)
            ->lockForUpdate()
            ->first();

        return new StockItem($branchId, $productId, Quantity::of((string) $row->quantity), Quantity::of((string) $row->reorder_level));
    }

    public function save(StockItem $item): void
    {
        DB::table('inventory_stocks')
            ->where('branch_id', $item->branchId)
            ->where('product_id', $item->productId)
            ->update([
                'quantity' => (string) $item->onHand(),
                'reorder_level' => (string) $item->reorderLevel(),
                'updated_at' => now(),
            ]);
    }

    public function append(StockMovement $movement): void
    {
        $now = now();

        DB::table('inventory_movements')->insert([
            'id' => $movement->id,
            'branch_id' => $movement->branchId,
            'product_id' => $movement->productId,
            'type' => $movement->type->value,
            'reason' => $movement->reason?->value,
            'quantity' => (string) $movement->delta,
            'balance_after' => (string) $movement->balanceAfter,
            'note' => $movement->note,
            'user_id' => $movement->userId,
            'created_at' => $now,
        ]);

        DB::table('inventory_stocks')
            ->where('branch_id', $movement->branchId)
            ->where('product_id', $movement->productId)
            ->update(['last_movement_at' => $now]);
    }
}
