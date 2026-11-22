<?php

declare(strict_types=1);

namespace App\Modules\Organization\Infrastructure\Persistence;

use App\Modules\Organization\Infrastructure\Database\Factories\BranchModelFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $code
 * @property string $name
 * @property string|null $phone
 * @property string|null $email
 * @property string|null $address
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
final class BranchModel extends Model
{
    /** @use HasFactory<BranchModelFactory> */
    use HasFactory, HasUuids;

    protected $table = 'branches';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    protected static function newFactory(): BranchModelFactory
    {
        return BranchModelFactory::new();
    }
}
