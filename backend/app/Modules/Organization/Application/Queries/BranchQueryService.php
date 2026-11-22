<?php

declare(strict_types=1);

namespace App\Modules\Organization\Application\Queries;

use App\Shared\Application\Pagination\PageRequest;
use App\Shared\Application\Pagination\PageResult;

interface BranchQueryService
{
    /**
     * Filters: `is_active` (bool). Search: code, name, phone, email.
     *
     * @return PageResult<BranchView>
     */
    public function paginate(PageRequest $request): PageResult;

    public function findById(string $id): ?BranchView;
}
