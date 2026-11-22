<?php

declare(strict_types=1);

namespace App\Modules\Organization\Domain\Events;

use App\Shared\Domain\Events\BaseDomainEvent;

final class BranchUpdated extends BaseDomainEvent
{
    /**
     * @param  array<string, array{from: mixed, to: mixed}>  $changes
     */
    public function __construct(
        public readonly string $branchId,
        public readonly array $changes,
    ) {
        parent::__construct();
    }

    public function name(): string
    {
        return 'organization.branch_updated';
    }

    public function payload(): array
    {
        return ['branch_id' => $this->branchId, 'changes' => $this->changes];
    }
}
