<?php

declare(strict_types=1);

namespace App\Modules\Products\Infrastructure\Persistence;

use App\Modules\Products\Domain\Product;
use App\Modules\Products\Domain\ProductDetails;
use App\Modules\Products\Domain\ProductRepository;
use App\Modules\Products\Domain\Sku;
use App\Shared\Domain\ValueObjects\Money;
use App\Shared\Domain\ValueObjects\Percentage;
use Illuminate\Support\Str;

final class EloquentProductRepository implements ProductRepository
{
    public function nextId(): string
    {
        return (string) Str::uuid7();
    }

    public function find(string $id): ?Product
    {
        $m = Str::isUuid($id) ? ProductModel::query()->find($id) : null;

        return $m === null ? null : Product::reconstitute($m->id, new ProductDetails(
            new Sku($m->sku),
            $m->barcode,
            $m->name,
            $m->description,
            $m->category_id,
            $m->unit_id,
            Money::of($m->cost_price),
            Money::of($m->selling_price),
            Percentage::of($m->tax_rate),
            $m->track_stock,
            $m->is_active,
        ));
    }

    public function skuExists(Sku $sku, ?string $exceptId = null): bool
    {
        return ProductModel::query()->where('sku', $sku->value)
            ->when($exceptId !== null, fn ($q) => $q->whereKeyNot($exceptId))
            ->exists();
    }

    public function barcodeExists(string $barcode, ?string $exceptId = null): bool
    {
        return ProductModel::query()->where('barcode', $barcode)
            ->when($exceptId !== null, fn ($q) => $q->whereKeyNot($exceptId))
            ->exists();
    }

    public function save(Product $product): void
    {
        $d = $product->details();

        ProductModel::query()->updateOrCreate(['id' => $product->id], [
            'sku' => $d->sku->value,
            'barcode' => $d->barcode,
            'name' => $d->name,
            'description' => $d->description,
            'category_id' => $d->categoryId,
            'unit_id' => $d->unitId,
            'cost_price' => (string) $d->costPrice,
            'selling_price' => (string) $d->sellingPrice,
            'tax_rate' => (string) $d->taxRate,
            'track_stock' => $d->trackStock,
            'is_active' => $d->isActive,
        ]);
    }
}
