<?php

use App\Modules\Organization\Presentation\Http\Controllers\BranchController;
use Illuminate\Support\Facades\Route;

// Mounted under /api/v1 with the `api` middleware group.
Route::middleware('authenticated')->prefix('branches')->group(function (): void {
    Route::get('/', [BranchController::class, 'index'])->middleware('can:branches.view');
    Route::post('/', [BranchController::class, 'store'])->middleware('can:branches.create');
    Route::get('{branch}', [BranchController::class, 'show'])->middleware('can:branches.view')->whereUuid('branch');
    Route::put('{branch}', [BranchController::class, 'update'])->middleware('can:branches.update')->whereUuid('branch');
});
