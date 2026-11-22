<?php

declare(strict_types=1);

namespace App\Modules\Organization\Domain;

use App\Shared\Domain\Authorization\PermissionEnum;

enum OrganizationPermission: string implements PermissionEnum
{
    case BranchesView = 'branches.view';
    case BranchesCreate = 'branches.create';
    case BranchesUpdate = 'branches.update';

    public static function group(): string
    {
        return 'branches';
    }

    public function label(): string
    {
        return match ($this) {
            self::BranchesView => 'View branches',
            self::BranchesCreate => 'Create branches',
            self::BranchesUpdate => 'Update branches',
        };
    }
}
