<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Infrastructure\Listeners;

use App\Modules\Inventory\Infrastructure\Persistence\DbInventoryProductRepository;
use App\Modules\Products\Domain\Events\ProductChanged;
use App\Modules\Products\Domain\Events\UnitChanged;

/**
 * Keeps Inventory's product projection in sync with the Products context.
 * Runs after the Products transaction commits. If it ever fails, rebuild
 * with `php artisan inventory:sync-catalog`.
 */
final readonly class ProjectCatalogChanges
{
    public function __construct(private DbInventoryProductRepository $projection) {}

    public function handleProduct(ProductChanged $event): void
    {
        $this->projection->project($event);
    }

    public function handleUnit(UnitChanged $event): void
    {
        $this->projection->projectUnit($event->unitId, $event->code, $event->allowsDecimal);
    }
}
