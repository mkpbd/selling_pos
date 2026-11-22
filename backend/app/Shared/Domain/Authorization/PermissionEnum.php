<?php

declare(strict_types=1);

namespace App\Shared\Domain\Authorization;

/**
 * Implemented by each module's string-backed permission enum. The enum value
 * is the permission name (e.g. "branches.view").
 */
interface PermissionEnum
{
    /** Permission group shown in the UI (usually the module/resource). */
    public static function group(): string;

    /** Human readable label, e.g. "View branches". */
    public function label(): string;
}
