<?php

use App\Modules\Inventory\Domain\AdjustmentReason;
use App\Modules\Inventory\Domain\AdjustmentType;
use App\Modules\Inventory\Domain\MovementType;
use App\Modules\Inventory\Domain\StockItem;
use App\Shared\Domain\ValueObjects\Quantity;

function stockItem(string $onHand = '10'): StockItem
{
    return new StockItem('branch', 'product', Quantity::of($onHand), Quantity::zero());
}

it('adds stock and records a signed movement', function () {
    $item = stockItem('10');
    $movement = $item->adjust('m1', AdjustmentType::In, Quantity::of('5'), AdjustmentReason::Received, null, 'u1')->value();

    expect((string) $item->onHand())->toBe('15.000')
        ->and($movement->type)->toBe(MovementType::AdjustmentIn)
        ->and((string) $movement->delta)->toBe('5.000')
        ->and((string) $movement->balanceAfter)->toBe('15.000')
        ->and($item->releaseEvents())->toHaveCount(1);
});

it('removes stock but never below zero', function () {
    $item = stockItem('3');

    $fail = $item->adjust('m1', AdjustmentType::Out, Quantity::of('4'), AdjustmentReason::Damaged, null, null);
    expect($fail->error()->code)->toBe('INSUFFICIENT_STOCK')
        ->and($fail->error()->details['available'])->toBe('3.000')
        ->and((string) $item->onHand())->toBe('3.000');

    $ok = $item->adjust('m2', AdjustmentType::Out, Quantity::of('3'), AdjustmentReason::Damaged, null, null)->value();
    expect((string) $ok->delta)->toBe('-3.000')->and($item->onHand()->isZero())->toBeTrue();
});

it('records the difference for a physical count', function () {
    $item = stockItem('10');

    $movement = $item->adjust('m1', AdjustmentType::Count, Quantity::of('7.5'), AdjustmentReason::Correction, 'cycle count', null)->value();

    expect($movement->type)->toBe(MovementType::Count)
        ->and((string) $movement->delta)->toBe('-2.500')
        ->and((string) $item->onHand())->toBe('7.500');
});

it('rejects counts that change nothing and non-positive in/out quantities', function () {
    $item = stockItem('10');

    expect($item->adjust('m1', AdjustmentType::Count, Quantity::of('10'), AdjustmentReason::Correction, null, null)->error()->code)
        ->toBe('NO_STOCK_CHANGE')
        ->and($item->adjust('m2', AdjustmentType::In, Quantity::zero(), AdjustmentReason::Received, null, null)->error()->code)
        ->toBe('VALIDATION_FAILED');
});
