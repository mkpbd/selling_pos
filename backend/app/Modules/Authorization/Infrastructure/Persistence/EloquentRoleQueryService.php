<?php

declare(strict_types=1);

namespace App\Modules\Authorization\Infrastructure\Persistence;

use App\Modules\Authorization\Application\Queries\RoleQueryService;
use App\Modules\Authorization\Application\Queries\RoleView;
use Illuminate\Support\Facades\DB;

final class EloquentRoleQueryService implements RoleQueryService
{
    public function all(): array
    {
        $models = RoleModel::query()
            ->where('guard_name', RoleModel::GUARD)
            ->whereNull(config('permission.column_names.team_foreign_key'))
            ->with('permissions:id,name')
            ->orderByDesc('is_system')
            ->orderBy('name')
            ->get();

        $counts = $this->userCounts($models->modelKeys());

        return $models->map(fn (RoleModel $m) => $this->toView($m, $counts[$m->id] ?? 0))->values()->all();
    }

    public function find(int $id): ?RoleView
    {
        $model = RoleModel::query()
            ->where('guard_name', RoleModel::GUARD)
            ->whereNull(config('permission.column_names.team_foreign_key'))
            ->with('permissions:id,name')
            ->find($id);

        return $model === null ? null : $this->toView($model, $this->userCounts([$id])[$id] ?? 0);
    }

    /**
     * @param  list<int>  $roleIds
     * @return array<int, int>
     */
    private function userCounts(array $roleIds): array
    {
        if ($roleIds === []) {
            return [];
        }

        return DB::table(config('permission.table_names.model_has_roles'))
            ->whereIn('role_id', $roleIds)
            ->groupBy('role_id')
            ->selectRaw('role_id, count(distinct model_id) as aggregate')
            ->pluck('aggregate', 'role_id')
            ->map(static fn ($c): int => (int) $c)
            ->all();
    }

    private function toView(RoleModel $m, int $usersCount): RoleView
    {
        $permissions = $m->permissions->pluck('name')->sort()->values()->all();

        return new RoleView($m->id, $m->name, $m->is_system, $permissions, $usersCount, $m->created_at, $m->updated_at);
    }
}
