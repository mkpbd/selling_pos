<?php

declare(strict_types=1);

namespace App\Shared\Infrastructure\Providers;

use App\Shared\Application\Authorization\PermissionRegistry;
use App\Shared\Application\Context\BranchContext;
use App\Shared\Application\Contracts\EventDispatcher;
use App\Shared\Application\Contracts\TransactionManager;
use App\Shared\Domain\Events\DomainEvent;
use App\Shared\Infrastructure\Audit\AuditDomainEvent;
use App\Shared\Infrastructure\Events\LaravelEventDispatcher;
use App\Shared\Infrastructure\Persistence\DatabaseTransactionManager;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

/**
 * Shared kernel wiring: cross-cutting ports, request context, audit trail
 * and rate limits.
 */
final class SharedServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PermissionRegistry::class);
        $this->app->scoped(BranchContext::class);
        $this->app->bind(ConnectionInterface::class, fn ($app) => $app['db']->connection());
        $this->app->bind(TransactionManager::class, DatabaseTransactionManager::class);
        $this->app->bind(EventDispatcher::class, LaravelEventDispatcher::class);
    }

    public function boot(): void
    {
        Event::listen(DomainEvent::class, AuditDomainEvent::class);

        RateLimiter::for('api', static fn (Request $request) => Limit::perMinute(120)
            ->by($request->user()?->getAuthIdentifier() ?? $request->ip()));

        // Credential endpoints: per email+IP and per IP, to slow brute force.
        RateLimiter::for('auth', static fn (Request $request) => [
            Limit::perMinute(5)->by(strtolower((string) $request->input('email')).'|'.$request->ip()),
            Limit::perMinute(20)->by('ip:'.$request->ip()),
        ]);
    }
}
