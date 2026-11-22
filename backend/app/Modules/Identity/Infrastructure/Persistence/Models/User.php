<?php

declare(strict_types=1);

namespace App\Modules\Identity\Infrastructure\Persistence\Models;

use App\Modules\Identity\Infrastructure\Database\Factories\UserFactory;
use App\Modules\Identity\Infrastructure\Notifications\ResetPasswordNotification;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

/**
 * Eloquent persistence + authentication model. Business rules live in the
 * {@see \App\Modules\Identity\Domain\User} aggregate, not here.
 *
 * @property string $id
 * @property string $name
 * @property string $email
 * @property string $password
 * @property bool $is_active
 * @property bool $is_super_admin
 * @property string|null $default_branch_id
 * @property Carbon|null $last_login_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Hidden(['password', 'remember_token'])]
final class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, HasUuids, Notifiable;

    protected $table = 'users';

    /** Spatie permission guard used for all role checks. */
    protected string $guard_name = 'web';

    protected $guarded = ['id', 'is_super_admin'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            // No "hashed" cast: hashing is owned by the PasswordHasher port.
            'is_active' => 'boolean',
            'is_super_admin' => 'boolean',
        ];
    }

    public function sendPasswordResetNotification(#[\SensitiveParameter] $token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    protected static function newFactory(): UserFactory
    {
        return UserFactory::new();
    }
}
