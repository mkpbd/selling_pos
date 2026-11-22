<?php

declare(strict_types=1);

namespace App\Shared\Application\Pagination;

/**
 * Framework-agnostic list request: paging, free-text search, sort and filters.
 */
final readonly class PageRequest
{
    public const int DEFAULT_PER_PAGE = 15;

    public const int MAX_PER_PAGE = 100;

    /**
     * @param  array<string, mixed>  $filters
     */
    public function __construct(
        public int $page = 1,
        public int $perPage = self::DEFAULT_PER_PAGE,
        public ?string $search = null,
        public ?string $sortField = null,
        public bool $sortDescending = false,
        public array $filters = [],
    ) {}

    public function filter(string $key, mixed $default = null): mixed
    {
        return $this->filters[$key] ?? $default;
    }
}
