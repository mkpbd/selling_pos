<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Commands;

use App\Modules\Identity\Application\Contracts\PasswordHasher;
use App\Modules\Identity\Domain\Email;
use App\Modules\Identity\Domain\Events\UserChanged;
use App\Modules\Identity\Domain\UserErrors;
use App\Modules\Identity\Domain\UserRepository;
use App\Shared\Application\Contracts\EventDispatcher;
use App\Shared\Domain\Result\Result;
use InvalidArgumentException;

/**
 * Verifies credentials. Session/token issuance is the caller's concern.
 */
final readonly class AuthenticateHandler
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $hasher,
        private EventDispatcher $events,
    ) {}

    /**
     * @return Result<string> authenticated user id
     */
    public function handle(string $email, string $password): Result
    {
        try {
            $email = new Email($email);
        } catch (InvalidArgumentException) {
            return Result::failure(UserErrors::invalidCredentials());
        }

        $user = $this->users->findByEmail($email);

        if ($user === null) {
            // Burn comparable time so response timing does not reveal accounts.
            static $dummyHash = null;
            $dummyHash ??= $this->hasher->hash('timing-equalizer');
            $this->hasher->check($password, $dummyHash);

            return $this->failed($email, null);
        }

        if (! $this->hasher->check($password, $user->passwordHash())) {
            return $this->failed($email, $user->id);
        }

        if (! $user->isActive()) {
            return Result::failure(UserErrors::inactive());
        }

        $this->users->recordLogin($user->id);
        $this->events->dispatch([new UserChanged('logged_in', $user->id)]);

        return Result::success($user->id);
    }

    /**
     * @return Result<never>
     */
    private function failed(Email $email, ?string $userId): Result
    {
        $this->events->dispatch([new UserChanged('login_failed', $userId, ['email' => $email->value])]);

        return Result::failure(UserErrors::invalidCredentials());
    }
}
