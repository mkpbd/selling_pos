<?php

declare(strict_types=1);

namespace App\Shared\Application\Contracts;

use App\Shared\Domain\Result\Result;

/**
 * Unit-of-work boundary for use cases.
 */
interface TransactionManager
{
    /**
     * Run the callback in a transaction. Commits when it returns a successful
     * Result (or a non-Result value); rolls back on a failed Result or any
     * exception.
     *
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    public function run(callable $callback): mixed;
}
