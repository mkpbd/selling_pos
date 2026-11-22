<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Queries;

use DateTimeInterface;

final readonly class UserView
{
    /**
     * @param  list<array{id: string, code: string, name: string, roles: list<string>}>  $branches
     */
    public function __construct(
        public string $id,
        public string $name,
        public string $email,
        public bool $isActive,
        public bool $isSuperAdmin,
        public ?string $defaultBranchId,
        public ?DateTimeInterface $lastLoginAt,
        public ?DateTimeInterface $createdAt,
        public ?DateTimeInterface $updatedAt,
        public array $branches,
    ) {}
}
