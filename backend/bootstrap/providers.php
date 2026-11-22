<?php

use App\Modules\Authorization\AuthorizationServiceProvider;
use App\Modules\Identity\IdentityServiceProvider;
use App\Modules\Inventory\InventoryServiceProvider;
use App\Modules\Organization\OrganizationServiceProvider;
use App\Modules\Products\ProductsServiceProvider;
use App\Providers\AppServiceProvider;
use App\Shared\Infrastructure\Providers\SharedServiceProvider;

return [
    AppServiceProvider::class,
    SharedServiceProvider::class,

    // Business modules (bounded contexts)
    OrganizationServiceProvider::class,
    AuthorizationServiceProvider::class,
    IdentityServiceProvider::class,
    ProductsServiceProvider::class,
    InventoryServiceProvider::class,
];
