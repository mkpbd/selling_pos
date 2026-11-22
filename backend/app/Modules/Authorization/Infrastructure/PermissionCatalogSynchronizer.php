<?php

declare(strict_types=1);

namespace App\Modules\Authorization\Infrastructure;

use App\Modules\Authorization\Domain\SystemRole;
use App\Modules\Authorization\Infrastructure\Persistence\RoleModel;
use App\Shared\Application\Authorization\PermissionRegistry;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

/**
 * Idempotently aligns the permissions table with the code-defined catalog
 * and ensures system roles exist. Safe to run on every deploy.
 */
final readonly class PermissionCatalogSynchronizer
{
    public function __construct(
        private PermissionRegistry $registry,
        private PermissionRegistrar $registrar,
    ) {}

    /**
     * @param  bool  $resetSystemRolePermissions  overwrite system role permissions with defaults
     */
    public function sync(bool $resetSystemRolePermissions = false): void
    {
        $names = $this->registry->names();

        $existing = Permission::query()->where('guard_name', RoleModel::GUARD)->pluck('name')->all();
        $introduced = array_values(array_diff($names, $existing));

        foreach ($introduced as $name) {
            Permission::findOrCreate($name, RoleModel::GUARD);
        }

        // Remove permissions no longer declared in code.
        Permission::query()->where('guard_name', RoleModel::GUARD)->whereNotIn('name', $names)->delete();

        $teamKey = (string) config('permission.column_names.team_foreign_key');

        foreach (SystemRole::cases() as $systemRole) {
            $role = RoleModel::query()
                ->where('guard_name', RoleModel::GUARD)
                ->whereNull($teamKey)
                ->where('name', $systemRole->value)
                ->first();

            $isNew = $role === null;

            $role ??= RoleModel::create([
                'name' => $systemRole->value,
                'guard_name' => RoleModel::GUARD,
                $teamKey => null,
                'is_system' => true,
            ]);

            if (! $role->is_system) {
                $role->forceFill(['is_system' => true])->save();
            }

            $defaults = $systemRole->defaultPermissions() ?? $names;

            if ($isNew || $resetSystemRolePermissions || $systemRole === SystemRole::Admin) {
                $role->syncPermissions($defaults);
            } elseif ($introduced !== []) {
                // Upgrades: grant permissions introduced by new modules without
                // touching an administrator's customizations of existing ones.
                $grant = array_values(array_intersect($introduced, $defaults));
                if ($grant !== []) {
                    $role->givePermissionTo($grant);
                }
            }
        }

        $this->registrar->forgetCachedPermissions();
    }
}
