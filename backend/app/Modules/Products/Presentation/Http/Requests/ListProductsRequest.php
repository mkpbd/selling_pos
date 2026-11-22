<?php

declare(strict_types=1);

namespace App\Modules\Products\Presentation\Http\Requests;

use App\Shared\Presentation\Http\Requests\ListRequest;

final class ListProductsRequest extends ListRequest
{
    protected function sortable(): array
    {
        return ['name', 'sku', 'selling_price', 'created_at'];
    }

    protected function defaultSort(): string
    {
        return 'name';
    }

    protected function filterRules(): array
    {
        return [
            'category_id' => ['sometimes', 'nullable', 'uuid'],
            /** Filter by status: true or false. */
            'is_active' => $this->booleanQueryRule(),
        ];
    }

    protected function filters(): array
    {
        return [
            'category_id' => $this->validated('category_id'),
            'is_active' => $this->booleanQuery('is_active'),
        ];
    }
}
