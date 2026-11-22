<?php

declare(strict_types=1);

namespace App\Modules\Products\Domain;

use InvalidArgumentException;

/** Stock keeping unit: unique product code, stored uppercase. */
final readonly class Sku
{
    public const string PATTERN = '/^[A-Z0-9._-]{2,40}$/';

    public string $value;

    public function __construct(string $value)
    {
        $normalized = strtoupper(trim($value));

        if (preg_match(self::PATTERN, $normalized) !== 1) {
            throw new InvalidArgumentException("Invalid SKU [{$value}].");
        }

        $this->value = $normalized;
    }
}
