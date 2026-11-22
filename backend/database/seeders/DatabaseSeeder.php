<?php

namespace Database\Seeders;

use App\Modules\Authorization\Application\Contracts\AccessControl;
use App\Modules\Authorization\Domain\SystemRole;
use App\Modules\Authorization\Infrastructure\PermissionCatalogSynchronizer;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Organization\Infrastructure\Persistence\BranchModel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

/**
 * Bootstraps a fresh installation: permission catalog + system roles, the
 * head-office branch and the initial super administrator. Idempotent.
 */
class DatabaseSeeder extends Seeder
{
    public function run(PermissionCatalogSynchronizer $permissions, AccessControl $access): void
    {
        $permissions->sync();

        $branch = BranchModel::query()->firstOrCreate(
            ['code' => 'HQ'],
            ['name' => 'Head Office', 'is_active' => true],
        );

        $email = strtolower((string) env('SEED_ADMIN_EMAIL', 'admin@sellingpos.test'));
        $password = (string) env('SEED_ADMIN_PASSWORD', '');

        if (User::query()->where('email', $email)->exists()) {
            $this->command?->info("Super admin [{$email}] already exists; skipped.");

            return;
        }

        if ($password === '') {
            throw new RuntimeException('Set SEED_ADMIN_PASSWORD in .env before seeding the initial super admin.');
        }

        $admin = new User;
        $admin->forceFill([
            'name' => (string) env('SEED_ADMIN_NAME', 'System Administrator'),
            'email' => $email,
            'password' => Hash::make($password),
            'is_active' => true,
            'is_super_admin' => true,
            'default_branch_id' => $branch->id,
            'email_verified_at' => now(),
        ])->save();

        DB::table('branch_user')->insert(['user_id' => $admin->id, 'branch_id' => $branch->id, 'created_at' => now()]);
        $access->syncBranchRoles($admin->id, [$branch->id => [SystemRole::Admin->value]]);

        $this->command?->info("Super admin [{$email}] created in branch [HQ].");
    }
}
