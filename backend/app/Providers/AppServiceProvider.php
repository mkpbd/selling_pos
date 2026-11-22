<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Swagger UI (/docs/api) is only exposed in local/testing environments.
        Gate::define('viewApiDocs', static fn ($user = null): bool => app()->environment(['local', 'testing']));
    }
}
