<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Resources;

use App\Modules\Identity\Application\Queries\UserView;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read UserView $resource
 */
final class UserResource extends JsonResource
{
    /**
     * @return array{id: string, name: string, email: string, is_active: bool, is_super_admin: bool, default_branch_id: string|null, last_login_at: string|null, created_at: string|null, updated_at: string|null, branches: list<array{id: string, code: string, name: string, roles: list<string>}>}
     */
    public function toArray(Request $request): array
    {
        $u = $this->resource;

        return [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'is_active' => $u->isActive,
            'is_super_admin' => $u->isSuperAdmin,
            'default_branch_id' => $u->defaultBranchId,
            'last_login_at' => $u->lastLoginAt?->format(DATE_ATOM),
            'created_at' => $u->createdAt?->format(DATE_ATOM),
            'updated_at' => $u->updatedAt?->format(DATE_ATOM),
            'branches' => $u->branches,
        ];
    }
}
