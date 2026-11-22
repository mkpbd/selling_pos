<?php

declare(strict_types=1);

namespace App\Modules\Products\Domain;

interface CategoryRepository
{
    public function nextId(): string;

    public function find(string $id): ?Category;

    public function nameExists(string $name, ?string $exceptId = null): bool;

    public function isInUse(string $id): bool;

    public function save(Category $category): void;

    public function delete(string $id): void;
}
