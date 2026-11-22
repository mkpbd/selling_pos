<?php

declare(strict_types=1);

namespace App\Modules\Organization\Presentation\Http\Requests;

use App\Shared\Presentation\Http\Requests\ListRequest;

final class ListBranchesRequest extends ListRequest
{
    protected function sortable(): array
    {
        return ['code', 'name', 'created_at'];
    }

    protected function defaultSort(): string
    {
        return 'name';
    }

    protected function filterRules(): array
    {
        return [
            /** Filter by status: true or false. */
            'is_active' => $this->booleanQueryRule(),
        ];
    }

    protected function filters(): array
    {
        return ['is_active' => $this->booleanQuery('is_active')];
    }
}
