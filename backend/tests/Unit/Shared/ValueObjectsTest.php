<?php

use App\Shared\Domain\ValueObjects\Money;
use App\Shared\Domain\ValueObjects\Percentage;
use App\Shared\Domain\ValueObjects\Quantity;

describe('Money', function () {
    it('parses strings, ints and floats exactly', function (string|int|float $in, string $out) {
        expect((string) Money::of($in))->toBe($out);
    })->with([
        ['12.5', '12.50'],
        [7, '7.00'],
        [19.99, '19.99'],
        ['0.1', '0.10'],
        ['-3.05', '-3.05'],
    ]);

    it('rejects more than 2 decimals and garbage', function (string $in) {
        Money::of($in);
    })->throws(InvalidArgumentException::class)->with(['1.005', 'abc', '1e5', '']);

    it('multiplies by quantity with half-up rounding', function () {
        expect((string) Money::of('35.00')->times(Quantity::of('24')))->toBe('840.00')
            ->and((string) Money::of('10.00')->times(Quantity::of('0.333')))->toBe('3.33')
            ->and((string) Money::of('0.05')->times(Quantity::of('0.5')))->toBe('0.03');
    });

    it('adds without float drift', function () {
        $sum = Money::zero();
        foreach (range(1, 10) as $_) {
            $sum = $sum->plus(Money::of('0.1'));
        }

        expect((string) $sum)->toBe('1.00');
    });
});

describe('Quantity', function () {
    it('formats with 3 decimals and supports signs', function () {
        expect((string) Quantity::of('2'))->toBe('2.000')
            ->and((string) Quantity::of('0.25')->negate())->toBe('-0.250')
            ->and(Quantity::of('3.000')->isWhole())->toBeTrue()
            ->and(Quantity::of('3.5')->isWhole())->toBeFalse();
    });

    it('rejects more than 3 decimals', function () {
        Quantity::of('1.0001');
    })->throws(InvalidArgumentException::class);
});

describe('Percentage', function () {
    it('bounds 0..100 and computes ratios', function () {
        expect((string) Percentage::of('5'))->toBe('5.00')
            ->and(Percentage::ratio(1000, 4500))->toBe('22.22')
            ->and(Percentage::ratio(5, 0))->toBeNull();
    });

    it('rejects values above 100', function () {
        Percentage::of('100.01');
    })->throws(InvalidArgumentException::class);
});
