<?php

declare(strict_types=1);

namespace App\Modules\Organization\Presentation\Http\Resources;

use App\Modules\Organization\Application\Queries\BranchView;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read BranchView $resource
 */
final class BranchResource extends JsonResource
{
    /**
     * @return array{id: string, code: string, name: string, phone: string|null, email: string|null, address: string|null, is_active: bool, created_at: string|null, updated_at: string|null}
     */
    public function toArray(Request $request): array
    {
        $b = $this->resource;

        return [
            'id' => $b->id,
            'code' => $b->code,
            'name' => $b->name,
            'phone' => $b->phone,
            'email' => $b->email,
            'address' => $b->address,
            'is_active' => $b->isActive,
            'created_at' => $b->createdAt?->format(DATE_ATOM),
            'updated_at' => $b->updatedAt?->format(DATE_ATOM),
        ];
    }
}
