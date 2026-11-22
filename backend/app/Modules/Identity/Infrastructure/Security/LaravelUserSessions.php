<?php

declare(strict_types=1);

namespace App\Modules\Identity\Infrastructure\Security;

use App\Modules\Identity\Application\Contracts\UserSessions;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;

final class LaravelUserSessions implements UserSessions
{
    public function revokeAll(string $userId): void
    {
        $this->revokeTokens($userId);

        if (config('session.driver') === 'database') {
            DB::table((string) config('session.table', 'sessions'))->where('user_id', $userId)->delete();
        }

        // Invalidate "remember me" cookies.
        User::query()->whereKey($userId)->update(['remember_token' => null]);
    }

    public function revokeTokens(string $userId, ?string $keepTokenId = null): void
    {
        PersonalAccessToken::query()
            ->where('tokenable_type', (new User)->getMorphClass())
            ->where('tokenable_id', $userId)
            ->when($keepTokenId !== null, fn ($q) => $q->whereKeyNot($keepTokenId))
            ->delete();
    }
}
