<?php

declare(strict_types=1);

namespace App\Modules\Identity\Domain;

use App\Modules\Identity\Domain\Events\UserChanged;
use App\Shared\Domain\AggregateRoot;
use App\Shared\Domain\Result\Result;

/**
 * A person who can sign in. Owns branch membership; role assignment per
 * branch belongs to the Authorization context.
 */
final class User extends AggregateRoot
{
    /**
     * @param  list<string>  $branchIds
     */
    private function __construct(
        public readonly string $id,
        private string $name,
        private Email $email,
        private string $passwordHash,
        private bool $isActive,
        private readonly bool $isSuperAdmin,
        private ?string $defaultBranchId,
        private array $branchIds,
    ) {}

    /**
     * @param  list<string>  $branchIds
     * @return Result<self>
     */
    public static function register(
        string $id,
        string $name,
        Email $email,
        string $passwordHash,
        bool $isActive,
        ?string $defaultBranchId,
        array $branchIds,
    ): Result {
        $user = new self($id, trim($name), $email, $passwordHash, $isActive, false, null, []);

        $membership = $user->applyMembership($defaultBranchId, $branchIds);
        if ($membership->isFailure()) {
            return $membership;
        }

        $user->record(new UserChanged('registered', $id, [
            'email' => $email->value,
            'is_active' => $isActive,
            'branch_ids' => $user->branchIds,
        ]));

        return Result::success($user);
    }

    /**
     * @param  list<string>  $branchIds
     */
    public static function reconstitute(
        string $id,
        string $name,
        Email $email,
        string $passwordHash,
        bool $isActive,
        bool $isSuperAdmin,
        ?string $defaultBranchId,
        array $branchIds,
    ): self {
        return new self($id, $name, $email, $passwordHash, $isActive, $isSuperAdmin, $defaultBranchId, array_values($branchIds));
    }

    /**
     * @param  list<string>  $branchIds
     * @return Result<null>
     */
    public function changeProfile(string $name, Email $email, bool $isActive, ?string $defaultBranchId, array $branchIds): Result
    {
        $before = $this->snapshot();

        // Validate membership first so a failure leaves the aggregate untouched.
        $membership = $this->applyMembership($defaultBranchId, $branchIds);
        if ($membership->isFailure()) {
            return $membership;
        }

        $this->name = trim($name);
        $this->email = $email;
        $this->isActive = $isActive;

        $changes = [];
        foreach ($this->snapshot() as $field => $value) {
            if ($before[$field] !== $value) {
                $changes[$field] = ['from' => $before[$field], 'to' => $value];
            }
        }

        if ($changes !== []) {
            $action = $before['is_active'] && ! $isActive ? 'deactivated' : 'updated';
            $this->record(new UserChanged($action, $this->id, $changes));
        }

        return Result::success();
    }

    public function changePassword(string $passwordHash): void
    {
        $this->passwordHash = $passwordHash;
        $this->record(new UserChanged('password_changed', $this->id));
    }

    /**
     * @param  list<string>  $branchIds
     * @return Result<null>
     */
    private function applyMembership(?string $defaultBranchId, array $branchIds): Result
    {
        $branchIds = array_values(array_unique($branchIds));

        if (! $this->isSuperAdmin && $branchIds === []) {
            return Result::failure(UserErrors::branchRequired());
        }

        if ($defaultBranchId !== null && ! in_array($defaultBranchId, $branchIds, true)) {
            return Result::failure(UserErrors::defaultBranchNotAssigned());
        }

        $this->branchIds = $branchIds;
        $this->defaultBranchId = $defaultBranchId ?? ($branchIds[0] ?? null);

        return Result::success();
    }

    /**
     * @return array<string, mixed>
     */
    private function snapshot(): array
    {
        return [
            'name' => $this->name,
            'email' => $this->email->value,
            'is_active' => $this->isActive,
            'default_branch_id' => $this->defaultBranchId,
            'branch_ids' => $this->branchIds,
        ];
    }

    public function name(): string
    {
        return $this->name;
    }

    public function email(): Email
    {
        return $this->email;
    }

    public function passwordHash(): string
    {
        return $this->passwordHash;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function isSuperAdmin(): bool
    {
        return $this->isSuperAdmin;
    }

    public function defaultBranchId(): ?string
    {
        return $this->defaultBranchId;
    }

    /**
     * @return list<string>
     */
    public function branchIds(): array
    {
        return $this->branchIds;
    }
}
