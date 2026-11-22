<?php

declare(strict_types=1);

namespace App\Modules\Products\Infrastructure\Persistence;

use App\Modules\Products\Domain\Unit;
use App\Modules\Products\Domain\UnitRepository;
use Illuminate\Support\Str;

final class EloquentUnitRepository implements UnitRepository
{
    public function nextId(): string
    {
        return (string) Str::uuid7();
    }

    public function find(string $id): ?Unit
    {
        $m = Str::isUuid($id) ? UnitModel::query()->find($id) : null;

        return $m === null ? null : Unit::reconstitute($m->id, $m->code, $m->name, $m->allows_decimal);
    }

    public function codeExists(string $code, ?string $exceptId = null): bool
    {
        return UnitModel::query()
            ->where('code', strtoupper(trim($code)))
            ->when($exceptId !== null, fn ($q) => $q->whereKeyNot($exceptId))
            ->exists();
    }

    public function isInUse(string $id): bool
    {
        return ProductModel::query()->where('unit_id', $id)->exists();
    }

    public function save(Unit $unit): void
    {
        UnitModel::query()->updateOrCreate(['id' => $unit->id], [
            'code' => $unit->code(),
            'name' => $unit->name(),
            'allows_decimal' => $unit->allowsDecimal(),
        ]);
    }

    public function delete(string $id): void
    {
        UnitModel::query()->whereKey($id)->delete();
    }
}
