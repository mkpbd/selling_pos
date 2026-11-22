<?php

declare(strict_types=1);

namespace App\Modules\Products\Domain\Events;

use App\Modules\Products\Domain\ProductDetails;
use App\Shared\Domain\Events\BaseDomainEvent;

/**
 * Published language of the Products context: a full snapshot of the
 * product after the change. Consumed by Inventory to maintain its local
 * product projection.
 */
final class ProductChanged extends BaseDomainEvent
{
    /**
     * @param  'created'|'updated'  $action
     */
    public function __construct(
        public readonly string $action,
        public readonly string $productId,
        public readonly string $sku,
        public readonly ?string $barcode,
        public readonly string $productName,
        public readonly ?string $categoryId,
        public readonly string $unitId,
        public readonly string $unitCode,
        public readonly bool $allowsDecimal,
        public readonly string $costPrice,
        public readonly string $sellingPrice,
        public readonly bool $trackStock,
        public readonly bool $isActive,
    ) {
        parent::__construct();
    }

    /**
     * @param  'created'|'updated'  $action
     * @param  array{unit_code: string, allows_decimal: bool}  $unit
     */
    public static function from(string $action, string $productId, ProductDetails $d, array $unit): self
    {
        return new self(
            $action,
            $productId,
            $d->sku->value,
            $d->barcode,
            $d->name,
            $d->categoryId,
            $d->unitId,
            $unit['unit_code'],
            $unit['allows_decimal'],
            (string) $d->costPrice,
            (string) $d->sellingPrice,
            $d->trackStock,
            $d->isActive,
        );
    }

    public function name(): string
    {
        return 'products.product_'.$this->action;
    }

    public function payload(): array
    {
        return [
            'product_id' => $this->productId,
            'sku' => $this->sku,
            'name' => $this->productName,
            'cost_price' => $this->costPrice,
            'selling_price' => $this->sellingPrice,
            'track_stock' => $this->trackStock,
            'is_active' => $this->isActive,
        ];
    }
}
