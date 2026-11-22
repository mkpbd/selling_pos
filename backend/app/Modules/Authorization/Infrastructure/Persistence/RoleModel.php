<?php

declare(strict_types=1);

namespace App\Modules\Authorization\Infrastructure\Persistence;

use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Role as SpatieRole;

/**
 * Spatie role with the `is_system` flag. Role definitions are global
 * (branch_id = null); assignments to users are scoped per branch.
 *
 * @property int $id
 * @property string $name
 * @property string $guard_name
 * @property bool $is_system
 * @property string|null $branch_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
final class RoleModel extends SpatieRole
{
    public const string GUARD = 'web';

    protected function casts(): array
    {
        return ['is_system' => 'boolean'];
    }
}
