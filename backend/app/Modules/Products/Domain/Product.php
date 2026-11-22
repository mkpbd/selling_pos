<?php

declare(strict_types=1);

namespace App\Modules\Products\Domain;

use App\Modules\Products\Domain\Events\ProductChanged;
use App\Shared\Domain\AggregateRoot;

/**
 * A sellable item of the catalog. Stock levels live in the Inventory context.
 */
final class Product extends AggregateRoot
{
    private function __construct(
        public readonly string $id,
        private ProductDetails $details,
    ) {}

    /**
     * @param  array{unit_code: string, allows_decimal: bool}  $unit  unit facts for the published event
     */
    public static function create(string $id, ProductDetails $details, array $unit): self
    {
        $product = new self($id, $details);
        $product->record(ProductChanged::from('created', $id, $details, $unit));

        return $product;
    }

    public static function reconstitute(string $id, ProductDetails $details): self
    {
        return new self($id, $details);
    }

    /**
     * @param  array{unit_code: string, allows_decimal: bool}  $unit
     */
    public function update(ProductDetails $details, array $unit): void
    {
        $this->details = $details;
        $this->record(ProductChanged::from('updated', $this->id, $details, $unit));
    }

    public function details(): ProductDetails
    {
        return $this->details;
    }
}
