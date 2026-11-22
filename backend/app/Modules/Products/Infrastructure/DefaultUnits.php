<?php

declare(strict_types=1);

namespace App\Modules\Products\Infrastructure;

use App\Modules\Products\Application\Commands\UnitHandlers;
use App\Modules\Products\Domain\UnitRepository;

/**
 * Seeds the standard units of measure (idempotent).
 */
final readonly class DefaultUnits
{
    public const array UNITS = [
        ['PCS', 'Piece', false],
        ['BOX', 'Box', false],
        ['KG', 'Kilogram', true],
        ['L', 'Litre', true],
    ];

    public function __construct(
        private UnitRepository $units,
        private UnitHandlers $handlers,
    ) {}

    public function seed(): void
    {
        foreach (self::UNITS as [$code, $name, $decimal]) {
            if (! $this->units->codeExists($code)) {
                $this->handlers->create($code, $name, $decimal);
            }
        }
    }
}
