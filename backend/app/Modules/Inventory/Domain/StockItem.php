<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Domain;

use App\Modules\Inventory\Domain\Events\StockAdjusted;
use App\Shared\Domain\AggregateRoot;
use App\Shared\Domain\Result\Result;
use App\Shared\Domain\ValueObjects\Quantity;

/**
 * On-hand stock of one product in one branch. Every change produces a
 * ledger movement; stock can never go below zero.
 */
final class StockItem extends AggregateRoot
{
    public function __construct(
        public readonly string $branchId,
        public readonly string $productId,
        private Quantity $onHand,
        private Quantity $reorderLevel,
    ) {}

    /**
     * @return Result<StockMovement>
     */
    public function adjust(
        string $movementId,
        AdjustmentType $type,
        Quantity $quantity,
        AdjustmentReason $reason,
        ?string $note,
        ?string $userId,
    ): Result {
        if ($quantity->isNegative() || ($type !== AdjustmentType::Count && $quantity->isZero())) {
            return Result::failure(InventoryErrors::invalidQuantity());
        }

        [$movementType, $delta] = match ($type) {
            AdjustmentType::In => [MovementType::AdjustmentIn, $quantity],
            AdjustmentType::Out => [MovementType::AdjustmentOut, $quantity->negate()],
            AdjustmentType::Count => [MovementType::Count, $quantity->minus($this->onHand)],
        };

        if ($delta->isZero()) {
            return Result::failure(InventoryErrors::noChange());
        }

        $after = $this->onHand->plus($delta);
        if ($after->isNegative()) {
            return Result::failure(InventoryErrors::insufficientStock($this->onHand));
        }

        $this->onHand = $after;

        $movement = new StockMovement($movementId, $this->branchId, $this->productId, $movementType, $reason, $delta, $after, $note, $userId);
        $this->record(new StockAdjusted($movement));

        return Result::success($movement);
    }

    /**
     * @return Result<null>
     */
    public function setReorderLevel(Quantity $level): Result
    {
        if ($level->isNegative()) {
            return Result::failure(InventoryErrors::invalidQuantity('reorder_level'));
        }

        $this->reorderLevel = $level;

        return Result::success();
    }

    public function onHand(): Quantity
    {
        return $this->onHand;
    }

    public function reorderLevel(): Quantity
    {
        return $this->reorderLevel;
    }
}
