<?php

declare(strict_types=1);

namespace App\Shared\Infrastructure\Persistence;

use App\Shared\Application\Contracts\TransactionManager;
use App\Shared\Domain\Result\Result;
use Illuminate\Database\ConnectionInterface;
use Throwable;

final readonly class DatabaseTransactionManager implements TransactionManager
{
    public function __construct(private ConnectionInterface $connection) {}

    public function run(callable $callback): mixed
    {
        $this->connection->beginTransaction();

        try {
            $result = $callback();
        } catch (Throwable $e) {
            $this->connection->rollBack();

            throw $e;
        }

        if ($result instanceof Result && $result->isFailure()) {
            $this->connection->rollBack();
        } else {
            $this->connection->commit();
        }

        return $result;
    }
}
