<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Domain;

/**
 * Inventory's local view of a catalog product (kept in sync from
 * ProductChanged events).
 */
final readonly class InventoryProduct
{
    public function __construct(
        public string $productId,
        public bool $allowsDecimal,
        public bool $trackStock,
        public bool $isActive,
    ) {}

    public function isStockable(): bool
    {
        return $this->trackStock && $this->isActive;
    }
}
