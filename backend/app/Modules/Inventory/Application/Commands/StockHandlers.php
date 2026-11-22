<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Application\Commands;

use App\Modules\Inventory\Domain\InventoryErrors;
use App\Modules\Inventory\Domain\InventoryProduct;
use App\Modules\Inventory\Domain\InventoryProductRepository;
use App\Modules\Inventory\Domain\StockMovement;
use App\Modules\Inventory\Domain\StockRepository;
use App\Shared\Application\Contracts\EventDispatcher;
use App\Shared\Application\Contracts\TransactionManager;
use App\Shared\Domain\Result\Result;
use App\Shared\Domain\ValueObjects\Quantity;

/**
 * Stock use cases. Each runs in a transaction holding a row lock on the
 * (branch, product) stock record, so concurrent adjustments serialize.
 */
final readonly class StockHandlers
{
    public function __construct(
        private StockRepository $stock,
        private InventoryProductRepository $products,
        private TransactionManager $transactions,
        private EventDispatcher $events,
    ) {}

    /**
     * @return Result<StockMovement>
     */
    public function adjust(AdjustStock $command): Result
    {
        $product = $this->products->find($command->productId);
        $check = $this->checkProduct($product, Quantity::of($command->quantity));
        if ($check->isFailure()) {
            return $check;
        }

        return $this->transactions->run(function () use ($command): Result {
            $item = $this->stock->lockForUpdate($command->branchId, $command->productId);

            $adjusted = $item->adjust(
                $this->stock->nextMovementId(),
                $command->type,
                Quantity::of($command->quantity),
                $command->reason,
                $command->note,
                $command->userId,
            );
            if ($adjusted->isFailure()) {
                return $adjusted;
            }

            $this->stock->save($item);
            $this->stock->append($adjusted->value());
            $this->events->dispatch($item->releaseEvents());

            return $adjusted;
        });
    }

    /**
     * @return Result<null>
     */
    public function setReorderLevel(string $branchId, string $productId, string $level): Result
    {
        $product = $this->products->find($productId);
        $check = $this->checkProduct($product, Quantity::of($level), 'reorder_level');
        if ($check->isFailure()) {
            return $check;
        }

        return $this->transactions->run(function () use ($branchId, $productId, $level): Result {
            $item = $this->stock->lockForUpdate($branchId, $productId);

            $result = $item->setReorderLevel(Quantity::of($level));
            if ($result->isSuccess()) {
                $this->stock->save($item);
            }

            return $result;
        });
    }

    /**
     * @return Result<null>
     */
    private function checkProduct(?InventoryProduct $product, Quantity $quantity, string $field = 'quantity'): Result
    {
        if ($product === null) {
            return Result::failure(InventoryErrors::productNotFound());
        }

        if (! $product->isStockable()) {
            return Result::failure(InventoryErrors::notStockable());
        }

        if (! $product->allowsDecimal && ! $quantity->isWhole()) {
            return Result::failure(InventoryErrors::fractionalQuantity($field));
        }

        return Result::success();
    }
}
