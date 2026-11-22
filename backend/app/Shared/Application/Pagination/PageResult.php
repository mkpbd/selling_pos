<?php

declare(strict_types=1);

namespace App\Shared\Application\Pagination;

/**
 * @template T
 */
final readonly class PageResult
{
    /**
     * @param  list<T>  $items
     */
    public function __construct(
        public array $items,
        public int $total,
        public int $page,
        public int $perPage,
    ) {}

    public function lastPage(): int
    {
        return max(1, (int) ceil($this->total / max(1, $this->perPage)));
    }

    /**
     * @template U
     *
     * @param  callable(T): U  $fn
     * @return self<U>
     */
    public function map(callable $fn): self
    {
        return new self(array_map($fn, $this->items), $this->total, $this->page, $this->perPage);
    }
}
