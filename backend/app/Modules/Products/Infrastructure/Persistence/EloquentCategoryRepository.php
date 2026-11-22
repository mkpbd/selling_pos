<?php

declare(strict_types=1);

namespace App\Modules\Products\Infrastructure\Persistence;

use App\Modules\Products\Domain\Category;
use App\Modules\Products\Domain\CategoryRepository;
use Illuminate\Support\Str;

final class EloquentCategoryRepository implements CategoryRepository
{
    public function nextId(): string
    {
        return (string) Str::uuid7();
    }

    public function find(string $id): ?Category
    {
        $m = Str::isUuid($id) ? CategoryModel::query()->find($id) : null;

        return $m === null ? null : Category::reconstitute($m->id, $m->name, $m->description, $m->is_active);
    }

    public function nameExists(string $name, ?string $exceptId = null): bool
    {
        return CategoryModel::query()
            ->whereRaw('lower(name) = ?', [mb_strtolower(trim($name))])
            ->when($exceptId !== null, fn ($q) => $q->whereKeyNot($exceptId))
            ->exists();
    }

    public function isInUse(string $id): bool
    {
        return ProductModel::query()->where('category_id', $id)->exists();
    }

    public function save(Category $category): void
    {
        CategoryModel::query()->updateOrCreate(['id' => $category->id], [
            'name' => $category->name(),
            'description' => $category->description(),
            'is_active' => $category->isActive(),
        ]);
    }

    public function delete(string $id): void
    {
        CategoryModel::query()->whereKey($id)->delete();
    }
}
