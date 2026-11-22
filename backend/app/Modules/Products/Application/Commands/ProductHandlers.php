<?php

declare(strict_types=1);

namespace App\Modules\Products\Application\Commands;

use App\Modules\Products\Application\DTOs\ProductData;
use App\Modules\Products\Domain\CatalogErrors;
use App\Modules\Products\Domain\CategoryRepository;
use App\Modules\Products\Domain\Product;
use App\Modules\Products\Domain\ProductDetails;
use App\Modules\Products\Domain\ProductRepository;
use App\Modules\Products\Domain\Sku;
use App\Modules\Products\Domain\Unit;
use App\Modules\Products\Domain\UnitRepository;
use App\Shared\Application\Contracts\EventDispatcher;
use App\Shared\Application\Contracts\TransactionManager;
use App\Shared\Domain\Result\Result;
use App\Shared\Domain\ValueObjects\Money;
use App\Shared\Domain\ValueObjects\Percentage;

final readonly class ProductHandlers
{
    public function __construct(
        private ProductRepository $products,
        private CategoryRepository $categories,
        private UnitRepository $units,
        private TransactionManager $transactions,
        private EventDispatcher $events,
    ) {}

    /**
     * @return Result<string> new product id
     */
    public function create(ProductData $data): Result
    {
        return $this->transactions->run(function () use ($data): Result {
            $checked = $this->validate($data, null, null);
            if ($checked->isFailure()) {
                return $checked;
            }
            [$details, $unit] = $checked->value();

            $product = Product::create($this->products->nextId(), $details, $this->unitFacts($unit));
            $this->products->save($product);
            $this->events->dispatch($product->releaseEvents());

            return Result::success($product->id);
        });
    }

    /**
     * @return Result<string>
     */
    public function update(string $id, ProductData $data): Result
    {
        return $this->transactions->run(function () use ($id, $data): Result {
            $product = $this->products->find($id);
            if ($product === null) {
                return Result::failure(CatalogErrors::productNotFound());
            }

            $checked = $this->validate($data, $id, $product->details()->categoryId);
            if ($checked->isFailure()) {
                return $checked;
            }
            [$details, $unit] = $checked->value();

            $product->update($details, $this->unitFacts($unit));
            $this->products->save($product);
            $this->events->dispatch($product->releaseEvents());

            return Result::success($product->id);
        });
    }

    /**
     * @return Result<array{0: ProductDetails, 1: Unit}>
     */
    private function validate(ProductData $data, ?string $productId, ?string $currentCategoryId): Result
    {
        $sku = new Sku($data->sku);

        if ($this->products->skuExists($sku, $productId)) {
            return Result::failure(CatalogErrors::skuTaken($sku->value));
        }

        if ($data->barcode !== null && $this->products->barcodeExists($data->barcode, $productId)) {
            return Result::failure(CatalogErrors::barcodeTaken());
        }

        if ($data->categoryId !== null) {
            $category = $this->categories->find($data->categoryId);
            // An inactive category may be kept, but not newly assigned.
            if ($category === null || (! $category->isActive() && $data->categoryId !== $currentCategoryId)) {
                return Result::failure(CatalogErrors::invalidCategory());
            }
        }

        $unit = $this->units->find($data->unitId);
        if ($unit === null) {
            return Result::failure(CatalogErrors::invalidUnit());
        }

        return Result::success([
            new ProductDetails(
                $sku,
                $data->barcode,
                $data->name,
                $data->description,
                $data->categoryId,
                $unit->id,
                Money::of($data->costPrice),
                Money::of($data->sellingPrice),
                Percentage::of($data->taxRate),
                $data->trackStock,
                $data->isActive,
            ),
            $unit,
        ]);
    }

    /**
     * @return array{unit_code: string, allows_decimal: bool}
     */
    private function unitFacts(Unit $unit): array
    {
        return ['unit_code' => $unit->code(), 'allows_decimal' => $unit->allowsDecimal()];
    }
}
