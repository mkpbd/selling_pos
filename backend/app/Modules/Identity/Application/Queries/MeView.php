<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Queries;

/**
 * The authenticated user with branch context and effective permissions.
 */
final readonly class MeView
{
    /**
     * @param  array{id: string, code: string, name: string}|null  $currentBranch
     * @param  list<array{id: string, code: string, name: string}>  $branches
     * @param  list<string>  $roles
     * @param  list<string>  $permissions
     */
    public function __construct(
        public UserView $user,
        public ?array $currentBranch,
        public array $branches,
        public array $roles,
        public array $permissions,
    ) {}
}
