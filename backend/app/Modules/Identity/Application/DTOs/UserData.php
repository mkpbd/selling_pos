<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\DTOs;

final readonly class UserData
{
    /**
     * @param  list<array{branch_id: string, roles: list<string>}>  $branchRoles
     */
    public function __construct(
        public string $name,
        public string $email,
        public ?string $password,
        public bool $isActive,
        public ?string $defaultBranchId,
        public array $branchRoles,
    ) {}

    /**
     * @param  array<string, mixed>  $input  validated input
     */
    public static function fromArray(array $input): self
    {
        $branchRoles = [];
        foreach ($input['branch_roles'] ?? [] as $row) {
            $branchRoles[] = [
                'branch_id' => (string) $row['branch_id'],
                'roles' => array_values(array_map('strval', $row['roles'] ?? [])),
            ];
        }

        $password = $input['password'] ?? null;

        return new self(
            name: (string) $input['name'],
            email: (string) $input['email'],
            password: $password === null || $password === '' ? null : (string) $password,
            isActive: (bool) ($input['is_active'] ?? true),
            defaultBranchId: isset($input['default_branch_id']) ? (string) $input['default_branch_id'] : null,
            branchRoles: $branchRoles,
        );
    }
}
