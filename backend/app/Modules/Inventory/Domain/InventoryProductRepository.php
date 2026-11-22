<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Domain;

interface InventoryProductRepository
{
    public function find(string $productId): ?InventoryProduct;
}
