<?php

declare(strict_types=1);

namespace App\Modules\Identity;

use App\Modules\Identity\Application\Contracts\PasswordHasher;
use App\Modules\Identity\Application\Contracts\PasswordResetService;
use App\Modules\Identity\Application\Contracts\UserSessions;
use App\Modules\Identity\Application\Queries\UserQueryService;
use App\Modules\Identity\Domain\IdentityPermission;
use App\Modules\Identity\Domain\UserRepository;
use App\Modules\Identity\Infrastructure\Persistence\EloquentUserQueryService;
use App\Modules\Identity\Infrastructure\Persistence\EloquentUserRepository;
use App\Modules\Identity\Infrastructure\Security\LaravelPasswordHasher;
use App\Modules\Identity\Infrastructure\Security\LaravelPasswordResetService;
use App\Modules\Identity\Infrastructure\Security\LaravelUserSessions;
use App\Shared\Application\Authorization\PermissionRegistry;
use App\Shared\Infrastructure\Providers\ModuleServiceProvider;

/**
 * Identity bounded context: users, credentials, sessions/tokens and
 * branch membership.
 */
final class IdentityServiceProvider extends ModuleServiceProvider
{
    public array $singletons = [
        UserRepository::class => EloquentUserRepository::class,
        PasswordHasher::class => LaravelPasswordHasher::class,
        UserSessions::class => LaravelUserSessions::class,
        PasswordResetService::class => LaravelPasswordResetService::class,
    ];

    public function register(): void
    {
        // Depends on request-scoped AccessControl.
        $this->app->scoped(UserQueryService::class, EloquentUserQueryService::class);
    }

    protected function bootModule(): void
    {
        $this->app->make(PermissionRegistry::class)->register(IdentityPermission::class);
    }
}
