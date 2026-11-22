<?php

declare(strict_types=1);

namespace App\Modules\Authorization;

use App\Modules\Authorization\Application\Contracts\AccessControl;
use App\Modules\Authorization\Application\Queries\RoleQueryService;
use App\Modules\Authorization\Domain\AuthorizationPermission;
use App\Modules\Authorization\Domain\CorePermission;
use App\Modules\Authorization\Domain\RoleRepository;
use App\Modules\Authorization\Infrastructure\Persistence\EloquentRoleQueryService;
use App\Modules\Authorization\Infrastructure\Persistence\EloquentRoleRepository;
use App\Modules\Authorization\Infrastructure\SpatieAccessControl;
use App\Modules\Authorization\Presentation\Console\SyncPermissionsCommand;
use App\Shared\Application\Authorization\PermissionRegistry;
use App\Shared\Infrastructure\Providers\ModuleServiceProvider;
use Illuminate\Support\Facades\Gate;

/**
 * Authorization bounded context: permission catalog, roles and per-branch
 * role assignment (RBAC). Backend enforcement is authoritative.
 */
final class AuthorizationServiceProvider extends ModuleServiceProvider
{
    public array $singletons = [
        RoleRepository::class => EloquentRoleRepository::class,
        RoleQueryService::class => EloquentRoleQueryService::class,
    ];

    public function register(): void
    {
        // Stateless apart from the permission registrar (itself a singleton).
        $this->app->scoped(AccessControl::class, SpatieAccessControl::class);
    }

    protected function bootModule(): void
    {
        $registry = $this->app->make(PermissionRegistry::class);
        $registry->register(CorePermission::class);
        $registry->register(AuthorizationPermission::class);

        // Super administrators bypass every ability check.
        Gate::before(static fn ($user): ?bool => ($user->is_super_admin ?? false) === true ? true : null);

        if ($this->app->runningInConsole()) {
            $this->commands([SyncPermissionsCommand::class]);
        }
    }
}
