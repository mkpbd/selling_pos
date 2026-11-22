<?php

declare(strict_types=1);

namespace App\Shared\Infrastructure\Events;

use App\Shared\Application\Contracts\EventDispatcher;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Database\ConnectionInterface;

final readonly class LaravelEventDispatcher implements EventDispatcher
{
    public function __construct(
        private Dispatcher $events,
        private ConnectionInterface $connection,
    ) {}

    public function dispatch(array $events): void
    {
        foreach ($events as $event) {
            // Runs immediately when no transaction is open.
            $this->connection->afterCommit(fn () => $this->events->dispatch($event));
        }
    }
}
