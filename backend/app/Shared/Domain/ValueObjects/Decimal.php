<?php

declare(strict_types=1);

namespace App\Shared\Domain\ValueObjects;

use InvalidArgumentException;

/**
 * Fixed-point decimal helpers on integer minor units. Never uses floats.
 *
 * @internal used by Money, Quantity and Percentage
 */
final class Decimal
{
    /**
     * Parse "12.5", "-3", 7, "0.125" into integer minor units with $scale decimals.
     */
    public static function toMinor(string|int|float $value, int $scale, bool $allowNegative): int
    {
        if (is_float($value)) {
            // JSON numbers arrive as floats; round to scale via string formatting.
            $value = number_format($value, $scale, '.', '');
        }

        $value = trim((string) $value);
        $sign = $allowNegative ? '-?' : '';

        if (preg_match('/^('.$sign.')(\d{1,13})(?:\.(\d{1,'.$scale.'}))?$/', $value, $m) !== 1) {
            throw new InvalidArgumentException("Invalid decimal [{$value}] (max {$scale} decimals).");
        }

        $minor = (int) $m[2] * (10 ** $scale) + (int) str_pad($m[3] ?? '', $scale, '0');

        return $m[1] === '-' ? -$minor : $minor;
    }

    public static function format(int $minor, int $scale): string
    {
        $sign = $minor < 0 ? '-' : '';
        $abs = abs($minor);
        $factor = 10 ** $scale;

        return $sign.intdiv($abs, $factor).'.'.str_pad((string) ($abs % $factor), $scale, '0', STR_PAD_LEFT);
    }

    /** Integer division rounding half away from zero. */
    public static function divRound(int $numerator, int $denominator): int
    {
        $q = intdiv($numerator, $denominator);
        $r = $numerator % $denominator;

        if (abs($r) * 2 >= abs($denominator)) {
            $q += ($numerator < 0) === ($denominator < 0) ? 1 : -1;
        }

        return $q;
    }
}
