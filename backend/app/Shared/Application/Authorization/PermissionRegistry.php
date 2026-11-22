<?php

declare(strict_types=1);

namespace App\Shared\Application\Authorization;

use App\Shared\Domain\Authorization\PermissionEnum;
use BackedEnum;
use InvalidArgumentException;

/**
 * Catalog of every permission declared by the modules. Modules register
 * their enum from their service provider; Authorization seeds and exposes it.
 */
final class PermissionRegistry
{
    /** @var list<class-string<PermissionEnum&BackedEnum>> */
    private array $enums = [];

    /**
     * @param  class-string<PermissionEnum&BackedEnum>  $enum
     */
    public function register(string $enum): void
    {
        if (! is_subclass_of($enum, PermissionEnum::class) || ! is_subclass_of($enum, BackedEnum::class)) {
            throw new InvalidArgumentException("[{$enum}] must be a backed enum implementing PermissionEnum.");
        }

        if (! in_array($enum, $this->enums, true)) {
            $this->enums[] = $enum;
        }
    }

    /**
     * @return list<string>
     */
    public function names(): array
    {
        $names = [];
        foreach ($this->enums as $enum) {
            foreach ($enum::cases() as $case) {
                $names[] = (string) $case->value;
            }
        }

        return $names;
    }

    /**
     * @return list<array{group: string, permissions: list<array{name: string, label: string}>}>
     */
    public function grouped(): array
    {
        $groups = [];
        foreach ($this->enums as $enum) {
            $group = $enum::group();
            foreach ($enum::cases() as $case) {
                $groups[$group][] = ['name' => (string) $case->value, 'label' => $case->label()];
            }
        }

        $out = [];
        foreach ($groups as $group => $permissions) {
            $out[] = ['group' => $group, 'permissions' => $permissions];
        }

        return $out;
    }

    public function exists(string $name): bool
    {
        return in_array($name, $this->names(), true);
    }
}
