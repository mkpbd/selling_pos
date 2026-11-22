<?php

declare(strict_types=1);

namespace App\Modules\Authorization\Application\Contracts;

/**
 * Published contract of the Authorization context: per-branch role
 * assignment and permission resolution for users.
 */
interface AccessControl
{
    /** Scope permission checks for the rest of the request to a branch. */
    public function useBranch(?string $branchId): void;

    /**
     * Replace all role assignments of a user.
     *
     * @param  array<string, list<string>>  $branchRoles  branch id => role names
     */
    public function syncBranchRoles(string $userId, array $branchRoles): void;

    /**
     * @param  list<string>  $userIds
     * @return array<string, array<string, list<string>>> user id => branch id => role names
     */
    public function branchRolesFor(array $userIds): array;

    /**
     * @return list<string>
     */
    public function rolesFor(string $userId, string $branchId): array;

    /**
     * @return list<string>
     */
    public function permissionsFor(string $userId, string $branchId): array;

    /**
     * @param  list<string>  $roleNames
     * @return array<string, list<string>> role name => permission names (existing roles only)
     */
    public function rolePermissions(array $roleNames): array;

    /**
     * @param  list<string>  $roleNames
     * @return list<string> names that do not exist
     */
    public function unknownRoles(array $roleNames): array;
}
