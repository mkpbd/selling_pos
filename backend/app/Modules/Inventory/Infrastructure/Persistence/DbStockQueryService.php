<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Infrastructure\Persistence;

use App\Modules\Identity\Application\Contracts\UserDirectory;
use App\Modules\Inventory\Application\Queries\StockQueryService;
use App\Shared\Application\Pagination\PageRequest;
use App\Shared\Application\Pagination\PageResult;
use App\Shared\Domain\ValueObjects\Money;
use App\Shared\Domain\ValueObjects\Quantity;
use App\Shared\Infrastructure\Persistence\Search;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final readonly class DbStockQueryService implements StockQueryService
{
    private const string QTY = 'coalesce(s.quantity, 0)';

    private const string REORDER = 'coalesce(s.reorder_level, 0)';

    public function __construct(private UserDirectory $users) {}

    public function paginateStock(string $branchId, PageRequest $request): PageResult
    {
        $sort = match ($request->sortField) {
            'sku' => 'p.sku',
            'quantity' => DB::raw(self::QTY),
            default => 'p.name',
        };

        $query = $this->stockQuery($branchId)
            ->when($request->search !== null, fn (Builder $q) => $q->whereAny(['p.sku', 'p.name', 'p.barcode'], 'ilike', Search::contains((string) $request->search)))
            ->when($request->filter('status') !== null, fn (Builder $q) => $q->whereRaw($this->statusSql().' = ?', [$request->filter('status')]))
            ->orderBy($sort, $request->sortDescending ? 'desc' : 'asc')
            ->orderBy('p.product_id');

        $paginator = $query->paginate($request->perPage, ['*'], 'page', $request->page);

        return new PageResult(
            array_map($this->toStockRow(...), $paginator->items()),
            $paginator->total(),
            $paginator->currentPage(),
            $paginator->perPage(),
        );
    }

    public function findStock(string $branchId, string $productId): ?array
    {
        if (! Str::isUuid($productId)) {
            return null;
        }

        $row = $this->stockQuery($branchId)->where('p.product_id', $productId)->first();

        return $row === null ? null : $this->toStockRow($row);
    }

    public function summary(string $branchId): array
    {
        $status = $this->statusSql();

        $row = $this->stockQuery($branchId, select: false)
            ->selectRaw("count(*) as tracked_products,
                count(*) filter (where {$status} = 'in_stock') as in_stock,
                count(*) filter (where {$status} = 'low_stock') as low_stock,
                count(*) filter (where {$status} = 'out_of_stock') as out_of_stock,
                round(coalesce(sum(".self::QTY.' * p.cost_price), 0), 2) as stock_value')
            ->first();

        return [
            'tracked_products' => (int) $row->tracked_products,
            'in_stock' => (int) $row->in_stock,
            'low_stock' => (int) $row->low_stock,
            'out_of_stock' => (int) $row->out_of_stock,
            'stock_value' => (string) Money::of((string) $row->stock_value),
        ];
    }

    public function paginateMovements(string $branchId, PageRequest $request): PageResult
    {
        $from = $request->filter('from');
        $to = $request->filter('to');

        $paginator = $this->movementQuery()
            ->where('m.branch_id', $branchId)
            ->when($request->filter('product_id') !== null, fn (Builder $q) => $q->where('m.product_id', $request->filter('product_id')))
            ->when($request->filter('type') !== null, fn (Builder $q) => $q->where('m.type', $request->filter('type')))
            ->when($from !== null, fn (Builder $q) => $q->where('m.created_at', '>=', CarbonImmutable::parse((string) $from)->startOfDay()))
            ->when($to !== null, fn (Builder $q) => $q->where('m.created_at', '<', CarbonImmutable::parse((string) $to)->addDay()->startOfDay()))
            ->orderBy('m.created_at', $request->sortDescending || $request->sortField === null ? 'desc' : 'asc')
            ->orderBy('m.id', 'desc')
            ->paginate($request->perPage, ['*'], 'page', $request->page);

        return new PageResult($this->toMovementRows($paginator->items()), $paginator->total(), $paginator->currentPage(), $paginator->perPage());
    }

    public function findMovement(string $movementId): ?array
    {
        $row = $this->movementQuery()->where('m.id', $movementId)->first();

        return $row === null ? null : $this->toMovementRows([$row])[0];
    }

    private function stockQuery(string $branchId, bool $select = true): Builder
    {
        $query = DB::table('inventory_products as p')
            ->leftJoin('inventory_stocks as s', function ($join) use ($branchId): void {
                $join->on('s.product_id', '=', 'p.product_id')->where('s.branch_id', '=', $branchId);
            })
            ->where('p.is_active', true)
            ->where('p.track_stock', true);

        if ($select) {
            $query->select([
                'p.product_id', 'p.sku', 'p.name', 'p.barcode', 'p.unit_code', 'p.allows_decimal', 'p.cost_price',
                DB::raw(self::QTY.' as quantity'),
                DB::raw(self::REORDER.' as reorder_level'),
                DB::raw($this->statusSql().' as status'),
                's.last_movement_at',
            ]);
        }

        return $query;
    }

    private function statusSql(): string
    {
        return '(case when '.self::QTY." <= 0 then 'out_of_stock' when ".self::REORDER.' > 0 and '.self::QTY.' <= '.self::REORDER." then 'low_stock' else 'in_stock' end)";
    }

    private function movementQuery(): Builder
    {
        return DB::table('inventory_movements as m')
            ->leftJoin('inventory_products as p', 'p.product_id', '=', 'm.product_id')
            ->select(['m.*', 'p.sku', 'p.name as product_name']);
    }

    /**
     * @return array<string, mixed>
     */
    private function toStockRow(object $r): array
    {
        $quantity = Quantity::of((string) $r->quantity);

        return [
            'product_id' => (string) $r->product_id,
            'sku' => (string) $r->sku,
            'name' => (string) $r->name,
            'barcode' => $r->barcode,
            'unit' => ['code' => (string) $r->unit_code, 'allows_decimal' => (bool) $r->allows_decimal],
            'quantity' => (string) $quantity,
            'reorder_level' => (string) Quantity::of((string) $r->reorder_level),
            'status' => (string) $r->status,
            'stock_value' => (string) Money::of((string) $r->cost_price)->times($quantity),
            'last_movement_at' => $r->last_movement_at === null ? null : CarbonImmutable::parse($r->last_movement_at)->toIso8601String(),
        ];
    }

    /**
     * @param  array<int, object>  $rows
     * @return list<array<string, mixed>>
     */
    private function toMovementRows(array $rows): array
    {
        $names = $this->users->names(array_values(array_filter(array_map(static fn ($r) => $r->user_id, $rows))));

        return array_values(array_map(static fn (object $r) => [
            'id' => (string) $r->id,
            'product_id' => (string) $r->product_id,
            'sku' => $r->sku,
            'product_name' => $r->product_name,
            'type' => (string) $r->type,
            'reason' => $r->reason,
            'quantity' => (string) Quantity::of((string) $r->quantity),
            'balance_after' => (string) Quantity::of((string) $r->balance_after),
            'note' => $r->note,
            'user' => $r->user_id !== null && isset($names[$r->user_id]) ? ['id' => (string) $r->user_id, 'name' => $names[$r->user_id]] : null,
            'created_at' => CarbonImmutable::parse($r->created_at)->toIso8601String(),
        ], $rows));
    }
}
