<?php

declare(strict_types=1);

namespace App\Modules\Authorization\Presentation\Http\Resources;

use App\Modules\Authorization\Application\Queries\RoleView;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read RoleView $resource
 */
final class RoleResource extends JsonResource
{
    /**
     * @return array{id: int, name: string, is_system: bool, permissions: list<string>, users_count: int, created_at: string|null, updated_at: string|null}
     */
    public function toArray(Request $request): array
    {
        $r = $this->resource;

        return [
            'id' => $r->id,
            'name' => $r->name,
            'is_system' => $r->isSystem,
            'permissions' => $r->permissions,
            'users_count' => $r->usersCount,
            'created_at' => $r->createdAt?->format(DATE_ATOM),
            'updated_at' => $r->updatedAt?->format(DATE_ATOM),
        ];
    }
}
