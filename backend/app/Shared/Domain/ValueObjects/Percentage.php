<?php

declare(strict_types=1);

namespace App\Shared\Domain\ValueObjects;

use InvalidArgumentException;

/**
 * Percentage 0–100 with 2 decimals, held as basis points (1% = 100).
 */
final readonly class Percentage
{
    public const int SCALE = 2;

    private function __construct(public int $basisPoints) {}

    public static function of(string|int|float $value): self
    {
        $bp = Decimal::toMinor($value, self::SCALE, allowNegative: false);

        if ($bp > 10000) {
            throw new InvalidArgumentException('Percentage cannot exceed 100.');
        }

        return new self($bp);
    }

    public static function zero(): self
    {
        return new self(0);
    }

    /** (part / whole) × 100, or null when whole is zero. */
    public static function ratio(int $part, int $whole): ?string
    {
        return $whole === 0 ? null : Decimal::format(Decimal::divRound($part * 10000, $whole), self::SCALE);
    }

    public function __toString(): string
    {
        return Decimal::format($this->basisPoints, self::SCALE);
    }
}
