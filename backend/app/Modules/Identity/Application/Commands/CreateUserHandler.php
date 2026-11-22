<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Commands;

use App\Modules\Authorization\Application\Contracts\AccessControl;
use App\Modules\Identity\Application\Contracts\PasswordHasher;
use App\Modules\Identity\Application\DTOs\UserData;
use App\Modules\Identity\Application\Services\BranchRoleAssignmentPolicy;
use App\Modules\Identity\Domain\Email;
use App\Modules\Identity\Domain\User;
use App\Modules\Identity\Domain\UserErrors;
use App\Modules\Identity\Domain\UserRepository;
use App\Shared\Application\Context\Actor;
use App\Shared\Application\Contracts\EventDispatcher;
use App\Shared\Application\Contracts\TransactionManager;
use App\Shared\Domain\Result\Result;
use LogicException;

final readonly class CreateUserHandler
{
    public function __construct(
        private UserRepository $users,
        private BranchRoleAssignmentPolicy $assignments,
        private AccessControl $access,
        private PasswordHasher $hasher,
        private TransactionManager $transactions,
        private EventDispatcher $events,
    ) {}

    /**
     * @return Result<string> id of the new user
     */
    public function handle(Actor $actor, UserData $data): Result
    {
        if ($data->password === null) {
            throw new LogicException('A password is required to create a user.');
        }

        $email = new Email($data->email);

        return $this->transactions->run(function () use ($actor, $data, $email): Result {
            if ($this->users->emailExists($email)) {
                return Result::failure(UserErrors::emailTaken());
            }

            $assignment = $this->assignments->resolve($actor, $data->branchRoles);
            if ($assignment->isFailure()) {
                return $assignment;
            }
            $branchRoles = $assignment->value();

            $registered = User::register(
                $this->users->nextId(),
                $data->name,
                $email,
                $this->hasher->hash((string) $data->password),
                $data->isActive,
                $data->defaultBranchId,
                array_map('strval', array_keys($branchRoles)),
            );
            if ($registered->isFailure()) {
                return $registered;
            }

            $user = $registered->value();
            $this->users->save($user);
            $this->access->syncBranchRoles($user->id, $branchRoles);
            $this->events->dispatch($user->releaseEvents());

            return Result::success($user->id);
        });
    }
}
