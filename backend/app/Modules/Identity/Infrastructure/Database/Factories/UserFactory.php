<?php

declare(strict_types=1);

namespace App\Modules\Identity\Infrastructure\Database\Factories;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
final class UserFactory extends Factory
{
    protected $model = User::class;

    public const string PASSWORD = 'Secret@123';

    protected static ?string $passwordHash = null;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => strtolower(fake()->unique()->safeEmail()),
            'email_verified_at' => now(),
            'password' => self::$passwordHash ??= Hash::make(self::PASSWORD),
            'is_active' => true,
            'remember_token' => Str::random(10),
        ];
    }

    public function inactive(): self
    {
        return $this->state(['is_active' => false]);
    }

    public function superAdmin(): self
    {
        return $this->afterMaking(fn (User $user) => $user->forceFill(['is_super_admin' => true]));
    }
}
