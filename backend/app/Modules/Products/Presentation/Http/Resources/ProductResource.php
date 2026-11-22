<?php

declare(strict_types=1);

namespace App\Modules\Products\Presentation\Http\Resources;

use App\Modules\Products\Application\Queries\ProductView;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read ProductView $resource
 */
final class ProductResource extends JsonResource
{
    /**
     * @return array{id: string, sku: string, barcode: string|null, name: string, description: string|null, category: array{id: string, name: string}|null, unit: array{id: string, code: string, name: string, allows_decimal: bool}, cost_price: string, selling_price: string, tax_rate: string, margin_percent: string|null, track_stock: bool, is_active: bool, created_at: string|null, updated_at: string|null}
     */
    public function toArray(Request $request): array
    {
        $p = $this->resource;

        return [
            'id' => $p->id,
            'sku' => $p->sku,
            'barcode' => $p->barcode,
            'name' => $p->name,
            'description' => $p->description,
            'category' => $p->category,
            'unit' => $p->unit,
            'cost_price' => $p->costPrice,
            'selling_price' => $p->sellingPrice,
            'tax_rate' => $p->taxRate,
            'margin_percent' => $p->marginPercent,
            'track_stock' => $p->trackStock,
            'is_active' => $p->isActive,
            'created_at' => $p->createdAt?->format(DATE_ATOM),
            'updated_at' => $p->updatedAt?->format(DATE_ATOM),
        ];
    }
}
