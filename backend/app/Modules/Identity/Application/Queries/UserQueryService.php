<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Queries;

use App\Shared\Application\Pagination\PageRequest;
use App\Shared\Application\Pagination\PageResult;

interface UserQueryService
{
    /**
     * Filters: `is_active` (bool), `branch_id` (uuid). Search: name, email.
     * `$scopeBranchId` restricts results to members of that branch (null = all).
     *
     * @return PageResult<UserView>
     */
    public function paginate(PageRequest $request, ?string $scopeBranchId): PageResult;

    public function findById(string $id, ?string $scopeBranchId = null): ?UserView;

    /**
     * @return list<string>
     */
    public function branchIdsOf(string $userId): array;
}
