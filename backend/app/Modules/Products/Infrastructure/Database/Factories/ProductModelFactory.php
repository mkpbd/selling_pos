<?php

declare(strict_types=1);

namespace App\Modules\Products\Infrastructure\Database\Factories;

use App\Modules\Products\Infrastructure\Persistence\ProductModel;
use App\Modules\Products\Infrastructure\Persistence\UnitModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Persistence-level factory. Note: bypasses domain events, so Inventory's
 * projection is not updated — use the API/handlers in tests that need it.
 *
 * @extends Factory<ProductModel>
 */
final class ProductModelFactory extends Factory
{
    protected $model = ProductModel::class;

    public function definition(): array
    {
        return [
            'sku' => strtoupper(fake()->unique()->bothify('SKU-#####')),
            'barcode' => fake()->unique()->ean13(),
            'name' => ucfirst(fake()->words(3, true)),
            'unit_id' => fn () => UnitModel::query()->firstOrCreate(['code' => 'PCS'], ['name' => 'Piece', 'allows_decimal' => false])->id,
            'cost_price' => '10.00',
            'selling_price' => '15.00',
            'tax_rate' => '0.00',
            'track_stock' => true,
            'is_active' => true,
        ];
    }
}
