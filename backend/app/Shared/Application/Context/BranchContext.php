<?php

declare(strict_types=1);

namespace App\Shared\Application\Context;

/**
 * Request-scoped holder of the active branch and the actor's branch scope.
 * Populated by the branch-context middleware; bound as a scoped singleton.
 */
final class BranchContext
{
    private ?string $currentBranchId = null;

    /** @var list<string> */
    private array $accessibleBranchIds = [];

    private bool $resolved = false;

    /**
     * @param  list<string>  $accessibleBranchIds
     */
    public function set(?string $currentBranchId, array $accessibleBranchIds): void
    {
        $this->currentBranchId = $currentBranchId;
        $this->accessibleBranchIds = array_values($accessibleBranchIds);
        $this->resolved = true;
    }

    public function currentBranchId(): ?string
    {
        return $this->currentBranchId;
    }

    /**
     * @return list<string>
     */
    public function accessibleBranchIds(): array
    {
        return $this->accessibleBranchIds;
    }

    public function isResolved(): bool
    {
        return $this->resolved;
    }
}
