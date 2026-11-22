<?php

declare(strict_types=1);

namespace App\Modules\Identity\Infrastructure\Security;

use App\Modules\Identity\Application\Contracts\PasswordHasher;
use App\Modules\Identity\Application\Contracts\PasswordResetService;
use App\Modules\Identity\Application\Contracts\UserSessions;
use App\Modules\Identity\Domain\Events\UserChanged;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Shared\Application\Contracts\EventDispatcher;
use App\Shared\Domain\Result\Error;
use App\Shared\Domain\Result\Result;
use Illuminate\Support\Facades\Password;

/**
 * Password reset via Laravel's password broker (hashed, expiring tokens
 * stored in password_reset_tokens, throttled per email).
 */
final readonly class LaravelPasswordResetService implements PasswordResetService
{
    public function __construct(
        private PasswordHasher $hasher,
        private UserSessions $sessions,
        private EventDispatcher $events,
    ) {}

    public function sendResetLink(string $email): void
    {
        $email = strtolower(trim($email));

        // Only active accounts receive links; the response is identical either way.
        if (User::query()->where('email', $email)->where('is_active', true)->exists()) {
            Password::broker()->sendResetLink(['email' => $email]);
        }
    }

    public function reset(string $email, #[\SensitiveParameter] string $token, #[\SensitiveParameter] string $newPassword): Result
    {
        $status = Password::broker()->reset(
            ['email' => strtolower(trim($email)), 'token' => $token, 'password' => $newPassword],
            function (User $user, string $password): void {
                $user->forceFill(['password' => $this->hasher->hash($password)])->save();
                $this->sessions->revokeAll($user->id);
                $this->events->dispatch([new UserChanged('password_reset', $user->id)]);
            },
        );

        return $status === Password::PASSWORD_RESET
            ? Result::success()
            : Result::failure(Error::validation('VALIDATION_FAILED', 'This password reset link is invalid or has expired.', [
                'email' => ['This password reset link is invalid or has expired.'],
            ]));
    }
}
