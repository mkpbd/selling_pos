<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Application\Commands;

use App\Modules\Inventory\Domain\AdjustmentReason;
use App\Modules\Inventory\Domain\AdjustmentType;

final readonly class AdjustStock
{
    public function __construct(
        public string $branchId,
        public string $productId,
        public AdjustmentType $type,
        public string $quantity,
        public AdjustmentReason $reason,
        public ?string $note,
        public ?string $userId,
    ) {}
}
