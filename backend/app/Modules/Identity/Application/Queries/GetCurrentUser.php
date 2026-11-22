<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Queries;

use App\Modules\Authorization\Application\Contracts\AccessControl;
use App\Modules\Organization\Application\Contracts\BranchDirectory;
use App\Modules\Organization\Application\Contracts\BranchSummary;
use App\Shared\Application\Authorization\PermissionRegistry;
use App\Shared\Application\Context\BranchContext;

final readonly class GetCurrentUser
{
    public function __construct(
        private UserQueryService $users,
        private BranchDirectory $branches,
        private AccessControl $access,
        private PermissionRegistry $permissions,
        private BranchContext $context,
    ) {}

    public function handle(string $userId): ?MeView
    {
        $user = $this->users->findById($userId);
        if ($user === null) {
            return null;
        }

        $current = $this->context->currentBranchId();
        $branches = $this->branches->summaries($this->context->accessibleBranchIds(), activeOnly: true);

        $roles = $current === null ? [] : $this->access->rolesFor($user->id, $current);
        $permissions = match (true) {
            $user->isSuperAdmin => $this->permissions->names(),
            $current === null => [],
            default => $this->access->permissionsFor($user->id, $current),
        };

        return new MeView(
            $user,
            $current !== null && isset($branches[$current]) ? $branches[$current]->toArray() : null,
            array_values(array_map(static fn (BranchSummary $b) => $b->toArray(), $branches)),
            $roles,
            $permissions,
        );
    }
}
