<?php

declare(strict_types=1);

namespace App\Modules\Organization\Infrastructure\Persistence;

use App\Modules\Organization\Application\Contracts\BranchDirectory;
use App\Modules\Organization\Application\Contracts\BranchSummary;
use Illuminate\Support\Str;

final class EloquentBranchDirectory implements BranchDirectory
{
    public function summaries(array $ids, bool $activeOnly = false): array
    {
        $ids = array_values(array_filter(array_unique($ids), static fn (string $id): bool => Str::isUuid($id)));

        if ($ids === []) {
            return [];
        }

        return BranchModel::query()
            ->whereKey($ids)
            ->when($activeOnly, fn ($q) => $q->where('is_active', true))
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'is_active'])
            ->mapWithKeys(fn (BranchModel $b) => [$b->id => new BranchSummary($b->id, $b->code, $b->name, $b->is_active)])
            ->all();
    }

    public function activeIds(): array
    {
        /** @var list<string> */
        return BranchModel::query()->where('is_active', true)->orderBy('name')->pluck('id')->all();
    }

    public function isActive(string $id): bool
    {
        return Str::isUuid($id) && BranchModel::query()->whereKey($id)->where('is_active', true)->exists();
    }
}
