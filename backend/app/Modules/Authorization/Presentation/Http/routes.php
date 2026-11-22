<?php

use App\Modules\Authorization\Presentation\Http\Controllers\PermissionController;
use App\Modules\Authorization\Presentation\Http\Controllers\RoleController;
use Illuminate\Support\Facades\Route;

// Mounted under /api/v1 with the `api` middleware group.
Route::middleware('authenticated')->group(function (): void {
    Route::get('permissions', PermissionController::class)->middleware('can:roles.view');

    Route::prefix('roles')->group(function (): void {
        Route::get('/', [RoleController::class, 'index'])->middleware('can:roles.view');
        Route::post('/', [RoleController::class, 'store'])->middleware('can:roles.manage');
        Route::get('{role}', [RoleController::class, 'show'])->middleware('can:roles.view')->whereNumber('role');
        Route::put('{role}', [RoleController::class, 'update'])->middleware('can:roles.manage')->whereNumber('role');
        Route::delete('{role}', [RoleController::class, 'destroy'])->middleware('can:roles.manage')->whereNumber('role');
    });
});
