<?php

declare(strict_types=1);

namespace App\Modules\Products\Application\Commands;

use App\Modules\Products\Domain\CatalogErrors;
use App\Modules\Products\Domain\Category;
use App\Modules\Products\Domain\CategoryRepository;
use App\Shared\Application\Contracts\TransactionManager;
use App\Shared\Domain\Result\Result;

final readonly class CategoryHandlers
{
    public function __construct(
        private CategoryRepository $categories,
        private TransactionManager $transactions,
    ) {}

    /**
     * @return Result<string>
     */
    public function create(string $name, ?string $description, bool $isActive): Result
    {
        return $this->transactions->run(function () use ($name, $description, $isActive): Result {
            if ($this->categories->nameExists($name)) {
                return Result::failure(CatalogErrors::categoryNameTaken());
            }

            $category = Category::create($this->categories->nextId(), $name, $description, $isActive);
            $this->categories->save($category);

            return Result::success($category->id);
        });
    }

    /**
     * @return Result<string>
     */
    public function update(string $id, string $name, ?string $description, bool $isActive): Result
    {
        return $this->transactions->run(function () use ($id, $name, $description, $isActive): Result {
            $category = $this->categories->find($id);
            if ($category === null) {
                return Result::failure(CatalogErrors::categoryNotFound());
            }

            if ($this->categories->nameExists($name, $id)) {
                return Result::failure(CatalogErrors::categoryNameTaken());
            }

            $category->change($name, $description, $isActive);
            $this->categories->save($category);

            return Result::success($id);
        });
    }

    /**
     * @return Result<null>
     */
    public function delete(string $id): Result
    {
        return $this->transactions->run(function () use ($id): Result {
            if ($this->categories->find($id) === null) {
                return Result::failure(CatalogErrors::categoryNotFound());
            }

            if ($this->categories->isInUse($id)) {
                return Result::failure(CatalogErrors::categoryInUse());
            }

            $this->categories->delete($id);

            return Result::success();
        });
    }
}
