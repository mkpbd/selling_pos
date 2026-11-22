<?php

declare(strict_types=1);

namespace App\Modules\Organization;

use App\Modules\Organization\Application\Contracts\BranchDirectory;
use App\Modules\Organization\Application\Queries\BranchQueryService;
use App\Modules\Organization\Domain\BranchRepository;
use App\Modules\Organization\Domain\OrganizationPermission;
use App\Modules\Organization\Infrastructure\Persistence\EloquentBranchDirectory;
use App\Modules\Organization\Infrastructure\Persistence\EloquentBranchQueryService;
use App\Modules\Organization\Infrastructure\Persistence\EloquentBranchRepository;
use App\Shared\Application\Authorization\PermissionRegistry;
use App\Shared\Infrastructure\Providers\ModuleServiceProvider;

/**
 * Organization bounded context: company structure (branches).
 */
final class OrganizationServiceProvider extends ModuleServiceProvider
{
    public array $singletons = [
        BranchRepository::class => EloquentBranchRepository::class,
        BranchQueryService::class => EloquentBranchQueryService::class,
        BranchDirectory::class => EloquentBranchDirectory::class,
    ];

    protected function bootModule(): void
    {
        $this->app->make(PermissionRegistry::class)->register(OrganizationPermission::class);
    }
}
