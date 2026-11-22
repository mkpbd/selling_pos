<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Contracts;

interface PasswordHasher
{
    public function hash(string $plain): string;

    public function check(string $plain, string $hash): bool;
}
