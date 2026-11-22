<?php

declare(strict_types=1);

namespace App\Modules\Authorization\Application\Commands;

use App\Modules\Authorization\Domain\Role;
use App\Modules\Authorization\Domain\RoleErrors;
use App\Modules\Authorization\Domain\RoleRepository;
use App\Shared\Application\Contracts\EventDispatcher;
use App\Shared\Application\Contracts\TransactionManager;
use App\Shared\Domain\Result\Result;

/**
 * Role management use cases (create / update / delete).
 * Permission names are validated against the registry at the edge.
 */
final readonly class RoleHandlers
{
    public function __construct(
        private RoleRepository $roles,
        private TransactionManager $transactions,
        private EventDispatcher $events,
    ) {}

    /**
     * @param  list<string>  $permissions
     * @return Result<int> new role id
     */
    public function create(string $name, array $permissions): Result
    {
        return $this->transactions->run(function () use ($name, $permissions): Result {
            if ($this->roles->nameExists($name)) {
                return Result::failure(RoleErrors::nameTaken($name));
            }

            $role = Role::define($name, $permissions);
            $this->roles->save($role);
            $this->events->dispatch($role->releaseEvents());

            return Result::success((int) $role->id());
        });
    }

    /**
     * @param  list<string>  $permissions
     * @return Result<int>
     */
    public function update(int $id, string $name, array $permissions): Result
    {
        return $this->transactions->run(function () use ($id, $name, $permissions): Result {
            $role = $this->roles->find($id);

            if ($role === null) {
                return Result::failure(RoleErrors::notFound());
            }

            if ($this->roles->nameExists($name, $id)) {
                return Result::failure(RoleErrors::nameTaken($name));
            }

            $changed = $role->change($name, $permissions);
            if ($changed->isFailure()) {
                return $changed;
            }

            $this->roles->save($role);
            $this->events->dispatch($role->releaseEvents());

            return Result::success($id);
        });
    }

    /**
     * @return Result<null>
     */
    public function delete(int $id): Result
    {
        return $this->transactions->run(function () use ($id): Result {
            $role = $this->roles->find($id);

            if ($role === null) {
                return Result::failure(RoleErrors::notFound());
            }

            $deletable = $role->ensureDeletable($this->roles->isAssigned($id));
            if ($deletable->isFailure()) {
                return $deletable;
            }

            $this->roles->delete($role);
            $this->events->dispatch($role->releaseEvents());

            return Result::success();
        });
    }
}
