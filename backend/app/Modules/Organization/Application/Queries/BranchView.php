<?php

declare(strict_types=1);

namespace App\Modules\Organization\Application\Queries;

use DateTimeInterface;

/**
 * Read model returned by branch queries.
 */
final readonly class BranchView
{
    public function __construct(
        public string $id,
        public string $code,
        public string $name,
        public ?string $phone,
        public ?string $email,
        public ?string $address,
        public bool $isActive,
        public ?DateTimeInterface $createdAt,
        public ?DateTimeInterface $updatedAt,
    ) {}
}
