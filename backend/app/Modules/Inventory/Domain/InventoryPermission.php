<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Domain;

use App\Shared\Domain\Authorization\PermissionEnum;

enum InventoryPermission: string implements PermissionEnum
{
    case InventoryView = 'inventory.view';
    case InventoryAdjust = 'inventory.adjust';

    public static function group(): string
    {
        return 'inventory';
    }

    public function label(): string
    {
        return match ($this) {
            self::InventoryView => 'View stock levels and movements',
            self::InventoryAdjust => 'Adjust stock and reorder levels',
        };
    }
}
