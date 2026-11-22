<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Domain;

/**
 * Kind of stock movement in the ledger. Sales/Purchases/Transfers will add
 * their own cases when those modules arrive.
 */
enum MovementType: string
{
    case AdjustmentIn = 'adjustment_in';
    case AdjustmentOut = 'adjustment_out';
    case Count = 'count';
}
