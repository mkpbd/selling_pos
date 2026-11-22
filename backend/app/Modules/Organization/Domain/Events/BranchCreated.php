<?php

declare(strict_types=1);

namespace App\Modules\Organization\Domain\Events;

use App\Shared\Domain\Events\BaseDomainEvent;

final class BranchCreated extends BaseDomainEvent
{
    public function __construct(
        public readonly string $branchId,
        public readonly string $code,
        public readonly string $branchName,
    ) {
        parent::__construct();
    }

    public function name(): string
    {
        return 'organization.branch_created';
    }

    public function payload(): array
    {
        return ['branch_id' => $this->branchId, 'code' => $this->code, 'name' => $this->branchName];
    }
}
