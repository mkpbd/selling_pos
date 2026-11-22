<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Services;

use App\Modules\Identity\Application\Queries\UserQueryService;
use App\Modules\Identity\Domain\UserErrors;
use App\Modules\Organization\Application\Contracts\BranchDirectory;
use App\Shared\Domain\Result\Result;

/**
 * Determines which branches a user may act in and which one is active for
 * the request (explicit choice > default branch > first accessible).
 */
final readonly class BranchAccessResolver
{
    public function __construct(
        private UserQueryService $users,
        private BranchDirectory $branches,
    ) {}

    /**
     * @return Result<array{current: string|null, accessible: list<string>}>
     */
    public function resolve(string $userId, bool $isSuperAdmin, ?string $defaultBranchId, ?string $requestedBranchId): Result
    {
        $accessible = $isSuperAdmin
            ? $this->branches->activeIds()
            : array_map('strval', array_keys($this->branches->summaries($this->users->branchIdsOf($userId), activeOnly: true)));

        if ($requestedBranchId !== null) {
            return in_array($requestedBranchId, $accessible, true)
                ? Result::success(['current' => $requestedBranchId, 'accessible' => $accessible])
                : Result::failure(UserErrors::branchAccessDenied());
        }

        $current = $defaultBranchId !== null && in_array($defaultBranchId, $accessible, true)
            ? $defaultBranchId
            : ($accessible[0] ?? null);

        return Result::success(['current' => $current, 'accessible' => $accessible]);
    }
}
