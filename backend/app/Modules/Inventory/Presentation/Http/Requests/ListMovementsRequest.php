<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Presentation\Http\Requests;

use App\Modules\Inventory\Domain\MovementType;
use App\Shared\Presentation\Http\Requests\ListRequest;
use Illuminate\Validation\Rule;

final class ListMovementsRequest extends ListRequest
{
    protected function sortable(): array
    {
        return ['created_at'];
    }

    protected function filterRules(): array
    {
        return [
            'product_id' => ['sometimes', 'nullable', 'uuid'],
            'type' => ['sometimes', 'nullable', Rule::enum(MovementType::class)],
            /** Inclusive start date. @example 2026-11-01 */
            'from' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            /** Inclusive end date. @example 2026-11-30 */
            'to' => ['sometimes', 'nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ];
    }

    protected function filters(): array
    {
        return [
            'product_id' => $this->validated('product_id'),
            'type' => $this->validated('type'),
            'from' => $this->validated('from'),
            'to' => $this->validated('to'),
        ];
    }
}
