<?php

declare(strict_types=1);

namespace App\Modules\Organization\Domain;

use InvalidArgumentException;

/**
 * Short, unique, human-facing branch identifier (e.g. "HQ", "DHK-01").
 */
final readonly class BranchCode
{
    public const string PATTERN = '/^[A-Z0-9-]{2,20}$/';

    public string $value;

    public function __construct(string $value)
    {
        $normalized = strtoupper(trim($value));

        if (preg_match(self::PATTERN, $normalized) !== 1) {
            throw new InvalidArgumentException("Invalid branch code [{$value}].");
        }

        $this->value = $normalized;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }
}
