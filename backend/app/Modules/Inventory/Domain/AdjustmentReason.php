<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Domain;

enum AdjustmentReason: string
{
    case Opening = 'opening';
    case Received = 'received';
    case Damaged = 'damaged';
    case Expired = 'expired';
    case Lost = 'lost';
    case Returned = 'returned';
    case Correction = 'correction';
    case Other = 'other';
}
