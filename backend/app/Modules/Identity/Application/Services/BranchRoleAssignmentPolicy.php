<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Services;

use App\Modules\Authorization\Application\Contracts\AccessControl;
use App\Modules\Identity\Domain\UserErrors;
use App\Modules\Organization\Application\Contracts\BranchDirectory;
use App\Shared\Application\Context\Actor;
use App\Shared\Domain\Result\Result;

/**
 * Guards who may assign which roles in which branches:
 *  - target branches must exist and be active;
 *  - roles must exist;
 *  - a non-super-admin may only touch branches in their scope;
 *  - a non-super-admin may only grant roles whose permissions they hold
 *    themselves in that branch (no privilege escalation);
 *  - assignments outside the actor's scope are preserved untouched.
 */
final readonly class BranchRoleAssignmentPolicy
{
    public function __construct(
        private BranchDirectory $branches,
        private AccessControl $access,
    ) {}

    /**
     * @param  list<array{branch_id: string, roles: list<string>}>  $requested
     * @param  array<string, list<string>>  $existing  current assignments of the target user
     * @return Result<array<string, list<string>>> final branch id => role names
     */
    public function resolve(Actor $actor, array $requested, array $existing = []): Result
    {
        $branchIds = array_column($requested, 'branch_id');
        $activeBranches = $this->branches->summaries($branchIds, activeOnly: true);
        $allRoles = array_merge([], ...array_column($requested, 'roles'));
        $unknownRoles = $this->access->unknownRoles($allRoles);

        $fieldErrors = [];
        foreach ($requested as $i => $row) {
            if (! isset($activeBranches[$row['branch_id']])) {
                $fieldErrors["branch_roles.{$i}.branch_id"] = ['The selected branch is invalid or inactive.'];
            }

            $unknown = array_values(array_intersect($row['roles'], $unknownRoles));
            if ($unknown !== []) {
                $fieldErrors["branch_roles.{$i}.roles"] = ['Unknown role(s): '.implode(', ', $unknown).'.'];
            }
        }

        if ($fieldErrors !== []) {
            return Result::failure(UserErrors::invalidAssignment($fieldErrors));
        }

        foreach ($requested as $row) {
            if (! $actor->canAccessBranch($row['branch_id'])) {
                return Result::failure(UserErrors::branchAccessDenied());
            }
        }

        if (! $actor->isSuperAdmin) {
            $rolePermissions = $this->access->rolePermissions($allRoles);

            foreach ($requested as $row) {
                $held = $this->access->permissionsFor($actor->userId, $row['branch_id']);
                foreach ($row['roles'] as $role) {
                    if (array_diff($rolePermissions[$role] ?? [], $held) !== []) {
                        return Result::failure(UserErrors::roleEscalation($role));
                    }
                }
            }
        }

        $final = [];
        foreach ($existing as $branchId => $roles) {
            if (! $actor->canAccessBranch($branchId)) {
                $final[$branchId] = $roles;
            }
        }
        foreach ($requested as $row) {
            $final[$row['branch_id']] = array_values(array_unique($row['roles']));
        }

        return Result::success($final);
    }

    /**
     * A non-super-admin may only manage a user whose permissions, in every
     * branch the actor can access, are a subset of the actor's own.
     *
     * @param  array<string, list<string>>  $targetAssignments
     * @return Result<null>
     */
    public function ensureCanManage(Actor $actor, string $targetUserId, array $targetAssignments): Result
    {
        if ($actor->isSuperAdmin || $targetUserId === $actor->userId) {
            return Result::success();
        }

        foreach (array_keys($targetAssignments) as $branchId) {
            if (! $actor->canAccessBranch($branchId)) {
                continue;
            }

            $targetPermissions = $this->access->permissionsFor($targetUserId, $branchId);
            $actorPermissions = $this->access->permissionsFor($actor->userId, $branchId);

            if (array_diff($targetPermissions, $actorPermissions) !== []) {
                return Result::failure(UserErrors::protectedUser());
            }
        }

        return Result::success();
    }
}
