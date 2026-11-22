<?php

declare(strict_types=1);

namespace App\Modules\Identity\Domain\Events;

use App\Shared\Domain\Events\BaseDomainEvent;

/**
 * Lifecycle / security events of a user account. Payload never contains
 * passwords or tokens.
 */
final class UserChanged extends BaseDomainEvent
{
    /**
     * @param  'registered'|'updated'|'deactivated'|'password_changed'|'password_reset'|'logged_in'|'login_failed'|'roles_changed'  $action
     * @param  array<string, mixed>  $details
     */
    public function __construct(
        public readonly string $action,
        public readonly ?string $userId,
        public readonly array $details = [],
    ) {
        parent::__construct();
    }

    public function name(): string
    {
        return 'identity.user_'.$this->action;
    }

    public function payload(): array
    {
        return ['user_id' => $this->userId, ...$this->details];
    }
}
