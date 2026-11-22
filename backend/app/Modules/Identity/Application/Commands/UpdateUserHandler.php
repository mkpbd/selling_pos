<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Commands;

use App\Modules\Authorization\Application\Contracts\AccessControl;
use App\Modules\Identity\Application\Contracts\PasswordHasher;
use App\Modules\Identity\Application\Contracts\UserSessions;
use App\Modules\Identity\Application\DTOs\UserData;
use App\Modules\Identity\Application\Services\BranchRoleAssignmentPolicy;
use App\Modules\Identity\Domain\Email;
use App\Modules\Identity\Domain\UserErrors;
use App\Modules\Identity\Domain\UserRepository;
use App\Shared\Application\Context\Actor;
use App\Shared\Application\Contracts\EventDispatcher;
use App\Shared\Application\Contracts\TransactionManager;
use App\Shared\Domain\Result\Result;

final readonly class UpdateUserHandler
{
    public function __construct(
        private UserRepository $users,
        private BranchRoleAssignmentPolicy $assignments,
        private AccessControl $access,
        private PasswordHasher $hasher,
        private UserSessions $sessions,
        private TransactionManager $transactions,
        private EventDispatcher $events,
    ) {}

    /**
     * @return Result<string>
     */
    public function handle(Actor $actor, string $userId, UserData $data): Result
    {
        $email = new Email($data->email);

        return $this->transactions->run(function () use ($actor, $userId, $data, $email): Result {
            $user = $this->users->find($userId);

            // Users outside the actor's active branch are invisible to them.
            if ($user === null || (! $actor->isSuperAdmin && ! in_array($actor->currentBranchId, $user->branchIds(), true))) {
                return Result::failure(UserErrors::notFound());
            }

            if ($user->isSuperAdmin() && ! $actor->isSuperAdmin) {
                return Result::failure(UserErrors::protectedUser());
            }

            if ($user->id === $actor->userId && ! $data->isActive) {
                return Result::failure(UserErrors::cannotDeactivateSelf());
            }

            $existing = $this->access->branchRolesFor([$user->id])[$user->id] ?? [];

            $manageable = $this->assignments->ensureCanManage($actor, $user->id, $existing);
            if ($manageable->isFailure()) {
                return $manageable;
            }

            if ($this->users->emailExists($email, $user->id)) {
                return Result::failure(UserErrors::emailTaken());
            }

            $assignment = $this->assignments->resolve($actor, $data->branchRoles, $existing);
            if ($assignment->isFailure()) {
                return $assignment;
            }
            $branchRoles = $assignment->value();

            $wasActive = $user->isActive();
            $changed = $user->changeProfile(
                $data->name,
                $email,
                $data->isActive,
                $data->defaultBranchId,
                array_map('strval', array_keys($branchRoles)),
            );
            if ($changed->isFailure()) {
                return $changed;
            }

            if ($data->password !== null) {
                $user->changePassword($this->hasher->hash($data->password));
            }

            $this->users->save($user);
            $this->access->syncBranchRoles($user->id, $branchRoles);

            if ($wasActive && ! $user->isActive()) {
                $this->sessions->revokeAll($user->id);
            } elseif ($data->password !== null) {
                $this->sessions->revokeTokens($user->id);
            }

            $this->events->dispatch($user->releaseEvents());

            return Result::success($user->id);
        });
    }
}
