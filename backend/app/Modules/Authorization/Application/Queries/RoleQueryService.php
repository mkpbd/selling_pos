<?php

declare(strict_types=1);

namespace App\Modules\Authorization\Application\Queries;

interface RoleQueryService
{
    /**
     * @return list<RoleView>
     */
    public function all(): array;

    public function find(int $id): ?RoleView;
}
