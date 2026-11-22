<?php

declare(strict_types=1);

namespace App\Modules\Products\Infrastructure\Persistence;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $code
 * @property string $name
 * @property bool $allows_decimal
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
final class UnitModel extends Model
{
    use HasUuids;

    protected $table = 'units';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['allows_decimal' => 'boolean'];
    }
}
