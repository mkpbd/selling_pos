<?php

declare(strict_types=1);

namespace App\Modules\Products\Domain;

interface ProductRepository
{
    public function nextId(): string;

    public function find(string $id): ?Product;

    public function skuExists(Sku $sku, ?string $exceptId = null): bool;

    public function barcodeExists(string $barcode, ?string $exceptId = null): bool;

    public function save(Product $product): void;
}
