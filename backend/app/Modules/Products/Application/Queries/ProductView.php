<?php

declare(strict_types=1);

namespace App\Modules\Products\Application\Queries;

use DateTimeInterface;

final readonly class ProductView
{
    /**
     * @param  array{id: string, name: string}|null  $category
     * @param  array{id: string, code: string, name: string, allows_decimal: bool}  $unit
     */
    public function __construct(
        public string $id,
        public string $sku,
        public ?string $barcode,
        public string $name,
        public ?string $description,
        public ?array $category,
        public array $unit,
        public string $costPrice,
        public string $sellingPrice,
        public string $taxRate,
        public ?string $marginPercent,
        public bool $trackStock,
        public bool $isActive,
        public ?DateTimeInterface $createdAt,
        public ?DateTimeInterface $updatedAt,
    ) {}
}
