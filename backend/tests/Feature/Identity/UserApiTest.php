<?php

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use Laravel\Sanctum\PersonalAccessToken;

beforeEach(function () {
    $this->hq = makeBranch(['code' => 'HQ']);
    $this->ctg = makeBranch(['code' => 'CTG']);
});

function userPayload(array $overrides = []): array
{
    return [
        'name' => 'Rahim Uddin',
        'email' => 'rahim@example.com',
        'password' => 'Str0ng-Pass!',
        'password_confirmation' => 'Str0ng-Pass!',
        'is_active' => true,
        'branch_roles' => [],
        ...$overrides,
    ];
}

it('creates a user with per-branch roles', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']]));

    $response = $this->postJson('/api/v1/users', userPayload([
        'default_branch_id' => $this->hq->id,
        'branch_roles' => [['branch_id' => $this->hq->id, 'roles' => ['cashier']]],
    ]))->assertCreated()
        ->assertJsonPath('data.email', 'rahim@example.com')
        ->assertJsonPath('data.default_branch_id', $this->hq->id)
        ->assertJsonPath('data.branches.0.code', 'HQ')
        ->assertJsonPath('data.branches.0.roles', ['cashier'])
        ->assertJsonMissingPath('data.password');

    $created = User::find($response->json('data.id'));
    expect($created->password)->not->toBe('Str0ng-Pass!');
});

it('rejects duplicate emails with 409', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']], ['email' => 'taken@example.com']));

    $this->postJson('/api/v1/users', userPayload([
        'email' => 'TAKEN@example.com',
        'branch_roles' => [['branch_id' => $this->hq->id, 'roles' => ['cashier']]],
    ]))->assertStatus(409)->assertJsonPath('error.code', 'EMAIL_TAKEN');
});

it('maps assignment errors to fields', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']]));

    $this->postJson('/api/v1/users', userPayload([
        'branch_roles' => [['branch_id' => fake()->uuid(), 'roles' => ['ghost-role']]],
    ]))->assertUnprocessable()
        ->assertJsonStructure(['error' => ['details' => ['branch_roles.0.branch_id', 'branch_roles.0.roles']]]);
});

it('requires at least one branch and a valid default branch', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']]));

    $this->postJson('/api/v1/users', userPayload())
        ->assertUnprocessable()->assertJsonStructure(['error' => ['details' => ['branch_roles']]]);

    $this->postJson('/api/v1/users', userPayload([
        'default_branch_id' => $this->ctg->id,
        'branch_roles' => [['branch_id' => $this->hq->id, 'roles' => ['cashier']]],
    ]))->assertUnprocessable()->assertJsonStructure(['error' => ['details' => ['default_branch_id']]]);
});

it('prevents privilege escalation by non-super-admins', function () {
    actingAsUser(makeUser([$this->hq->id => ['manager']]));

    $this->postJson('/api/v1/users', userPayload([
        'branch_roles' => [['branch_id' => $this->hq->id, 'roles' => ['admin']]],
    ]))->assertForbidden()->assertJsonPath('error.code', 'FORBIDDEN');

    $this->postJson('/api/v1/users', userPayload([
        'branch_roles' => [['branch_id' => $this->hq->id, 'roles' => ['cashier']]],
    ]))->assertCreated();
});

it('prevents assigning branches outside the actor scope', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']]));

    $this->postJson('/api/v1/users', userPayload([
        'branch_roles' => [['branch_id' => $this->ctg->id, 'roles' => ['cashier']]],
    ]))->assertForbidden()->assertJsonPath('error.code', 'BRANCH_ACCESS_DENIED');
});

