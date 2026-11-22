<?php

declare(strict_types=1);

namespace App\Modules\Identity\Domain;

use App\Shared\Domain\Authorization\PermissionEnum;

enum IdentityPermission: string implements PermissionEnum
{
    case UsersView = 'users.view';
    case UsersCreate = 'users.create';
    case UsersUpdate = 'users.update';

    public static function group(): string
    {
        return 'users';
    }

    public function label(): string
    {
        return match ($this) {
            self::UsersView => 'View users',
            self::UsersCreate => 'Create users',
            self::UsersUpdate => 'Update users',
        };
    }
}
