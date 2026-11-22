<?php

use App\Modules\Authorization\AuthorizationServiceProvider;
use App\Modules\Identity\IdentityServiceProvider;
use App\Modules\Organization\OrganizationServiceProvider;
use App\Providers\AppServiceProvider;
use App\Shared\Infrastructure\Providers\SharedServiceProvider;

return [
    AppServiceProvider::class,
    SharedServiceProvider::class,

    // Business modules (bounded contexts)
    OrganizationServiceProvider::class,
    AuthorizationServiceProvider::class,
    IdentityServiceProvider::class,
];
