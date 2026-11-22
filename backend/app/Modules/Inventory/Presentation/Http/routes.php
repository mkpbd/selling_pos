<?php

use App\Modules\Inventory\Presentation\Http\Controllers\InventoryController;
use Illuminate\Support\Facades\Route;

// Mounted under /api/v1 with the `api` middleware group. Scoped to the active branch.
Route::middleware('authenticated')->prefix('inventory')->group(function (): void {
    Route::get('stock', [InventoryController::class, 'stock'])->middleware('can:inventory.view');
    Route::get('stock/{product}', [InventoryController::class, 'showStock'])->middleware('can:inventory.view')->whereUuid('product');
    Route::put('stock/{product}/reorder-level', [InventoryController::class, 'reorderLevel'])->middleware('can:inventory.adjust')->whereUuid('product');
    Route::get('summary', [InventoryController::class, 'summary'])->middleware('can:inventory.view');
    Route::get('movements', [InventoryController::class, 'movements'])->middleware('can:inventory.view');
    Route::post('adjustments', [InventoryController::class, 'adjust'])->middleware(['can:inventory.adjust', 'idempotent']);
});
