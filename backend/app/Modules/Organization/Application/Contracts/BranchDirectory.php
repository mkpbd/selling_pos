<?php

declare(strict_types=1);

namespace App\Modules\Organization\Application\Contracts;

/**
 * Published contract of the Organization context. Other modules use this to
 * look up branches; they must never query the branches table directly.
 */
interface BranchDirectory
{
    /**
     * @param  list<string>  $ids
     * @return array<string, BranchSummary> keyed by id, preserving only existing branches
     */
    public function summaries(array $ids, bool $activeOnly = false): array;

    /**
     * @return list<string>
     */
    public function activeIds(): array;

    public function isActive(string $id): bool;
}
