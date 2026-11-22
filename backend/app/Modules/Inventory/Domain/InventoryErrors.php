<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Domain;

use App\Shared\Domain\Result\Error;
use App\Shared\Domain\ValueObjects\Quantity;

final class InventoryErrors
{
    public static function productNotFound(): Error
    {
        return Error::notFound('PRODUCT_NOT_FOUND', 'Product not found.');
    }

    public static function notStockable(): Error
    {
        return Error::businessRule('PRODUCT_NOT_STOCKABLE', 'Stock is not tracked for this product, or it is inactive.');
    }

    public static function insufficientStock(Quantity $available): Error
    {
        return Error::businessRule('INSUFFICIENT_STOCK', "Insufficient stock. Available: {$available}.", [
            'available' => (string) $available,
        ]);
    }

    public static function noChange(): Error
    {
        return Error::businessRule('NO_STOCK_CHANGE', 'The counted quantity equals the current stock; nothing to adjust.');
    }

    public static function invalidQuantity(string $field = 'quantity'): Error
    {
        return Error::validation('VALIDATION_FAILED', 'The quantity is invalid.', [$field => ['The quantity is invalid.']]);
    }

    public static function fractionalQuantity(string $field = 'quantity'): Error
    {
        return Error::validation('VALIDATION_FAILED', 'This product is counted in whole units.', [
            $field => ['This product is counted in whole units.'],
        ]);
    }
}
