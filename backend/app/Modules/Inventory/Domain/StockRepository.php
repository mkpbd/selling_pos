<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Domain;

interface StockRepository
{
    public function nextMovementId(): string;

    /**
     * Load the stock item with a row lock (creating a zero row if needed).
     * Must be called inside a transaction.
     */
    public function lockForUpdate(string $branchId, string $productId): StockItem;

    public function save(StockItem $item): void;

    public function append(StockMovement $movement): void;
}
