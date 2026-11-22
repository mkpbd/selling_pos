<?php

declare(strict_types=1);

namespace App\Modules\Authorization\Domain;

use App\Modules\Authorization\Domain\Events\RoleChanged;
use App\Shared\Domain\AggregateRoot;
use App\Shared\Domain\Result\Result;

/**
 * A named bundle of permissions, assignable to users per branch.
 */
final class Role extends AggregateRoot
{
    public const string NAME_PATTERN = '/^[a-z0-9_-]{2,50}$/';

    /**
     * @param  list<string>  $permissions
     */
    private function __construct(
        private ?int $id,
        private string $name,
        private readonly bool $isSystem,
        private array $permissions,
    ) {}

    /**
     * @param  list<string>  $permissions
     */
    public static function define(string $name, array $permissions): self
    {
        $role = new self(null, $name, false, self::normalize($permissions));
        $role->record(new RoleChanged('created', $name, $role->permissions));

        return $role;
    }

    /**
     * @param  list<string>  $permissions
     */
    public static function reconstitute(int $id, string $name, bool $isSystem, array $permissions): self
    {
        return new self($id, $name, $isSystem, self::normalize($permissions));
    }

    /**
     * @param  list<string>  $permissions
     * @return Result<null>
     */
    public function change(string $name, array $permissions): Result
    {
        if ($this->isSystem && $name !== $this->name) {
            return Result::failure(RoleErrors::systemRoleImmutable());
        }

        $this->name = $name;
        $this->permissions = self::normalize($permissions);
        $this->record(new RoleChanged('updated', $name, $this->permissions, $this->id));

        return Result::success();
    }

    /**
     * @return Result<null>
     */
    public function ensureDeletable(bool $isAssigned): Result
    {
        if ($this->isSystem) {
            return Result::failure(RoleErrors::systemRoleImmutable());
        }

        if ($isAssigned) {
            return Result::failure(RoleErrors::inUse());
        }

        $this->record(new RoleChanged('deleted', $this->name, $this->permissions, $this->id));

        return Result::success();
    }

    public function assignId(int $id): void
    {
        $this->id ??= $id;
    }

    public function id(): ?int
    {
        return $this->id;
    }

    public function name(): string
    {
        return $this->name;
    }

    public function isSystem(): bool
    {
        return $this->isSystem;
    }

    /**
     * @return list<string>
     */
    public function permissions(): array
    {
        return $this->permissions;
    }

    /**
     * @param  list<string>  $permissions
     * @return list<string>
     */
    private static function normalize(array $permissions): array
    {
        $permissions = array_values(array_unique($permissions));
        sort($permissions);

        return $permissions;
    }
}
