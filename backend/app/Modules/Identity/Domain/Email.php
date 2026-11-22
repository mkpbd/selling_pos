<?php

declare(strict_types=1);

namespace App\Modules\Identity\Domain;

use InvalidArgumentException;

final readonly class Email
{
    public string $value;

    public function __construct(string $value)
    {
        $normalized = strtolower(trim($value));

        if (filter_var($normalized, FILTER_VALIDATE_EMAIL) === false || strlen($normalized) > 255) {
            throw new InvalidArgumentException('Invalid email address.');
        }

        $this->value = $normalized;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }
}
