<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Domain;

use App\Shared\Domain\ValueObjects\Quantity;

/**
 * Immutable ledger entry. `delta` is signed; `balanceAfter` is the on-hand
 * quantity right after the movement.
 */
final readonly class StockMovement
{
    public function __construct(
        public string $id,
        public string $branchId,
        public string $productId,
        public MovementType $type,
        public ?AdjustmentReason $reason,
        public Quantity $delta,
        public Quantity $balanceAfter,
        public ?string $note,
        public ?string $userId,
    ) {}
}
