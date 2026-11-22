<?php

declare(strict_types=1);

namespace App\Modules\Authorization\Domain;

use App\Shared\Domain\Authorization\PermissionEnum;

/**
 * Application-wide permissions not owned by a specific business module.
 */
enum CorePermission: string implements PermissionEnum
{
    case DashboardView = 'dashboard.view';

    public static function group(): string
    {
        return 'dashboard';
    }

    public function label(): string
    {
        return match ($this) {
            self::DashboardView => 'View dashboard',
        };
    }
}
