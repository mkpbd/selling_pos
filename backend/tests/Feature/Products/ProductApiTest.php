<?php

use App\Modules\Products\Infrastructure\DefaultUnits;
use App\Modules\Products\Infrastructure\Persistence\UnitModel;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    app(DefaultUnits::class)->seed();
    $this->hq = makeBranch(['code' => 'HQ']);
    $this->pcs = UnitModel::where('code', 'PCS')->value('id');
    $this->kg = UnitModel::where('code', 'KG')->value('id');
});

function productPayload(array $overrides = []): array
{
    return [
        'sku' => 'coke-500',
        'barcode' => '8901234567890',
        'name' => 'Coca-Cola 500ml',
        'unit_id' => test()->pcs,
        'cost_price' => '35',
        'selling_price' => 45,
        'tax_rate' => '5',
        'track_stock' => true,
        ...$overrides,
    ];
}

it('creates a product with normalized money fields and margin', function () {
    actingAsUser(makeUser([$this->hq->id => ['manager']]));
    $category = $this->postJson('/api/v1/categories', ['name' => 'Beverages'])->assertCreated()->json('data.id');

    $this->postJson('/api/v1/products', productPayload(['category_id' => $category]))
        ->assertCreated()
        ->assertJsonPath('data.sku', 'COKE-500')
        ->assertJsonPath('data.cost_price', '35.00')
        ->assertJsonPath('data.selling_price', '45.00')
        ->assertJsonPath('data.tax_rate', '5.00')
        ->assertJsonPath('data.margin_percent', '22.22')
        ->assertJsonPath('data.category.name', 'Beverages')
        ->assertJsonPath('data.unit.code', 'PCS');
});

it('rejects duplicate SKU and barcode with 409', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']]));
    $this->postJson('/api/v1/products', productPayload())->assertCreated();

    $this->postJson('/api/v1/products', productPayload(['barcode' => '111122223333']))
        ->assertStatus(409)->assertJsonPath('error.code', 'SKU_TAKEN');

    $this->postJson('/api/v1/products', productPayload(['sku' => 'OTHER']))
        ->assertStatus(409)->assertJsonPath('error.code', 'BARCODE_TAKEN')
        ->assertJsonStructure(['error' => ['details' => ['barcode']]]);
});

it('validates prices, tax and references', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']]));

    $this->postJson('/api/v1/products', productPayload(['cost_price' => '-1', 'selling_price' => '1.999', 'tax_rate' => 150]))
        ->assertUnprocessable()
        ->assertJsonStructure(['error' => ['details' => ['cost_price', 'selling_price', 'tax_rate']]]);

    $this->postJson('/api/v1/products', productPayload(['unit_id' => fake()->uuid()]))
        ->assertUnprocessable()->assertJsonStructure(['error' => ['details' => ['unit_id']]]);

    $this->postJson('/api/v1/products', productPayload(['category_id' => fake()->uuid()]))
        ->assertUnprocessable()->assertJsonStructure(['error' => ['details' => ['category_id']]]);
});

it('lists products with search, filters and sorting', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']]));
    $this->postJson('/api/v1/products', productPayload())->assertCreated();
    $this->postJson('/api/v1/products', productPayload(['sku' => 'RICE-1KG', 'barcode' => null, 'name' => 'Rice 1kg', 'selling_price' => '90', 'unit_id' => $this->kg]))->assertCreated();
    $this->postJson('/api/v1/products', productPayload(['sku' => 'OLD-1', 'barcode' => null, 'name' => 'Old item', 'is_active' => false]))->assertCreated();

    $this->getJson('/api/v1/products?sort=-selling_price')->assertOk()->assertJsonPath('data.0.sku', 'RICE-1KG');
    $this->getJson('/api/v1/products?search=coca')->assertJsonCount(1, 'data');
    $this->getJson('/api/v1/products?is_active=false')->assertJsonCount(1, 'data')->assertJsonPath('data.0.sku', 'OLD-1');
});

it('updates a product', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']]));
    $id = $this->postJson('/api/v1/products', productPayload())->json('data.id');

    $this->putJson("/api/v1/products/{$id}", productPayload(['name' => 'Coke 500', 'selling_price' => '50.00']))
        ->assertOk()
        ->assertJsonPath('data.name', 'Coke 500')
        ->assertJsonPath('data.margin_percent', '30.00');
});

it('manages categories and units with conflict rules', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']]));

    $cat = $this->postJson('/api/v1/categories', ['name' => 'Snacks'])->assertCreated()->json('data.id');
    $this->postJson('/api/v1/categories', ['name' => 'SNACKS'])->assertStatus(409)->assertJsonPath('error.code', 'CATEGORY_NAME_TAKEN');
    $this->postJson('/api/v1/units', ['code' => 'pcs', 'name' => 'Dup', 'allows_decimal' => false])->assertStatus(409)->assertJsonPath('error.code', 'UNIT_CODE_TAKEN');

    $this->postJson('/api/v1/products', productPayload(['category_id' => $cat]))->assertCreated();

    $this->deleteJson("/api/v1/categories/{$cat}")->assertStatus(409)->assertJsonPath('error.code', 'CATEGORY_IN_USE');
    $this->deleteJson("/api/v1/units/{$this->pcs}")->assertStatus(409)->assertJsonPath('error.code', 'UNIT_IN_USE');

    $this->getJson('/api/v1/categories')->assertOk()->assertJsonPath('data.0.products_count', 1);

    $box = UnitModel::where('code', 'BOX')->value('id');
    $this->deleteJson("/api/v1/units/{$box}")->assertOk();
});

it('enforces product permissions', function () {
    actingAsUser(makeUser([$this->hq->id => ['cashier']]));

    $this->getJson('/api/v1/products')->assertOk();
    $this->getJson('/api/v1/units')->assertOk();
    $this->postJson('/api/v1/products', productPayload())->assertForbidden();
    $this->postJson('/api/v1/categories', ['name' => 'X1'])->assertForbidden();
});

it('publishes changes into the inventory projection', function () {
    actingAsUser(makeUser([$this->hq->id => ['admin']]));
    $id = $this->postJson('/api/v1/products', productPayload())->json('data.id');

    $projected = DB::table('inventory_products')->where('product_id', $id)->first();
    expect($projected->sku)->toBe('COKE-500')->and($projected->cost_price)->toBe('35.00');

    $this->putJson("/api/v1/units/{$this->pcs}", ['code' => 'PC', 'name' => 'Piece', 'allows_decimal' => true])->assertOk();
    $projected = DB::table('inventory_products')->where('product_id', $id)->first();
    expect($projected->unit_code)->toBe('PC')->and($projected->allows_decimal)->toBeTrue();
});
