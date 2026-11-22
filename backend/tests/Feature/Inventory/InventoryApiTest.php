<?php

use App\Modules\Products\Infrastructure\DefaultUnits;
use App\Modules\Products\Infrastructure\Persistence\UnitModel;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

beforeEach(function () {
    app(DefaultUnits::class)->seed();
    $this->hq = makeBranch(['code' => 'HQ']);
    $this->ctg = makeBranch(['code' => 'CTG']);
    $this->admin = actingAsUser(makeUser([$this->hq->id => ['admin'], $this->ctg->id => ['admin']]));

    $this->product = fn (array $o = []) => $this->postJson('/api/v1/products', [
        'sku' => 'SKU-'.Str::random(6),
        'name' => 'Item '.Str::random(4),
        'unit_id' => UnitModel::where('code', $o['unit'] ?? 'PCS')->value('id'),
        'cost_price' => $o['cost'] ?? '10.00',
        'selling_price' => '15.00',
        'track_stock' => $o['track_stock'] ?? true,
    ])->assertCreated()->json('data.id');

    $this->adjust = fn (string $productId, string $type, string|int $qty, array $headers = [], string $reason = 'received') => $this->postJson(
        '/api/v1/inventory/adjustments',
        ['product_id' => $productId, 'type' => $type, 'quantity' => $qty, 'reason' => $reason],
        $headers,
    );
});

it('lists tracked products with zero stock by default', function () {
    $id = ($this->product)();
    ($this->product)(['track_stock' => false]);

    $this->getJson('/api/v1/inventory/stock')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.product_id', $id)
        ->assertJsonPath('data.0.quantity', '0.000')
        ->assertJsonPath('data.0.status', 'out_of_stock');
});

it('adjusts stock in, out and by count, writing the ledger', function () {
    $id = ($this->product)(['cost' => '35.00']);

    ($this->adjust)($id, 'in', 30)
        ->assertCreated()
        ->assertJsonPath('data.movement.type', 'adjustment_in')
        ->assertJsonPath('data.movement.quantity', '30.000')
        ->assertJsonPath('data.movement.user.id', $this->admin->id)
        ->assertJsonPath('data.stock.quantity', '30.000')
        ->assertJsonPath('data.stock.stock_value', '1050.00');

    ($this->adjust)($id, 'out', 6, reason: 'damaged')->assertCreated()->assertJsonPath('data.movement.quantity', '-6.000');
    ($this->adjust)($id, 'count', 20, reason: 'correction')->assertCreated()
        ->assertJsonPath('data.movement.type', 'count')
        ->assertJsonPath('data.movement.quantity', '-4.000')
        ->assertJsonPath('data.stock.quantity', '20.000');

    $this->getJson("/api/v1/inventory/movements?product_id={$id}")
        ->assertOk()
        ->assertJsonCount(3, 'data')
        ->assertJsonPath('data.0.balance_after', '20.000');
});

it('prevents negative stock and no-op counts', function () {
    $id = ($this->product)();
    ($this->adjust)($id, 'in', 2)->assertCreated();

    ($this->adjust)($id, 'out', 3, reason: 'lost')
        ->assertUnprocessable()
        ->assertJsonPath('error.code', 'INSUFFICIENT_STOCK')
        ->assertJsonPath('error.details.available', '2.000');

    ($this->adjust)($id, 'count', 2, reason: 'correction')->assertUnprocessable()->assertJsonPath('error.code', 'NO_STOCK_CHANGE');
});

it('enforces whole units for non-decimal products', function () {
    $pcs = ($this->product)();
    $kg = ($this->product)(['unit' => 'KG']);

    ($this->adjust)($pcs, 'in', '1.5')->assertUnprocessable()->assertJsonStructure(['error' => ['details' => ['quantity']]]);
    ($this->adjust)($kg, 'in', '1.25')->assertCreated()->assertJsonPath('data.stock.quantity', '1.250');
});

it('rejects unstockable and unknown products', function () {
    $untracked = ($this->product)(['track_stock' => false]);

    ($this->adjust)($untracked, 'in', 1)->assertUnprocessable()->assertJsonPath('error.code', 'PRODUCT_NOT_STOCKABLE');
    ($this->adjust)(fake()->uuid(), 'in', 1)->assertNotFound()->assertJsonPath('error.code', 'PRODUCT_NOT_FOUND');
});

