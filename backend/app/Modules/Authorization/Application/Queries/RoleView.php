<?php

declare(strict_types=1);

namespace App\Modules\Authorization\Application\Queries;

use DateTimeInterface;

final readonly class RoleView
{
    /**
     * @param  list<string>  $permissions
     */
    public function __construct(
        public int $id,
        public string $name,
        public bool $isSystem,
        public array $permissions,
        public int $usersCount,
        public ?DateTimeInterface $createdAt,
        public ?DateTimeInterface $updatedAt,
    ) {}
}
