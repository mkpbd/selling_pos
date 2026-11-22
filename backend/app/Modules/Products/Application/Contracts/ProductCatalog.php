<?php

declare(strict_types=1);

namespace App\Modules\Products\Application\Contracts;

use App\Modules\Products\Domain\Events\ProductChanged;

/**
 * Published contract of the Products context for consumers that keep a
 * local projection (e.g. Inventory) and need to rebuild it.
 */
interface ProductCatalog
{
    /**
     * Stream a snapshot of every product, in chunks.
     *
     * @param  callable(ProductChanged): void  $consumer
     */
    public function eachSnapshot(callable $consumer): void;
}
