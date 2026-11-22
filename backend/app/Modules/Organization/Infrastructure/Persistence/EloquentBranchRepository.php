<?php

declare(strict_types=1);

namespace App\Modules\Organization\Infrastructure\Persistence;

use App\Modules\Organization\Domain\Branch;
use App\Modules\Organization\Domain\BranchCode;
use App\Modules\Organization\Domain\BranchRepository;
use Illuminate\Support\Str;

final class EloquentBranchRepository implements BranchRepository
{
    public function nextId(): string
    {
        return (string) Str::uuid7();
    }

    public function find(string $id): ?Branch
    {
        if (! Str::isUuid($id)) {
            return null;
        }

        $model = BranchModel::query()->find($id);

        return $model === null ? null : Branch::reconstitute(
            $model->id,
            new BranchCode($model->code),
            $model->name,
            $model->phone,
            $model->email,
            $model->address,
            $model->is_active,
        );
    }

    public function codeExists(BranchCode $code, ?string $exceptId = null): bool
    {
        return BranchModel::query()
            ->where('code', $code->value)
            ->when($exceptId !== null, fn ($q) => $q->whereKeyNot($exceptId))
            ->exists();
    }

    public function save(Branch $branch): void
    {
        BranchModel::query()->updateOrCreate(['id' => $branch->id], [
            'code' => $branch->code()->value,
            'name' => $branch->name(),
            'phone' => $branch->phone(),
            'email' => $branch->email(),
            'address' => $branch->address(),
            'is_active' => $branch->isActive(),
        ]);
    }
}
