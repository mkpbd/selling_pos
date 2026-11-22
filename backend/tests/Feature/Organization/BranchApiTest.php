<?php

use App\Modules\Organization\Infrastructure\Persistence\BranchModel;

beforeEach(function () {
    $this->hq = makeBranch(['code' => 'HQ', 'name' => 'Head Office']);
});

it('lists branches with pagination, search, filter and sort', function () {
    makeBranch(['code' => 'CTG', 'name' => 'Chattogram Store']);
    makeBranch(['code' => 'SYL', 'name' => 'Sylhet Store', 'is_active' => false]);
    actingAsUser(makeUser([$this->hq->id => ['admin']]));

    $this->getJson('/api/v1/branches?per_page=2&sort=-code')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.code', 'SYL')
        ->assertJsonPath('meta.pagination', ['page' => 1, 'per_page' => 2, 'total' => 3, 'last_page' => 2]);

    $this->getJson('/api/v1/branches?search=store&is_active=true')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.code', 'CTG');
});

it('rejects unknown sort fields', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']]));

    $this->getJson('/api/v1/branches?sort=password')
        ->assertUnprocessable()
        ->assertJsonStructure(['error' => ['details' => ['sort']]]);
});

it('creates a branch with a normalized code', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']]));

    $this->postJson('/api/v1/branches', [
        'code' => 'dhk-01',
        'name' => 'Dhaka Main',
        'email' => 'DHAKA@example.com',
    ])->assertCreated()
        ->assertJsonPath('data.code', 'DHK-01')
        ->assertJsonPath('data.email', 'dhaka@example.com')
        ->assertJsonPath('data.is_active', true)
        ->assertJsonPath('message', 'Branch created.');

    expect(BranchModel::where('code', 'DHK-01')->exists())->toBeTrue();
});

it('returns 409 when the code is taken', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']]));

    $this->postJson('/api/v1/branches', ['code' => 'hq', 'name' => 'Duplicate'])
        ->assertStatus(409)
        ->assertJsonPath('error.code', 'BRANCH_CODE_TAKEN')
        ->assertJsonStructure(['error' => ['details' => ['code']]]);
});

it('validates branch input', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']]));

    $this->postJson('/api/v1/branches', ['code' => 'bad code!', 'email' => 'nope'])
        ->assertUnprocessable()
        ->assertJsonStructure(['error' => ['details' => ['code', 'name', 'email']]]);
});

it('updates and deactivates a branch', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']]));
    $branch = makeBranch(['code' => 'OLD']);

    $this->putJson("/api/v1/branches/{$branch->id}", [
        'code' => 'NEW',
        'name' => 'Renamed',
        'is_active' => false,
    ])->assertOk()
        ->assertJsonPath('data.code', 'NEW')
        ->assertJsonPath('data.is_active', false);
});

it('returns 404 for unknown branches', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']]));

    $this->getJson('/api/v1/branches/'.fake()->uuid())
        ->assertNotFound()
        ->assertJsonPath('error.code', 'BRANCH_NOT_FOUND');
});

it('enforces permissions on the backend', function () {
    actingAsUser(makeUser([$this->hq->id => ['cashier']]));

    $this->getJson('/api/v1/branches')->assertForbidden()->assertJsonPath('error.code', 'FORBIDDEN');
    $this->postJson('/api/v1/branches', ['code' => 'X1', 'name' => 'X'])->assertForbidden();
});

it('lets managers view but not create branches', function () {
    actingAsUser(makeUser([$this->hq->id => ['manager']]));

    $this->getJson('/api/v1/branches')->assertOk();
    $this->postJson('/api/v1/branches', ['code' => 'X1', 'name' => 'X'])->assertForbidden();
});
