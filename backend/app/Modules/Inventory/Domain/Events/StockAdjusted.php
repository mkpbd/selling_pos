<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Domain\Events;

use App\Modules\Inventory\Domain\StockMovement;
use App\Shared\Domain\Events\BaseDomainEvent;

final class StockAdjusted extends BaseDomainEvent
{
    public function __construct(public readonly StockMovement $movement)
    {
        parent::__construct();
    }

    public function name(): string
    {
        return 'inventory.stock_adjusted';
    }

    public function payload(): array
    {
        $m = $this->movement;

        return [
            'movement_id' => $m->id,
            'branch_id' => $m->branchId,
            'product_id' => $m->productId,
            'type' => $m->type->value,
            'reason' => $m->reason?->value,
            'quantity' => (string) $m->delta,
            'balance_after' => (string) $m->balanceAfter,
        ];
    }
}
