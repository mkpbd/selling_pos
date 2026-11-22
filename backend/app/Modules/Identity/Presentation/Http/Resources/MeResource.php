<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Resources;

use App\Modules\Identity\Application\Queries\MeView;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read MeView $resource
 */
final class MeResource extends JsonResource
{
    /**
     * @return array{id: string, name: string, email: string, is_active: bool, is_super_admin: bool, default_branch_id: string|null, last_login_at: string|null, current_branch: array{id: string, code: string, name: string}|null, branches: list<array{id: string, code: string, name: string}>, roles: list<string>, permissions: list<string>}
     */
    public function toArray(Request $request): array
    {
        $me = $this->resource;
        $u = $me->user;

        return [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'is_active' => $u->isActive,
            'is_super_admin' => $u->isSuperAdmin,
            'default_branch_id' => $u->defaultBranchId,
            'last_login_at' => $u->lastLoginAt?->format(DATE_ATOM),
            'current_branch' => $me->currentBranch,
            'branches' => $me->branches,
            'roles' => $me->roles,
            'permissions' => $me->permissions,
        ];
    }
}
