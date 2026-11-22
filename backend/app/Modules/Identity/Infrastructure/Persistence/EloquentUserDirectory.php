<?php

declare(strict_types=1);

namespace App\Modules\Identity\Infrastructure\Persistence;

use App\Modules\Identity\Application\Contracts\UserDirectory;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use Illuminate\Support\Str;

final class EloquentUserDirectory implements UserDirectory
{
    public function names(array $ids): array
    {
        $ids = array_values(array_filter(array_unique($ids), static fn (string $id): bool => Str::isUuid($id)));

        /** @var array<string, string> */
        return $ids === [] ? [] : User::query()->whereKey($ids)->pluck('name', 'id')->all();
    }
}
