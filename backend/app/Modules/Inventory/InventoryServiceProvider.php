<?php

declare(strict_types=1);

namespace App\Modules\Inventory;

use App\Modules\Inventory\Application\Queries\StockQueryService;
use App\Modules\Inventory\Domain\InventoryPermission;
use App\Modules\Inventory\Domain\InventoryProductRepository;
use App\Modules\Inventory\Domain\StockRepository;
use App\Modules\Inventory\Infrastructure\Listeners\ProjectCatalogChanges;
use App\Modules\Inventory\Infrastructure\Persistence\DbInventoryProductRepository;
use App\Modules\Inventory\Infrastructure\Persistence\DbStockQueryService;
use App\Modules\Inventory\Infrastructure\Persistence\DbStockRepository;
use App\Modules\Inventory\Presentation\Console\SyncCatalogProjectionCommand;
use App\Modules\Products\Domain\Events\ProductChanged;
use App\Modules\Products\Domain\Events\UnitChanged;
use App\Shared\Application\Authorization\PermissionRegistry;
use App\Shared\Infrastructure\Providers\ModuleServiceProvider;
use Illuminate\Support\Facades\Event;

/**
 * Inventory bounded context: per-branch stock levels and the append-only
 * movement ledger. Consumes Products events into a local projection.
 */
final class InventoryServiceProvider extends ModuleServiceProvider
{
    public array $singletons = [
        StockRepository::class => DbStockRepository::class,
        InventoryProductRepository::class => DbInventoryProductRepository::class,
        StockQueryService::class => DbStockQueryService::class,
    ];

    protected function bootModule(): void
    {
        $this->app->make(PermissionRegistry::class)->register(InventoryPermission::class);

        Event::listen(ProductChanged::class, [ProjectCatalogChanges::class, 'handleProduct']);
        Event::listen(UnitChanged::class, [ProjectCatalogChanges::class, 'handleUnit']);

        if ($this->app->runningInConsole()) {
            $this->commands([SyncCatalogProjectionCommand::class]);
        }
    }
}
