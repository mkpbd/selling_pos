<?php

beforeEach(function () {
    $this->hq = makeBranch(['code' => 'HQ']);
    $this->ctg = makeBranch(['code' => 'CTG']);
});

it('resolves permissions per branch via X-Branch-Id', function () {
    actingAsUser(makeUser([$this->hq->id => ['manager'], $this->ctg->id => ['cashier']]));

    // Default branch (HQ): manager can list users.
    $this->getJson('/api/v1/users')->assertOk();

    // In CTG the same person is only a cashier.
    $this->getJson('/api/v1/users', ['X-Branch-Id' => $this->ctg->id])->assertForbidden();

    $me = $this->getJson('/api/v1/auth/me', ['X-Branch-Id' => $this->ctg->id])->assertOk();
    $me->assertJsonPath('data.current_branch.code', 'CTG')
        ->assertJsonPath('data.roles', ['cashier'])
        ->assertJsonPath('data.permissions', ['dashboard.view', 'inventory.view', 'products.view']);
    expect(collect($me->json('data.branches'))->pluck('code')->sort()->values()->all())->toBe(['CTG', 'HQ']);
});

it('denies branches the user is not assigned to', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']]));

    $this->getJson('/api/v1/auth/me', ['X-Branch-Id' => $this->ctg->id])
        ->assertForbidden()->assertJsonPath('error.code', 'BRANCH_ACCESS_DENIED');

    $this->getJson('/api/v1/auth/me', ['X-Branch-Id' => 'not-a-uuid'])
        ->assertForbidden()->assertJsonPath('error.code', 'BRANCH_ACCESS_DENIED');
});

it('excludes inactive branches from the accessible set', function () {
    $user = actingAsUser(makeUser([$this->hq->id => ['admin'], $this->ctg->id => ['admin']]));
    $this->ctg->update(['is_active' => false]);

    $this->getJson('/api/v1/auth/me', ['X-Branch-Id' => $this->ctg->id])->assertForbidden();
    $this->getJson('/api/v1/auth/me')->assertOk()->assertJsonCount(1, 'data.branches');
});

it('lets super admins enter any active branch', function () {
    actingAsUser(makeUser([$this->hq->id => []], superAdmin: true));

    $this->getJson('/api/v1/auth/me', ['X-Branch-Id' => $this->ctg->id])
        ->assertOk()->assertJsonPath('data.current_branch.code', 'CTG');
});

it('denies everything when the user has no roles in the active branch', function () {
    actingAsUser(makeUser([$this->hq->id => []]));

    $this->getJson('/api/v1/branches')->assertForbidden();
    $this->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('data.permissions', []);
});
