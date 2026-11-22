<?php

declare(strict_types=1);

namespace App\Modules\Products\Infrastructure\Persistence;

use App\Modules\Products\Application\Contracts\ProductCatalog;
use App\Modules\Products\Domain\Events\ProductChanged;
use Illuminate\Support\Collection;

final class EloquentProductCatalog implements ProductCatalog
{
    public function eachSnapshot(callable $consumer): void
    {
        ProductModel::query()
            ->with('unit:id,code,allows_decimal')
            ->orderBy('id')
            ->chunkById(500, function (Collection $chunk) use ($consumer): void {
                foreach ($chunk as $m) {
                    /** @var ProductModel $m */
                    $consumer(new ProductChanged(
                        'updated',
                        $m->id,
                        $m->sku,
                        $m->barcode,
                        $m->name,
                        $m->category_id,
                        $m->unit_id,
                        $m->unit->code,
                        $m->unit->allows_decimal,
                        $m->cost_price,
                        $m->selling_price,
                        $m->track_stock,
                        $m->is_active,
                    ));
                }
            });
    }
}