it('keeps stock separate per branch', function () {
    $id = ($this->product)();
    ($this->adjust)($id, 'in', 10)->assertCreated();
    ($this->adjust)($id, 'in', 3, ['X-Branch-Id' => $this->ctg->id])->assertCreated();

    $this->getJson("/api/v1/inventory/stock/{$id}")->assertJsonPath('data.quantity', '10.000');
    $this->getJson("/api/v1/inventory/stock/{$id}", ['X-Branch-Id' => $this->ctg->id])->assertJsonPath('data.quantity', '3.000');
    $this->getJson('/api/v1/inventory/movements', ['X-Branch-Id' => $this->ctg->id])->assertJsonCount(1, 'data');
});

it('computes status, filters and summary from reorder levels', function () {
    $low = ($this->product)(['cost' => '2.00']);
    $ok = ($this->product)(['cost' => '1.00']);
    ($this->product)(); // out of stock

    ($this->adjust)($low, 'in', 3)->assertCreated();
    ($this->adjust)($ok, 'in', 50)->assertCreated();
    $this->putJson("/api/v1/inventory/stock/{$low}/reorder-level", ['reorder_level' => 5])
        ->assertOk()->assertJsonPath('data.status', 'low_stock')->assertJsonPath('data.reorder_level', '5.000');

    $this->getJson('/api/v1/inventory/stock?status=low_stock')->assertJsonCount(1, 'data')->assertJsonPath('data.0.product_id', $low);
    $this->getJson('/api/v1/inventory/stock?sort=-quantity')->assertJsonPath('data.0.product_id', $ok);

    $this->getJson('/api/v1/inventory/summary')->assertOk()->assertJsonPath('data', [
        'tracked_products' => 3,
        'in_stock' => 1,
        'low_stock' => 1,
        'out_of_stock' => 1,
        'stock_value' => '56.00',
    ]);
});

it('replays idempotent adjustments instead of applying them twice', function () {
    $id = ($this->product)();
    $key = ['Idempotency-Key' => (string) Str::uuid()];

    $first = ($this->adjust)($id, 'in', 5, $key)->assertCreated();
    $replay = ($this->adjust)($id, 'in', 5, $key)->assertCreated()->assertHeader('Idempotent-Replayed', 'true');

    expect($replay->json('data.movement.id'))->toBe($first->json('data.movement.id'));
    $this->getJson("/api/v1/inventory/stock/{$id}")->assertJsonPath('data.quantity', '5.000');

    ($this->adjust)($id, 'in', 6, $key)->assertUnprocessable()->assertJsonPath('error.code', 'IDEMPOTENCY_KEY_REUSED');
    ($this->adjust)($id, 'in', 1, ['Idempotency-Key' => 'bad key!'])->assertUnprocessable();
});

it('does not store failed business outcomes as successes but replays them', function () {
    $id = ($this->product)();
    $key = ['Idempotency-Key' => (string) Str::uuid()];

    ($this->adjust)($id, 'out', 1, $key, 'lost')->assertUnprocessable();
    ($this->adjust)($id, 'out', 1, $key, 'lost')->assertUnprocessable()->assertHeader('Idempotent-Replayed', 'true');
});

it('makes the movement ledger append-only at the database level', function () {
    $id = ($this->product)();
    ($this->adjust)($id, 'in', 1)->assertCreated();

    expect(fn () => DB::table('inventory_movements')->update(['note' => 'tampered']))
        ->toThrow(QueryException::class, 'append-only');
});

it('enforces inventory permissions', function () {
    $id = ($this->product)();
    actingAsUser(makeUser([$this->hq->id => ['cashier']]));

    $this->getJson('/api/v1/inventory/stock')->assertOk();
    ($this->adjust)($id, 'in', 1)->assertForbidden();
    $this->putJson("/api/v1/inventory/stock/{$id}/reorder-level", ['reorder_level' => 1])->assertForbidden();
});

it('validates adjustment input', function () {
    $this->postJson('/api/v1/inventory/adjustments', ['type' => 'steal', 'quantity' => -1, 'reason' => 'whim'])
        ->assertUnprocessable()
        ->assertJsonStructure(['error' => ['details' => ['product_id', 'type', 'quantity', 'reason']]]);
});
