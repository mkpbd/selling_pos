<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Requests;

use App\Shared\Presentation\Http\Requests\ListRequest;

final class ListUsersRequest extends ListRequest
{
    protected function sortable(): array
    {
        return ['name', 'email', 'created_at', 'last_login_at'];
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
            /** Only members of this branch. */
            'branch_id' => ['sometimes', 'nullable', 'uuid'],
        ];
    }

    protected function filters(): array
    {
        return [
            'is_active' => $this->booleanQuery('is_active'),
            'branch_id' => $this->validated('branch_id'),
        ];
    }
}
