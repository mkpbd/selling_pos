<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Domain;

enum AdjustmentType: string
{
    /** Add the given quantity. */
    case In = 'in';
    /** Remove the given quantity. */
    case Out = 'out';
    /** Physical count: set on-hand to the given absolute quantity. */
    case Count = 'count';
}
