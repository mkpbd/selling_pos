<?php

declare(strict_types=1);

namespace App\Modules\Authorization\Infrastructure\Persistence;

use App\Modules\Authorization\Domain\Role;
use App\Modules\Authorization\Domain\RoleRepository;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

final class EloquentRoleRepository implements RoleRepository
{
    public function find(int $id): ?Role
    {
        $model = $this->query()->with('permissions:id,name')->find($id);

        return $model === null ? null : Role::reconstitute(
            $model->id,
            $model->name,
            $model->is_system,
            $model->permissions->pluck('name')->values()->all(),
        );
    }

    public function nameExists(string $name, ?int $exceptId = null): bool
    {
        return $this->query()
            ->where('name', $name)
            ->when($exceptId !== null, fn ($q) => $q->whereKeyNot($exceptId))
            ->exists();
    }

    public function isAssigned(int $id): bool
    {
        return DB::table(config('permission.table_names.model_has_roles'))->where('role_id', $id)->exists();
    }

    public function save(Role $role): void
    {
        if ($role->id() === null) {
            $model = RoleModel::create([
                'name' => $role->name(),
                'guard_name' => RoleModel::GUARD,
                config('permission.column_names.team_foreign_key') => null,
                'is_system' => false,
            ]);
            $role->assignId($model->id);
        } else {
            $model = $this->query()->findOrFail($role->id());
            $model->update(['name' => $role->name()]);
        }

        $model->syncPermissions($role->permissions());
    }

    public function delete(Role $role): void
    {
        $this->query()->whereKey($role->id())->first()?->delete();
    }

    /**
     * @return Builder<RoleModel>
     */
    private function query()
    {
        return RoleModel::query()
            ->where('guard_name', RoleModel::GUARD)
            ->whereNull(config('permission.column_names.team_foreign_key'));
    }
}
