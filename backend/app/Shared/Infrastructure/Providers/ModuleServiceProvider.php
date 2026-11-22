<?php

declare(strict_types=1);

namespace App\Shared\Infrastructure\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use ReflectionClass;

/**
 * Base provider for a business module. A module lives in
 * app/Modules/{Name} and may ship:
 *  - Presentation/Http/routes.php           (mounted under /api/v1)
 *  - Infrastructure/Database/Migrations/    (auto-loaded)
 */
abstract class ModuleServiceProvider extends ServiceProvider
{
    /**
     * Interface => implementation bindings, registered as singletons.
     *
     * @var array<class-string, class-string>
     */
    public array $singletons = [];

    public function boot(): void
    {
        $base = $this->modulePath();

        $migrations = $base.'/Infrastructure/Database/Migrations';
        if (is_dir($migrations)) {
            $this->loadMigrationsFrom($migrations);
        }

        $routes = $base.'/Presentation/Http/routes.php';
        if (is_file($routes) && ! $this->app->routesAreCached()) {
            Route::middleware('api')->prefix('api/v1')->group($routes);
        }

        $this->bootModule();
    }

    protected function bootModule(): void {}

    protected function modulePath(): string
    {
        return dirname((string) (new ReflectionClass(static::class))->getFileName());
    }
}
