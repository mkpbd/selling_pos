<?php

use App\Modules\Products\Presentation\Http\Controllers\CategoryController;
use App\Modules\Products\Presentation\Http\Controllers\ProductController;
use App\Modules\Products\Presentation\Http\Controllers\UnitController;
use Illuminate\Support\Facades\Route;

// Mounted under /api/v1 with the `api` middleware group.
Route::middleware('authenticated')->group(function (): void {
    Route::prefix('products')->group(function (): void {
        Route::get('/', [ProductController::class, 'index'])->middleware('can:products.view');
        Route::post('/', [ProductController::class, 'store'])->middleware('can:products.create');
        Route::get('{product}', [ProductController::class, 'show'])->middleware('can:products.view')->whereUuid('product');
        Route::put('{product}', [ProductController::class, 'update'])->middleware('can:products.update')->whereUuid('product');
    });

    Route::prefix('categories')->group(function (): void {
        Route::get('/', [CategoryController::class, 'index'])->middleware('can:products.view');
        Route::post('/', [CategoryController::class, 'store'])->middleware('can:catalog.manage');
        Route::put('{category}', [CategoryController::class, 'update'])->middleware('can:catalog.manage')->whereUuid('category');
        Route::delete('{category}', [CategoryController::class, 'destroy'])->middleware('can:catalog.manage')->whereUuid('category');
    });

    Route::prefix('units')->group(function (): void {
        Route::get('/', [UnitController::class, 'index'])->middleware('can:products.view');
        Route::post('/', [UnitController::class, 'store'])->middleware('can:catalog.manage');
        Route::put('{unit}', [UnitController::class, 'update'])->middleware('can:catalog.manage')->whereUuid('unit');
        Route::delete('{unit}', [UnitController::class, 'destroy'])->middleware('can:catalog.manage')->whereUuid('unit');
    });
});
