<?php

declare(strict_types=1);

namespace App\Shared\Domain\Events;

use DateTimeImmutable;

/**
 * Something meaningful that happened in the domain.
 */
interface DomainEvent
{
    /** Stable, dotted event name, e.g. "organization.branch_created". */
    public function name(): string;

    public function occurredAt(): DateTimeImmutable;

    /**
     * Audit-safe payload. Must never contain secrets (passwords, tokens).
     *
     * @return array<string, mixed>
     */
    public function payload(): array;
}
