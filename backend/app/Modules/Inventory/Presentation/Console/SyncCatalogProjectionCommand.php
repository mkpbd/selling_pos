<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Presentation\Console;

use App\Modules\Inventory\Infrastructure\Persistence\DbInventoryProductRepository;
use App\Modules\Products\Application\Contracts\ProductCatalog;
use App\Modules\Products\Domain\Events\ProductChanged;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('inventory:sync-catalog')]
#[Description('Rebuild the inventory product projection from the Products catalog')]
final class SyncCatalogProjectionCommand extends Command
{
    public function handle(ProductCatalog $catalog, DbInventoryProductRepository $projection): int
    {
        $count = 0;
        $catalog->eachSnapshot(function (ProductChanged $snapshot) use ($projection, &$count): void {
            $projection->project($snapshot);
            $count++;
        });

        $this->components->info("Projected {$count} products.");

        return self::SUCCESS;
    }
}
