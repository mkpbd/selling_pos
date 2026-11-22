<?php

declare(strict_types=1);

namespace App\Modules\Authorization\Domain;

/**
 * Built-in roles seeded on install. They can't be renamed or deleted;
 * their permissions may be tuned by administrators afterwards.
 */
enum SystemRole: string
{
    case Admin = 'admin';
    case Manager = 'manager';
    case Cashier = 'cashier';

    /**
     * Default permission names; `null` means "every registered permission".
     *
     * @return list<string>|null
     */
    public function defaultPermissions(): ?array
    {
        return match ($this) {
            self::Admin => null,
            self::Manager => [
                'dashboard.view',
                'branches.view',
                'users.view',
                'users.create',
                'users.update',
                'roles.view',
            ],
            self::Cashier => ['dashboard.view'],
        };
    }

    public static function isSystemName(string $name): bool
    {
        return self::tryFrom($name) !== null;
    }
}
