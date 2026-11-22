<?php

declare(strict_types=1);

namespace App\Modules\Products\Domain;

use App\Shared\Domain\Authorization\PermissionEnum;

enum ProductsPermission: string implements PermissionEnum
{
    case ProductsView = 'products.view';
    case ProductsCreate = 'products.create';
    case ProductsUpdate = 'products.update';
    case CatalogManage = 'catalog.manage';

    public static function group(): string
    {
        return 'products';
    }

    public function label(): string
    {
        return match ($this) {
            self::ProductsView => 'View products, categories and units',
            self::ProductsCreate => 'Create products',
            self::ProductsUpdate => 'Update products',
            self::CatalogManage => 'Manage categories and units',
        };
    }
}
