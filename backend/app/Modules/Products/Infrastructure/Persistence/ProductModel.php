<?php

declare(strict_types=1);

namespace App\Modules\Products\Infrastructure\Persistence;

use App\Modules\Products\Infrastructure\Database\Factories\ProductModelFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $sku
 * @property string|null $barcode
 * @property string $name
 * @property string|null $description
 * @property string|null $category_id
 * @property string $unit_id
 * @property string $cost_price
 * @property string $selling_price
 * @property string $tax_rate
 * @property bool $track_stock
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read CategoryModel|null $category
 * @property-read UnitModel $unit
 */
final class ProductModel extends Model
{
    /** @use HasFactory<ProductModelFactory> */
    use HasFactory, HasUuids;

    protected $table = 'products';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['track_stock' => 'boolean', 'is_active' => 'boolean'];
    }

    /**
     * @return BelongsTo<CategoryModel, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(CategoryModel::class, 'category_id');
    }

    /**
     * @return BelongsTo<UnitModel, $this>
     */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(UnitModel::class, 'unit_id');
    }

    protected static function newFactory(): ProductModelFactory
    {
        return ProductModelFactory::new();
    }
}
