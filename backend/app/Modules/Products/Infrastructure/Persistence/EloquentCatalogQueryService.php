<?php

declare(strict_types=1);

namespace App\Modules\Products\Infrastructure\Persistence;

use App\Modules\Products\Application\Queries\CatalogQueryService;
use App\Modules\Products\Application\Queries\ProductView;
use App\Shared\Application\Pagination\PageRequest;
use App\Shared\Application\Pagination\PageResult;
use App\Shared\Domain\ValueObjects\Money;
use App\Shared\Domain\ValueObjects\Percentage;
use App\Shared\Infrastructure\Persistence\Search;
use Illuminate\Support\Str;

final class EloquentCatalogQueryService implements CatalogQueryService
{
    private const array SORTABLE = ['name', 'sku', 'selling_price', 'created_at'];

    public function paginateProducts(PageRequest $request): PageResult
    {
        $sort = in_array($request->sortField, self::SORTABLE, true) ? $request->sortField : 'name';

        $paginator = ProductModel::query()
            ->with(['category:id,name', 'unit:id,code,name,allows_decimal'])
            ->when($request->search !== null, fn ($q) => $q->whereAny(['sku', 'name', 'barcode'], 'ilike', Search::contains((string) $request->search)))
            ->when($request->filter('category_id') !== null, fn ($q) => $q->where('category_id', $request->filter('category_id')))
            ->when($request->filter('is_active') !== null, fn ($q) => $q->where('is_active', (bool) $request->filter('is_active')))
            ->orderBy($sort, $request->sortDescending ? 'desc' : 'asc')
            ->orderBy('id')
            ->paginate($request->perPage, ['*'], 'page', $request->page);

        /** @var list<ProductModel> $items */
        $items = $paginator->items();

        return new PageResult(array_map($this->toView(...), $items), $paginator->total(), $paginator->currentPage(), $paginator->perPage());
    }

    public function findProduct(string $id): ?ProductView
    {
        if (! Str::isUuid($id)) {
            return null;
        }

        $m = ProductModel::query()->with(['category:id,name', 'unit:id,code,name,allows_decimal'])->find($id);

        return $m === null ? null : $this->toView($m);
    }

    public function categories(?string $search = null, ?string $id = null): array
    {
        $search = $search === null ? '' : trim($search);

        return CategoryModel::query()
            ->selectRaw('categories.*, (select count(*) from products p where p.category_id = categories.id) as products_count')
            ->when($search !== '', fn ($q) => $q->where('name', 'ilike', Search::contains($search)))
            ->when($id !== null, fn ($q) => $q->whereKey($id))
            ->orderBy('name')
            ->get()
            ->map(fn (CategoryModel $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'description' => $c->description,
                'is_active' => $c->is_active,
                'products_count' => (int) $c->getAttribute('products_count'),
                'created_at' => $c->created_at?->toIso8601String(),
                'updated_at' => $c->updated_at?->toIso8601String(),
            ])->values()->all();
    }

    public function units(?string $id = null): array
    {
        return UnitModel::query()
            ->selectRaw('units.*, (select count(*) from products p where p.unit_id = units.id) as products_count')
            ->when($id !== null, fn ($q) => $q->whereKey($id))
            ->orderBy('code')
            ->get()
            ->map(fn (UnitModel $u) => [
                'id' => $u->id,
                'code' => $u->code,
                'name' => $u->name,
                'allows_decimal' => $u->allows_decimal,
                'products_count' => (int) $u->getAttribute('products_count'),
                'created_at' => $u->created_at?->toIso8601String(),
                'updated_at' => $u->updated_at?->toIso8601String(),
            ])->all();
    }

    private function toView(ProductModel $m): ProductView
    {
        $cost = Money::of($m->cost_price);
        $price = Money::of($m->selling_price);

        return new ProductView(
            $m->id,
            $m->sku,
            $m->barcode,
            $m->name,
            $m->description,
            $m->category === null ? null : ['id' => $m->category->id, 'name' => $m->category->name],
            ['id' => $m->unit->id, 'code' => $m->unit->code, 'name' => $m->unit->name, 'allows_decimal' => $m->unit->allows_decimal],
            (string) $cost,
            (string) $price,
            (string) Percentage::of($m->tax_rate),
            Percentage::ratio($price->minus($cost)->minor, $price->minor),
            $m->track_stock,
            $m->is_active,
            $m->created_at,
            $m->updated_at,
        );
    }
}
