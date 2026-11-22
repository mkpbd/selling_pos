<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Commands;

use App\Modules\Identity\Application\Contracts\PasswordHasher;
use App\Modules\Identity\Application\Contracts\UserSessions;
use App\Modules\Identity\Domain\UserErrors;
use App\Modules\Identity\Domain\UserRepository;
use App\Shared\Application\Contracts\EventDispatcher;
use App\Shared\Application\Contracts\TransactionManager;
use App\Shared\Domain\Result\Result;

final readonly class ChangePasswordHandler
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $hasher,
        private UserSessions $sessions,
        private TransactionManager $transactions,
        private EventDispatcher $events,
    ) {}

    /**
     * Other API tokens are revoked; the token in use (if any) is kept.
     *
     * @return Result<null>
     */
    public function handle(string $userId, string $currentPassword, string $newPassword, ?string $keepTokenId = null): Result
    {
        return $this->transactions->run(function () use ($userId, $currentPassword, $newPassword, $keepTokenId): Result {
            $user = $this->users->find($userId);

            if ($user === null) {
                return Result::failure(UserErrors::notFound());
            }

            if (! $this->hasher->check($currentPassword, $user->passwordHash())) {
                return Result::failure(UserErrors::wrongCurrentPassword());
            }

            $user->changePassword($this->hasher->hash($newPassword));
            $this->users->save($user);
            $this->sessions->revokeTokens($userId, $keepTokenId);
            $this->events->dispatch($user->releaseEvents());

            return Result::success();
        });
    }
}
