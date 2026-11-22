<?php

declare(strict_types=1);

namespace App\Shared\Domain\Result;

use LogicException;

/**
 * Outcome of a use case: either a success carrying a value, or a failure
 * carrying an {@see Error}. Expected business failures travel as Results;
 * exceptions are reserved for unexpected technical faults.
 *
 * @template-covariant T
 */
final readonly class Result
{
    /**
     * @param  T|null  $value
     */
    private function __construct(
        private bool $ok,
        private mixed $value,
        private ?Error $error,
    ) {}

    /**
     * @template V
     *
     * @param  V  $value
     * @return self<V>
     */
    public static function success(mixed $value = null): self
    {
        return new self(true, $value, null);
    }

    /**
     * @return self<never>
     */
    public static function failure(Error $error): self
    {
        return new self(false, null, $error);
    }

    public function isSuccess(): bool
    {
        return $this->ok;
    }

    public function isFailure(): bool
    {
        return ! $this->ok;
    }

    /**
     * @return T
     */
    public function value(): mixed
    {
        if (! $this->ok) {
            throw new LogicException('Cannot read the value of a failed Result.');
        }

        return $this->value;
    }

    public function error(): Error
    {
        if ($this->ok || $this->error === null) {
            throw new LogicException('Cannot read the error of a successful Result.');
        }

        return $this->error;
    }

    /**
     * @template U
     *
     * @param  callable(T): U  $fn
     * @return self<U>
     */
    public function map(callable $fn): self
    {
        return $this->ok ? self::success($fn($this->value)) : $this;
    }

    /**
     * @template U
     *
     * @param  callable(T): self<U>  $fn
     * @return self<U>
     */
    public function then(callable $fn): self
    {
        return $this->ok ? $fn($this->value) : $this;
    }
}