it('scopes the user list to the active branch for non-super-admins', function () {
    makeUser([$this->hq->id => ['cashier']], ['name' => 'Alice HQ']);
    makeUser([$this->ctg->id => ['cashier']], ['name' => 'Bob CTG']);
    $manager = actingAsUser(makeUser([$this->hq->id => ['manager']], ['name' => 'Manager HQ']));

    $names = collect($this->getJson('/api/v1/users')->assertOk()->json('data'))->pluck('name');
    expect($names)->toContain('Alice HQ', 'Manager HQ')->not->toContain('Bob CTG');

    $bob = User::where('name', 'Bob CTG')->first();
    $this->getJson("/api/v1/users/{$bob->id}")->assertNotFound();

    actingAsUser(makeUser([$this->hq->id => []], superAdmin: true));
    expect($this->getJson('/api/v1/users?per_page=100')->json('meta.pagination.total'))->toBe(4);
});

it('searches and filters users', function () {
    makeUser([$this->hq->id => ['cashier']], ['name' => 'Inactive Ivan', 'is_active' => false]);
    makeUser([$this->hq->id => ['cashier']], ['name' => 'Active Anna']);
    actingAsUser(makeUser([$this->hq->id => ['admin']], ['name' => 'Admin']));

    $this->getJson('/api/v1/users?is_active=false')->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Inactive Ivan');
    $this->getJson('/api/v1/users?search=anna')->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Active Anna');
});

it('updates a user, preserving assignments outside the actor scope', function () {
    $target = makeUser([$this->hq->id => ['cashier'], $this->ctg->id => ['manager']]);
    actingAsUser(makeUser([$this->hq->id => ['admin']]));

    $this->putJson("/api/v1/users/{$target->id}", [
        'name' => 'Renamed',
        'email' => $target->email,
        'is_active' => true,
        'default_branch_id' => $this->hq->id,
        'branch_roles' => [['branch_id' => $this->hq->id, 'roles' => ['manager']]],
    ])->assertOk()->assertJsonPath('data.name', 'Renamed');

    $branches = collect($this->getJson("/api/v1/users/{$target->id}")->json('data.branches'))->keyBy('code');
    expect($branches['HQ']['roles'])->toBe(['manager'])
        ->and($branches['CTG']['roles'])->toBe(['manager']);
});

it('revokes tokens when a user is deactivated', function () {
    $target = makeUser([$this->hq->id => ['cashier']]);
    $target->createToken('till');
    actingAsUser(makeUser([$this->hq->id => ['admin']]));

    $this->putJson("/api/v1/users/{$target->id}", [
        'name' => $target->name,
        'email' => $target->email,
        'is_active' => false,
        'branch_roles' => [['branch_id' => $this->hq->id, 'roles' => ['cashier']]],
    ])->assertOk()->assertJsonPath('data.is_active', false);

    expect(PersonalAccessToken::where('tokenable_id', $target->id)->count())->toBe(0);
});

it('forbids deactivating yourself', function () {
    $me = actingAsUser(makeUser([$this->hq->id => ['admin']]));

    $this->putJson("/api/v1/users/{$me->id}", [
        'name' => $me->name,
        'email' => $me->email,
        'is_active' => false,
        'branch_roles' => [['branch_id' => $this->hq->id, 'roles' => ['admin']]],
    ])->assertUnprocessable()->assertJsonPath('error.code', 'BUSINESS_RULE_VIOLATION');
});

it('protects super admins and higher-privileged users from lesser actors', function () {
    $super = makeUser([$this->hq->id => ['admin']], superAdmin: true);
    $admin = makeUser([$this->hq->id => ['admin']]);
    actingAsUser(makeUser([$this->hq->id => ['manager']]));

    foreach ([$super, $admin] as $target) {
        $this->putJson("/api/v1/users/{$target->id}", [
            'name' => 'Hacked',
            'email' => $target->email,
            'branch_roles' => [['branch_id' => $this->hq->id, 'roles' => ['cashier']]],
        ])->assertForbidden();
    }
});

it('requires users permissions', function () {
    actingAsUser(makeUser([$this->hq->id => ['cashier']]));

    $this->getJson('/api/v1/users')->assertForbidden();
});
