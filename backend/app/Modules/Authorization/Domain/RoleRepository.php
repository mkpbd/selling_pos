<?php

declare(strict_types=1);

namespace App\Modules\Authorization\Domain;

interface RoleRepository
{
    public function find(int $id): ?Role;

    public function nameExists(string $name, ?int $exceptId = null): bool;

    public function isAssigned(int $id): bool;

    public function save(Role $role): void;

    public function delete(Role $role): void;
}
