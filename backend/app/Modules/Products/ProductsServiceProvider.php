<?php

declare(strict_types=1);

namespace App\Modules\Products;

use App\Modules\Products\Application\Contracts\ProductCatalog;
use App\Modules\Products\Application\Queries\CatalogQueryService;
use App\Modules\Products\Domain\CategoryRepository;
use App\Modules\Products\Domain\ProductRepository;
use App\Modules\Products\Domain\ProductsPermission;
use App\Modules\Products\Domain\UnitRepository;
use App\Modules\Products\Infrastructure\Persistence\EloquentCatalogQueryService;
use App\Modules\Products\Infrastructure\Persistence\EloquentCategoryRepository;
use App\Modules\Products\Infrastructure\Persistence\EloquentProductCatalog;
use App\Modules\Products\Infrastructure\Persistence\EloquentProductRepository;
use App\Modules\Products\Infrastructure\Persistence\EloquentUnitRepository;
use App\Shared\Application\Authorization\PermissionRegistry;
use App\Shared\Infrastructure\Providers\ModuleServiceProvider;

/**
 * Products bounded context: catalog of products, categories and units.
 * Publishes ProductChanged / UnitChanged events.
 */
final class ProductsServiceProvider extends ModuleServiceProvider
{
    public array $singletons = [
        ProductRepository::class => EloquentProductRepository::class,
        CategoryRepository::class => EloquentCategoryRepository::class,
        UnitRepository::class => EloquentUnitRepository::class,
        CatalogQueryService::class => EloquentCatalogQueryService::class,
        ProductCatalog::class => EloquentProductCatalog::class,
    ];

    protected function bootModule(): void
    {
        $this->app->make(PermissionRegistry::class)->register(ProductsPermission::class);
    }
}
