<?php

declare(strict_types=1);

namespace App\Modules\Organization\Domain;

interface BranchRepository
{
    public function nextId(): string;

    public function find(string $id): ?Branch;

    public function codeExists(BranchCode $code, ?string $exceptId = null): bool;

    public function save(Branch $branch): void;
}
