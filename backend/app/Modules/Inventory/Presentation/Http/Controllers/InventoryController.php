<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Presentation\Http\Controllers;

use App\Modules\Inventory\Application\Commands\AdjustStock;
use App\Modules\Inventory\Application\Commands\StockHandlers;
use App\Modules\Inventory\Application\Queries\StockQueryService;
use App\Modules\Inventory\Domain\AdjustmentReason;
use App\Modules\Inventory\Domain\AdjustmentType;
use App\Modules\Inventory\Domain\InventoryErrors;
use App\Modules\Inventory\Presentation\Http\Requests\AdjustStockRequest;
use App\Modules\Inventory\Presentation\Http\Requests\ListMovementsRequest;
use App\Modules\Inventory\Presentation\Http\Requests\ListStockRequest;
use App\Modules\Inventory\Presentation\Http\Requests\ReorderLevelRequest;
use App\Shared\Application\Context\BranchContext;
use App\Shared\Domain\Result\Error;
use App\Shared\Presentation\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * All endpoints operate on the active branch (`X-Branch-Id`).
 *
 * @tags Inventory
 */
final readonly class InventoryController
{
    public function __construct(
        private StockQueryService $queries,
        private StockHandlers $handlers,
        private BranchContext $context,
    ) {}

    /**
     * List stock levels
     *
     * Requires `inventory.view`. Active, stock-tracked products with on-hand quantity in the active branch.
     *
     * @response array{success: true, data: list<array{product_id: string, sku: string, name: string, barcode: string|null, unit: array{code: string, allows_decimal: bool}, quantity: string, reorder_level: string, status: 'in_stock'|'low_stock'|'out_of_stock', stock_value: string, last_movement_at: string|null}>, meta: array{request_id: string, pagination: array{page: int, per_page: int, total: int, last_page: int}}}
     */
    public function stock(ListStockRequest $request): JsonResponse
    {
        return $this->withBranch(fn (string $branchId) => ApiResponse::paginated(
            $this->queries->paginateStock($branchId, $request->toPageRequest()),
            static fn (array $items) => $items,
        ));
    }

    /**
     * Show stock of a product
     *
     * Requires `inventory.view`.
     */
    public function showStock(string $product): JsonResponse
    {
        return $this->withBranch(function (string $branchId) use ($product) {
            $row = $this->queries->findStock($branchId, $product);

            return $row === null ? ApiResponse::error(InventoryErrors::productNotFound()) : ApiResponse::success($row);
        });
    }

    /**
     * Stock summary
     *
     * Requires `inventory.view`. KPIs for the active branch.
     *
     * @response array{success: true, data: array{tracked_products: int, in_stock: int, low_stock: int, out_of_stock: int, stock_value: string}, meta: array{request_id: string}}
     */
    public function summary(): JsonResponse
    {
        return $this->withBranch(fn (string $branchId) => ApiResponse::success($this->queries->summary($branchId)));
    }

    /**
     * Adjust stock
     *
     * Requires `inventory.adjust`. Send an `Idempotency-Key` header to make retries safe.
     * 422 `INSUFFICIENT_STOCK` (details.available), `NO_STOCK_CHANGE`, `PRODUCT_NOT_STOCKABLE`.
     *
     * @status 201
     */
    public function adjust(AdjustStockRequest $request): JsonResponse
    {
        return $this->withBranch(function (string $branchId) use ($request) {
            $result = $this->handlers->adjust(new AdjustStock(
                $branchId,
                $request->validated('product_id'),
                AdjustmentType::from($request->validated('type')),
                (string) $request->validated('quantity'),
                AdjustmentReason::from($request->validated('reason')),
                $request->validated('note'),
                $request->user()?->getAuthIdentifier(),
            ));

            if ($result->isFailure()) {
                return ApiResponse::error($result->error());
            }

            $movement = $result->value();

            return ApiResponse::created([
                'movement' => $this->queries->findMovement($movement->id),
                'stock' => $this->queries->findStock($branchId, $movement->productId),
            ], 'Stock adjusted.');
        });
    }

    /**
     * Set reorder level
     *
     * Requires `inventory.adjust`. Low-stock threshold for the product in the active branch.
     */
    public function reorderLevel(ReorderLevelRequest $request, string $product): JsonResponse
    {
        return $this->withBranch(function (string $branchId) use ($request, $product) {
            $result = $this->handlers->setReorderLevel($branchId, $product, (string) $request->validated('reorder_level'));

            return $result->isFailure()
                ? ApiResponse::error($result->error())
                : ApiResponse::success($this->queries->findStock($branchId, $product), 'Reorder level updated.');
        });
    }

    /**
     * List stock movements
     *
     * Requires `inventory.view`. Append-only ledger of the active branch, newest first.
     */
    public function movements(ListMovementsRequest $request): JsonResponse
    {
        return $this->withBranch(fn (string $branchId) => ApiResponse::paginated(
            $this->queries->paginateMovements($branchId, $request->toPageRequest()),
            static fn (array $items) => $items,
        ));
    }

    /**
     * @param  callable(string): JsonResponse  $action
     */
    private function withBranch(callable $action): JsonResponse
    {
        $branchId = $this->context->currentBranchId();

        return $branchId === null
            ? ApiResponse::error(Error::forbidden('BRANCH_REQUIRED', 'Select an active branch first.'))
            : $action($branchId);
    }
}
