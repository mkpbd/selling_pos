<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Presentation\Http\Requests;

use App\Shared\Presentation\Http\Requests\ListRequest;
use Illuminate\Validation\Rule;

final class ListStockRequest extends ListRequest
{
    protected function sortable(): array
    {
        return ['name', 'sku', 'quantity'];
    }

    protected function defaultSort(): string
    {
        return 'name';
    }

    protected function filterRules(): array
    {
        return [
            /** Stock status filter. */
            'status' => ['sometimes', 'nullable', Rule::in(['in_stock', 'low_stock', 'out_of_stock'])],
        ];
    }

    protected function filters(): array
    {
        return ['status' => $this->validated('status')];
    }
}
