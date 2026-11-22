<?php

declare(strict_types=1);

namespace App\Shared\Application\Contracts;

use App\Shared\Domain\Events\DomainEvent;

interface EventDispatcher
{
    /**
     * Dispatch events. Listeners run after the surrounding DB transaction
     * commits (or immediately when there is none).
     *
     * @param  list<DomainEvent>  $events
     */
    public function dispatch(array $events): void;
}
