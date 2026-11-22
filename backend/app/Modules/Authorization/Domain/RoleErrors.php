<?php

declare(strict_types=1);

namespace App\Modules\Authorization\Domain;

use App\Shared\Domain\Result\Error;

final class RoleErrors
{
    public static function notFound(): Error
    {
        return Error::notFound('ROLE_NOT_FOUND', 'Role not found.');
    }

    public static function nameTaken(string $name): Error
    {
        return Error::conflict('ROLE_NAME_TAKEN', "Role [{$name}] already exists.", [
            'name' => ["Role [{$name}] already exists."],
        ]);
    }

    public static function systemRoleImmutable(): Error
    {
        return Error::conflict('SYSTEM_ROLE_IMMUTABLE', 'System roles cannot be renamed or deleted.');
    }

    public static function inUse(): Error
    {
        return Error::conflict('ROLE_IN_USE', 'The role is assigned to users. Unassign it before deleting.');
    }
}
