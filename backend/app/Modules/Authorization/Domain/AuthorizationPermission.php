<?php

declare(strict_types=1);

namespace App\Modules\Authorization\Domain;

use App\Shared\Domain\Authorization\PermissionEnum;

enum AuthorizationPermission: string implements PermissionEnum
{
    case RolesView = 'roles.view';
    case RolesManage = 'roles.manage';

    public static function group(): string
    {
        return 'roles';
    }

    public function label(): string
    {
        return match ($this) {
            self::RolesView => 'View roles and permissions',
            self::RolesManage => 'Create, update and delete roles',
        };
    }
}
