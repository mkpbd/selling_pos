<?php

beforeEach(function () {
    $this->hq = makeBranch(['code' => 'HQ']);
});

it('lists the permission catalog grouped by module', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']]));

    $groups = collect($this->getJson('/api/v1/permissions')->assertOk()->json('data'))->keyBy('group');

    expect($groups->keys()->all())->toContain('dashboard', 'branches', 'users', 'roles')
        ->and(collect($groups['branches']['permissions'])->pluck('name')->all())
        ->toBe(['branches.view', 'branches.create', 'branches.update']);
});

it('lists roles with system flags and user counts', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']]));

    $roles = collect($this->getJson('/api/v1/roles')->assertOk()->json('data'))->keyBy('name');

    expect($roles->keys()->all())->toContain('admin', 'manager', 'cashier')
        ->and($roles['admin']['is_system'])->toBeTrue()
        ->and($roles['admin']['users_count'])->toBe(1)
        ->and($roles['cashier']['permissions'])->toBe(['dashboard.view']);
});

it('creates, updates and deletes a custom role', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']]));

    $id = $this->postJson('/api/v1/roles', ['name' => 'Supervisor', 'permissions' => ['users.view', 'dashboard.view']])
        ->assertCreated()
        ->assertJsonPath('data.name', 'supervisor')
        ->assertJsonPath('data.is_system', false)
        ->assertJsonPath('data.permissions', ['dashboard.view', 'users.view'])
        ->json('data.id');

    $this->putJson("/api/v1/roles/{$id}", ['name' => 'supervisor', 'permissions' => ['branches.view']])
        ->assertOk()->assertJsonPath('data.permissions', ['branches.view']);

    $this->deleteJson("/api/v1/roles/{$id}")->assertOk();
    $this->getJson("/api/v1/roles/{$id}")->assertNotFound()->assertJsonPath('error.code', 'ROLE_NOT_FOUND');
});

it('rejects unknown permissions and duplicate names', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']]));

    $this->postJson('/api/v1/roles', ['name' => 'x1', 'permissions' => ['nuke.everything']])
        ->assertUnprocessable()->assertJsonStructure(['error' => ['details' => ['permissions.0']]]);

    $this->postJson('/api/v1/roles', ['name' => 'manager', 'permissions' => []])
        ->assertStatus(409)->assertJsonPath('error.code', 'ROLE_NAME_TAKEN');
});

it('protects system roles and roles in use', function () {
    $admin = makeUser([$this->hq->id => ['admin']]);
    actingAsUser($admin);
    $roles = collect($this->getJson('/api/v1/roles')->json('data'))->keyBy('name');

    $this->putJson("/api/v1/roles/{$roles['cashier']['id']}", ['name' => 'till', 'permissions' => []])
        ->assertStatus(409)->assertJsonPath('error.code', 'SYSTEM_ROLE_IMMUTABLE');

    $this->deleteJson("/api/v1/roles/{$roles['manager']['id']}")
        ->assertStatus(409)->assertJsonPath('error.code', 'SYSTEM_ROLE_IMMUTABLE');

    $customId = $this->postJson('/api/v1/roles', ['name' => 'auditor', 'permissions' => ['dashboard.view']])->json('data.id');
    makeUser([$this->hq->id => ['auditor']]);

    $this->deleteJson("/api/v1/roles/{$customId}")->assertStatus(409)->assertJsonPath('error.code', 'ROLE_IN_USE');
});

it('lets system role permissions be edited', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']]));
    $cashierId = collect($this->getJson('/api/v1/roles')->json('data'))->firstWhere('name', 'cashier')['id'];

    $this->putJson("/api/v1/roles/{$cashierId}", ['name' => 'cashier', 'permissions' => ['dashboard.view', 'branches.view']])
        ->assertOk()->assertJsonPath('data.permissions', ['branches.view', 'dashboard.view']);
});

it('requires roles.manage to change roles', function () {
    actingAsUser(makeUser([$this->hq->id => ['manager']]));

    $this->getJson('/api/v1/roles')->assertOk();
    $this->postJson('/api/v1/roles', ['name' => 'x1', 'permissions' => []])->assertForbidden();
});
