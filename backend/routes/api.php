<?php

use App\Shared\Presentation\Http\Controllers\HealthController;
use Illuminate\Support\Facades\Route;

/*
| Module routes are registered by each module's service provider under
| /api/v1 (see App\Shared\Infrastructure\Providers\ModuleServiceProvider).
*/

Route::prefix('v1')->group(function (): void {
    Route::get('health', HealthController::class)->withoutMiddleware('throttle:api');
});
