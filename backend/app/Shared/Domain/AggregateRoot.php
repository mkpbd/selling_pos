<?php

declare(strict_types=1);

namespace App\Shared\Domain;

use App\Shared\Domain\Events\DomainEvent;

/**
 * Base for aggregate roots: records domain events until the application
 * layer releases and dispatches them after persistence.
 */
abstract class AggregateRoot
{
    /** @var list<DomainEvent> */
    private array $recordedEvents = [];

    protected function record(DomainEvent $event): void
    {
        $this->recordedEvents[] = $event;
    }

    /**
     * @return list<DomainEvent>
     */
    public function releaseEvents(): array
    {
        $events = $this->recordedEvents;
        $this->recordedEvents = [];

        return $events;
    }
}
