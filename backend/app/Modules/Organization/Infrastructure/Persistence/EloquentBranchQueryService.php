<?php

declare(strict_types=1);

namespace App\Modules\Organization\Infrastructure\Persistence;

use App\Modules\Organization\Application\Queries\BranchQueryService;
use App\Modules\Organization\Application\Queries\BranchView;
use App\Shared\Application\Pagination\PageRequest;
use App\Shared\Application\Pagination\PageResult;
use App\Shared\Infrastructure\Persistence\Search;
use Illuminate\Support\Str;

final class EloquentBranchQueryService implements BranchQueryService
{
    private const array SORTABLE = ['code', 'name', 'created_at'];

    public function paginate(PageRequest $request): PageResult
    {
        $sort = in_array($request->sortField, self::SORTABLE, true) ? $request->sortField : 'name';

        $paginator = BranchModel::query()
            ->when($request->search !== null, fn ($q) => $q->whereAny(
                ['code', 'name', 'phone', 'email'],
                'ilike',
                Search::contains((string) $request->search),
            ))
            ->when($request->filter('is_active') !== null, fn ($q) => $q->where('is_active', (bool) $request->filter('is_active')))
            ->orderBy($sort, $request->sortDescending ? 'desc' : 'asc')
            ->orderBy('id')
            ->paginate($request->perPage, ['*'], 'page', $request->page);

        return new PageResult(
            array_map($this->toView(...), $paginator->items()),
            $paginator->total(),
            $paginator->currentPage(),
            $paginator->perPage(),
        );
    }

    public function findById(string $id): ?BranchView
    {
        if (! Str::isUuid($id)) {
            return null;
        }

        $model = BranchModel::query()->find($id);

        return $model === null ? null : $this->toView($model);
    }

    private function toView(BranchModel $m): BranchView
    {
        return new BranchView(
            $m->id,
            $m->code,
            $m->name,
            $m->phone,
            $m->email,
            $m->address,
            $m->is_active,
            $m->created_at,
            $m->updated_at,
        );
    }
}
