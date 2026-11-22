<?php

declare(strict_types=1);

namespace App\Modules\Products\Domain\Events;

use App\Shared\Domain\Events\BaseDomainEvent;

/**
 * Published when a unit of measure is created or its code/decimal rule changes.
 */
final class UnitChanged extends BaseDomainEvent
{
    public function __construct(
        public readonly string $unitId,
        public readonly string $code,
        public readonly bool $allowsDecimal,
    ) {
        parent::__construct();
    }

    public function name(): string
    {
        return 'products.unit_changed';
    }

    public function payload(): array
    {
        return ['unit_id' => $this->unitId, 'code' => $this->code, 'allows_decimal' => $this->allowsDecimal];
    }
}
