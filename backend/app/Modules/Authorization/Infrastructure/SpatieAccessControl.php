<?php

declare(strict_types=1);

namespace App\Modules\Authorization\Infrastructure;

use App\Modules\Authorization\Application\Contracts\AccessControl;
use App\Modules\Authorization\Infrastructure\Persistence\RoleModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

/**
 * AccessControl backed by spatie/laravel-permission with "teams" mapped to
 * branches (team foreign key = branch_id).
 */
final readonly class SpatieAccessControl implements AccessControl
{
    public function __construct(private PermissionRegistrar $registrar) {}

    public function useBranch(?string $branchId): void
    {
        $this->registrar->setPermissionsTeamId($branchId);
    }

    public function syncBranchRoles(string $userId, array $branchRoles): void
    {
        $table = config('permission.table_names.model_has_roles');
        $teamKey = $this->teamKey();
        $morphKey = config('permission.column_names.model_morph_key');
        $morphType = $this->userMorphType();

        $allNames = array_values(array_unique(array_merge([], ...array_values($branchRoles))));
        $roleIds = $allNames === [] ? [] : $this->definitions()->whereIn('name', $allNames)->pluck('id', 'name')->all();

        DB::table($table)->where('model_type', $morphType)->where($morphKey, $userId)->delete();

        $rows = [];
        foreach ($branchRoles as $branchId => $names) {
            foreach (array_unique($names) as $name) {
                if (isset($roleIds[$name])) {
                    $rows[] = ['role_id' => $roleIds[$name], 'model_type' => $morphType, $morphKey => $userId, $teamKey => $branchId];
                }
            }
        }

        if ($rows !== []) {
            DB::table($table)->insert($rows);
        }
    }

    public function branchRolesFor(array $userIds): array
    {
        if ($userIds === []) {
            return [];
        }

        $morphKey = config('permission.column_names.model_morph_key');
        $teamKey = $this->teamKey();

        $rows = DB::table(config('permission.table_names.model_has_roles').' as mhr')
            ->join(config('permission.table_names.roles').' as r', 'r.id', '=', 'mhr.role_id')
            ->where('mhr.model_type', $this->userMorphType())
            ->whereIn("mhr.{$morphKey}", $userIds)
            ->orderBy('r.name')
            ->get(["mhr.{$morphKey} as user_id", "mhr.{$teamKey} as branch_id", 'r.name']);

        $map = [];
        foreach ($rows as $row) {
            $map[(string) $row->user_id][(string) $row->branch_id][] = (string) $row->name;
        }

        return $map;
    }

    public function rolesFor(string $userId, string $branchId): array
    {
        return $this->branchRolesFor([$userId])[$userId][$branchId] ?? [];
    }

    public function permissionsFor(string $userId, string $branchId): array
    {
        $tables = config('permission.table_names');
        $morphKey = config('permission.column_names.model_morph_key');

        /** @var list<string> */
        return DB::table($tables['model_has_roles'].' as mhr')
            ->join($tables['role_has_permissions'].' as rhp', 'rhp.role_id', '=', 'mhr.role_id')
            ->join($tables['permissions'].' as p', 'p.id', '=', 'rhp.permission_id')
            ->where('mhr.model_type', $this->userMorphType())
            ->where("mhr.{$morphKey}", $userId)
            ->where('mhr.'.$this->teamKey(), $branchId)
            ->distinct()
            ->orderBy('p.name')
            ->pluck('p.name')
            ->all();
    }

    public function rolePermissions(array $roleNames): array
    {
        $roleNames = array_values(array_unique($roleNames));
        if ($roleNames === []) {
            return [];
        }

        return $this->definitions()
            ->whereIn('name', $roleNames)
            ->with('permissions:id,name')
            ->get()
            ->mapWithKeys(fn (RoleModel $r) => [$r->name => $r->permissions->pluck('name')->values()->all()])
            ->all();
    }

    public function unknownRoles(array $roleNames): array
    {
        $roleNames = array_values(array_unique($roleNames));
        if ($roleNames === []) {
            return [];
        }

        $existing = $this->definitions()->whereIn('name', $roleNames)->pluck('name')->all();

        return array_values(array_diff($roleNames, $existing));
    }

    /**
     * @return Builder<RoleModel>
     */
    private function definitions()
    {
        return RoleModel::query()->where('guard_name', RoleModel::GUARD)->whereNull($this->teamKey());
    }

    private function teamKey(): string
    {
        return (string) config('permission.column_names.team_foreign_key');
    }

    private function userMorphType(): string
    {
        /** @var class-string<Model> $model */
        $model = config('auth.providers.users.model');

        return (new $model)->getMorphClass();
    }
}
