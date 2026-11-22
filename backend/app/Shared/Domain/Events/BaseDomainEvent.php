<?php

declare(strict_types=1);

namespace App\Shared\Domain\Events;

use DateTimeImmutable;

abstract class BaseDomainEvent implements DomainEvent
{
    private readonly DateTimeImmutable $occurredAt;

    public function __construct()
    {
        $this->occurredAt = new DateTimeImmutable;
    }

    public function occurredAt(): DateTimeImmutable
    {
        return $this->occurredAt;
    }
}
