<?php

declare(strict_types=1);

namespace App\Modules\Identity\Infrastructure\Persistence;

use App\Modules\Identity\Domain\Email;
use App\Modules\Identity\Domain\User;
use App\Modules\Identity\Domain\UserRepository;
use App\Modules\Identity\Infrastructure\Persistence\Models\User as UserModel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class EloquentUserRepository implements UserRepository
{
    public const string MEMBERSHIP_TABLE = 'branch_user';

    public function nextId(): string
    {
        return (string) Str::uuid7();
    }

    public function find(string $id): ?User
    {
        return Str::isUuid($id) ? $this->hydrate(UserModel::query()->find($id)) : null;
    }

    public function findByEmail(Email $email): ?User
    {
        return $this->hydrate(UserModel::query()->where('email', $email->value)->first());
    }

    public function emailExists(Email $email, ?string $exceptId = null): bool
    {
        return UserModel::query()
            ->where('email', $email->value)
            ->when($exceptId !== null, fn ($q) => $q->whereKeyNot($exceptId))
            ->exists();
    }

    public function save(User $user): void
    {
        $model = UserModel::query()->find($user->id) ?? new UserModel;
        $model->id = $user->id;
        $model->forceFill([
            'name' => $user->name(),
            'email' => $user->email()->value,
            'password' => $user->passwordHash(), // already hashed by the application layer
            'is_active' => $user->isActive(),
            'default_branch_id' => $user->defaultBranchId(),
        ])->save();

        $this->syncMembership($user->id, $user->branchIds());
    }

    public function recordLogin(string $id): void
    {
        UserModel::query()->whereKey($id)->update(['last_login_at' => now()]);
    }

    /**
     * @param  list<string>  $branchIds
     */
    private function syncMembership(string $userId, array $branchIds): void
    {
        $table = DB::table(self::MEMBERSHIP_TABLE);

        $table->clone()->where('user_id', $userId)->whereNotIn('branch_id', $branchIds)->delete();

        $existing = $table->clone()->where('user_id', $userId)->pluck('branch_id')->all();
        $now = now();
        $rows = array_map(
            static fn (string $branchId) => ['user_id' => $userId, 'branch_id' => $branchId, 'created_at' => $now],
            array_values(array_diff($branchIds, $existing)),
        );

        if ($rows !== []) {
            $table->clone()->insert($rows);
        }
    }

    private function hydrate(?UserModel $model): ?User
    {
        if ($model === null) {
            return null;
        }

        /** @var list<string> $branchIds */
        $branchIds = DB::table(self::MEMBERSHIP_TABLE)->where('user_id', $model->id)->pluck('branch_id')->all();

        return User::reconstitute(
            $model->id,
            $model->name,
            new Email($model->email),
            $model->password,
            $model->is_active,
            $model->is_super_admin,
            $model->default_branch_id,
            $branchIds,
        );
    }
}
