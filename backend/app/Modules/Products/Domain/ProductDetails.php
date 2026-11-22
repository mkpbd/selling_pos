<?php

declare(strict_types=1);

namespace App\Modules\Products\Domain;

use App\Shared\Domain\ValueObjects\Money;
use App\Shared\Domain\ValueObjects\Percentage;

/**
 * Immutable attribute set of a product.
 */
final readonly class ProductDetails
{
    public function __construct(
        public Sku $sku,
        public ?string $barcode,
        public string $name,
        public ?string $description,
        public ?string $categoryId,
        public string $unitId,
        public Money $costPrice,
        public Money $sellingPrice,
        public Percentage $taxRate,
        public bool $trackStock,
        public bool $isActive,
    ) {
        $costPrice->ensureNonNegative();
        $sellingPrice->ensureNonNegative();
    }
}
