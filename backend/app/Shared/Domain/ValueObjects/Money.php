<?php

declare(strict_types=1);

namespace App\Shared\Domain\ValueObjects;

use InvalidArgumentException;

/**
 * Monetary amount in the company currency, held as integer minor units
 * (2 decimals). Immutable, float-free.
 */
final readonly class Money
{
    public const int SCALE = 2;

    private function __construct(public int $minor) {}

    public static function of(string|int|float $amount): self
    {
        return new self(Decimal::toMinor($amount, self::SCALE, allowNegative: true));
    }

    public static function ofMinor(int $minor): self
    {
        return new self($minor);
    }

    public static function zero(): self
    {
        return new self(0);
    }

    public function plus(self $other): self
    {
        return new self($this->minor + $other->minor);
    }

    public function minus(self $other): self
    {
        return new self($this->minor - $other->minor);
    }

    /** Amount × quantity, rounded half away from zero to the cent. */
    public function times(Quantity $quantity): self
    {
        return new self(Decimal::divRound($this->minor * $quantity->milli, 10 ** Quantity::SCALE));
    }

    public function isNegative(): bool
    {
        return $this->minor < 0;
    }

    public function isZero(): bool
    {
        return $this->minor === 0;
    }

    public function ensureNonNegative(): self
    {
        if ($this->isNegative()) {
            throw new InvalidArgumentException('Amount cannot be negative.');
        }

        return $this;
    }

    public function equals(self $other): bool
    {
        return $this->minor === $other->minor;
    }

    public function __toString(): string
    {
        return Decimal::format($this->minor, self::SCALE);
    }
}
