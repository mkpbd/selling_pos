<?php

declare(strict_types=1);

namespace App\Modules\Products\Domain;

interface UnitRepository
{
    public function nextId(): string;

    public function find(string $id): ?Unit;

    public function codeExists(string $code, ?string $exceptId = null): bool;

    public function isInUse(string $id): bool;

    public function save(Unit $unit): void;

    public function delete(string $id): void;
}
