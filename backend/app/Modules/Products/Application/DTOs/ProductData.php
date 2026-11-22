<?php

declare(strict_types=1);

namespace App\Modules\Products\Application\DTOs;

final readonly class ProductData
{
    public function __construct(
        public string $sku,
        public ?string $barcode,
        public string $name,
        public ?string $description,
        public ?string $categoryId,
        public string $unitId,
        public string $costPrice,
        public string $sellingPrice,
        public string $taxRate,
        public bool $trackStock,
        public bool $isActive,
    ) {}

    /**
     * @param  array<string, mixed>  $input  validated input
     */
    public static function fromArray(array $input): self
    {
        $blank = static fn (mixed $v): ?string => $v === null || trim((string) $v) === '' ? null : trim((string) $v);

        return new self(
            sku: (string) $input['sku'],
            barcode: $blank($input['barcode'] ?? null),
            name: trim((string) $input['name']),
            description: $blank($input['description'] ?? null),
            categoryId: $blank($input['category_id'] ?? null),
            unitId: (string) $input['unit_id'],
            costPrice: (string) $input['cost_price'],
            sellingPrice: (string) $input['selling_price'],
            taxRate: (string) ($input['tax_rate'] ?? '0'),
            trackStock: (bool) ($input['track_stock'] ?? true),
            isActive: (bool) ($input['is_active'] ?? true),
        );
    }
}
