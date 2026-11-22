<?php

declare(strict_types=1);

namespace App\Shared\Domain\ValueObjects;

/**
 * Stock quantity with 3 decimals, held as integer thousandths. May be
 * signed (movement deltas). Immutable, float-free.
 */
final readonly class Quantity
{
    public const int SCALE = 3;

    private function __construct(public int $milli) {}

    public static function of(string|int|float $value): self
    {
        return new self(Decimal::toMinor($value, self::SCALE, allowNegative: true));
    }

    public static function ofMilli(int $milli): self
    {
        return new self($milli);
    }

    public static function zero(): self
    {
        return new self(0);
    }

    public function plus(self $other): self
    {
        return new self($this->milli + $other->milli);
    }

    public function minus(self $other): self
    {
        return new self($this->milli - $other->milli);
    }

    public function negate(): self
    {
        return new self(-$this->milli);
    }

    public function isZero(): bool
    {
        return $this->milli === 0;
    }

    public function isNegative(): bool
    {
        return $this->milli < 0;
    }

    public function isPositive(): bool
    {
        return $this->milli > 0;
    }

    public function isWhole(): bool
    {
        return $this->milli % (10 ** self::SCALE) === 0;
    }

    public function greaterThan(self $other): bool
    {
        return $this->milli > $other->milli;
    }

    public function lessThanOrEqual(self $other): bool
    {
        return $this->milli <= $other->milli;
    }

    public function equals(self $other): bool
    {
        return $this->milli === $other->milli;
    }

    public function __toString(): string
    {
        return Decimal::format($this->milli, self::SCALE);
    }
}
