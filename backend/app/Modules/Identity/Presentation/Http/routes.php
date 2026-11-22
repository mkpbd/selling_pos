<?php

use App\Modules\Identity\Presentation\Http\Controllers\AuthController;
use App\Modules\Identity\Presentation\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Mounted under /api/v1 with the `api` middleware group.
Route::prefix('auth')->group(function (): void {
    Route::middleware('throttle:auth')->group(function (): void {
        Route::post('login', [AuthController::class, 'login']);
        Route::post('tokens', [AuthController::class, 'issueToken']);
        Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('reset-password', [AuthController::class, 'resetPassword']);
    });

    Route::middleware('authenticated')->group(function (): void {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'show']);
        Route::put('password', [AuthController::class, 'changePassword'])->middleware('throttle:auth');
    });
});

Route::middleware('authenticated')->prefix('users')->group(function (): void {
    Route::get('/', [UserController::class, 'index'])->middleware('can:users.view');
    Route::post('/', [UserController::class, 'store'])->middleware('can:users.create');
    Route::get('{user}', [UserController::class, 'show'])->middleware('can:users.view')->whereUuid('user');
    Route::put('{user}', [UserController::class, 'update'])->middleware('can:users.update')->whereUuid('user');
});
