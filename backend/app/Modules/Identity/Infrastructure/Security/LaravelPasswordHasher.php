<?php

declare(strict_types=1);

namespace App\Modules\Identity\Infrastructure\Security;

use App\Modules\Identity\Application\Contracts\PasswordHasher;
use Illuminate\Contracts\Hashing\Hasher;

final readonly class LaravelPasswordHasher implements PasswordHasher
{
    public function __construct(private Hasher $hasher) {}

    public function hash(#[\SensitiveParameter] string $plain): string
    {
        return $this->hasher->make($plain);
    }

    public function check(#[\SensitiveParameter] string $plain, string $hash): bool
    {
        return $hash !== '' && $this->hasher->check($plain, $hash);
    }
}
