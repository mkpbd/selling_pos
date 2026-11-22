<?php

use App\Modules\Authorization\Application\Contracts\AccessControl;
use App\Modules\Authorization\Infrastructure\PermissionCatalogSynchronizer;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Organization\Infrastructure\Persistence\BranchModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/*
| Feature tests run against the PostgreSQL test database (.env.testing),
| inside a transaction per test.
*/
pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->beforeEach(fn () => app(PermissionCatalogSynchronizer::class)->sync())
    ->in('Feature');

pest()->extend(TestCase::class)->in('Unit');

function makeBranch(array $attributes = []): BranchModel
{
    return BranchModel::factory()->create($attributes);
}

/**
 * Create a user with role assignments.
 *
 * @param  array<string, list<string>>  $branchRoles  branch id => role names
 */
function makeUser(array $branchRoles = [], array $attributes = [], bool $superAdmin = false): User
{
    $factory = User::factory();
    if ($superAdmin) {
        $factory = $factory->superAdmin();
    }

    $user = $factory->create(['default_branch_id' => array_key_first($branchRoles), ...$attributes]);

    foreach (array_keys($branchRoles) as $branchId) {
        DB::table('branch_user')->insert(['user_id' => $user->id, 'branch_id' => $branchId, 'created_at' => now()]);
    }

    app(AccessControl::class)->syncBranchRoles($user->id, $branchRoles);

    return $user->fresh();
}

function actingAsUser(User $user): User
{
    Sanctum::actingAs($user, ['*']);

    return $user;
}

/** Headers that make Sanctum treat the request as coming from the SPA. */
function spaHeaders(): array
{
    return ['Origin' => 'http://localhost:5173', 'Referer' => 'http://localhost:5173/'];
}
