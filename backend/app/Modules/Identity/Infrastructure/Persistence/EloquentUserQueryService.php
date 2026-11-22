<?php

declare(strict_types=1);

namespace App\Modules\Identity\Infrastructure\Persistence;

use App\Modules\Authorization\Application\Contracts\AccessControl;
use App\Modules\Identity\Application\Queries\UserQueryService;
use App\Modules\Identity\Application\Queries\UserView;
use App\Modules\Identity\Infrastructure\Persistence\Models\User as UserModel;
use App\Modules\Organization\Application\Contracts\BranchDirectory;
use App\Shared\Application\Pagination\PageRequest;
use App\Shared\Application\Pagination\PageResult;
use App\Shared\Infrastructure\Persistence\Search;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Read side for users. Branch details and roles come from the owning
 * contexts' published contracts (batched — no N+1).
 */
final readonly class EloquentUserQueryService implements UserQueryService
{
    private const array SORTABLE = ['name', 'email', 'created_at', 'last_login_at'];

    public function __construct(
        private BranchDirectory $branches,
        private AccessControl $access,
    ) {}

    public function paginate(PageRequest $request, ?string $scopeBranchId): PageResult
    {
        $sort = in_array($request->sortField, self::SORTABLE, true) ? $request->sortField : 'name';
        $branchFilter = $request->filter('branch_id');

        $paginator = UserModel::query()
            ->when($scopeBranchId !== null, fn (Builder $q) => $this->memberOf($q, $scopeBranchId))
            ->when($branchFilter !== null, fn (Builder $q) => $this->memberOf($q, (string) $branchFilter))
            ->when($request->search !== null, fn (Builder $q) => $q->whereAny(['name', 'email'], 'ilike', Search::contains((string) $request->search)))
            ->when($request->filter('is_active') !== null, fn (Builder $q) => $q->where('is_active', (bool) $request->filter('is_active')))
            ->orderBy($sort, $request->sortDescending ? 'desc' : 'asc')
            ->orderBy('id')
            ->paginate($request->perPage, ['*'], 'page', $request->page);

        /** @var list<UserModel> $models */
        $models = $paginator->items();

        return new PageResult($this->toViews($models), $paginator->total(), $paginator->currentPage(), $paginator->perPage());
    }

    public function findById(string $id, ?string $scopeBranchId = null): ?UserView
    {
        if (! Str::isUuid($id)) {
            return null;
        }

        $model = UserModel::query()
            ->whereKey($id)
            ->when($scopeBranchId !== null, fn (Builder $q) => $this->memberOf($q, $scopeBranchId))
            ->first();

        return $model === null ? null : $this->toViews([$model])[0];
    }

    public function branchIdsOf(string $userId): array
    {
        /** @var list<string> */
        return DB::table(EloquentUserRepository::MEMBERSHIP_TABLE)->where('user_id', $userId)->pluck('branch_id')->all();
    }

    /**
     * @param  Builder<UserModel>  $query
     */
    private function memberOf(Builder $query, string $branchId): void
    {
        $query->whereExists(fn ($sub) => $sub
            ->selectRaw('1')
            ->from(EloquentUserRepository::MEMBERSHIP_TABLE.' as bu')
            ->whereColumn('bu.user_id', 'users.id')
            ->where('bu.branch_id', $branchId));
    }

    /**
     * @param  list<UserModel>  $models
     * @return list<UserView>
     */
    private function toViews(array $models): array
    {
        if ($models === []) {
            return [];
        }

        $userIds = array_map(static fn (UserModel $m) => $m->id, $models);

        $memberships = [];
        foreach (DB::table(EloquentUserRepository::MEMBERSHIP_TABLE)->whereIn('user_id', $userIds)->get(['user_id', 'branch_id']) as $row) {
            $memberships[(string) $row->user_id][] = (string) $row->branch_id;
        }

        $summaries = $this->branches->summaries(array_merge([], ...array_values($memberships)));
        $roles = $this->access->branchRolesFor($userIds);

        return array_map(function (UserModel $m) use ($memberships, $summaries, $roles): UserView {
            $branches = [];
            foreach ($summaries as $branchId => $summary) {
                if (in_array($branchId, $memberships[$m->id] ?? [], true)) {
                    $branches[] = [...$summary->toArray(), 'roles' => $roles[$m->id][$branchId] ?? []];
                }
            }

            return new UserView(
                $m->id,
                $m->name,
                $m->email,
                $m->is_active,
                $m->is_super_admin,
                $m->default_branch_id,
                $m->last_login_at,
                $m->created_at,
                $m->updated_at,
                $branches,
            );
        }, $models);
    }
}
