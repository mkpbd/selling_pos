<?php

declare(strict_types=1);

namespace App\Modules\Identity\Domain;

interface UserRepository
{
    public function nextId(): string;

    public function find(string $id): ?User;

    public function findByEmail(Email $email): ?User;

    public function emailExists(Email $email, ?string $exceptId = null): bool;

    public function save(User $user): void;

    public function recordLogin(string $id): void;
}
