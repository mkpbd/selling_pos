<?php

declare(strict_types=1);

namespace App\Modules\Authorization\Domain\Events;

use App\Shared\Domain\Events\BaseDomainEvent;

final class RoleChanged extends BaseDomainEvent
{
    /**
     * @param  'created'|'updated'|'deleted'  $action
     * @param  list<string>  $permissions
     */
    public function __construct(
        public readonly string $action,
        public readonly string $roleName,
        public readonly array $permissions,
        public readonly ?int $roleId = null,
    ) {
        parent::__construct();
    }

    public function name(): string
    {
        return 'authorization.role_'.$this->action;
    }

    public function payload(): array
    {
        return ['role_id' => $this->roleId, 'name' => $this->roleName, 'permissions' => $this->permissions];
    }
}
