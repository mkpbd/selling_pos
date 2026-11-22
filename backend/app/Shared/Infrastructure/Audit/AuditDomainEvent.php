<?php

declare(strict_types=1);

namespace App\Shared\Infrastructure\Audit;

use App\Shared\Domain\Events\DomainEvent;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * Writes every domain event to the structured `audit` log channel.
 * Request id is attached automatically through Laravel's Context.
 */
final class AuditDomainEvent
{
    public function handle(DomainEvent $event): void
    {
        Log::channel('audit')->info($event->name(), [
            'event' => $event->name(),
            'actor_id' => Auth::id(),
            'occurred_at' => $event->occurredAt()->format(DATE_ATOM),
            'payload' => $event->payload(),
        ]);
    }
}
