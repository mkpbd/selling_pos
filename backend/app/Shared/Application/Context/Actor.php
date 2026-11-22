<?php

declare(strict_types=1);

namespace App\Shared\Application\Context;

/**
 * The authenticated principal performing a use case, with the branch scope
 * resolved for the current request.
 */
final readonly class Actor
{
    /**
     * @param  list<string>  $accessibleBranchIds
     */
    public function __construct(
        public string $userId,
        public bool $isSuperAdmin,
        public ?string $currentBranchId,
        public array $accessibleBranchIds,
    ) {}

    public function canAccessBranch(string $branchId): bool
    {
        return $this->isSuperAdmin || in_array($branchId, $this->accessibleBranchIds, true);
    }
}
