<?php

declare(strict_types=1);

namespace App\Modules\Products\Application\Commands;

use App\Modules\Products\Domain\CatalogErrors;
use App\Modules\Products\Domain\Unit;
use App\Modules\Products\Domain\UnitRepository;
use App\Shared\Application\Contracts\EventDispatcher;
use App\Shared\Application\Contracts\TransactionManager;
use App\Shared\Domain\Result\Result;

final readonly class UnitHandlers
{
    public function __construct(
        private UnitRepository $units,
        private TransactionManager $transactions,
        private EventDispatcher $events,
    ) {}

    /**
     * @return Result<string>
     */
    public function create(string $code, string $name, bool $allowsDecimal): Result
    {
        return $this->transactions->run(function () use ($code, $name, $allowsDecimal): Result {
            if ($this->units->codeExists($code)) {
                return Result::failure(CatalogErrors::unitCodeTaken());
            }

            $unit = Unit::define($this->units->nextId(), $code, $name, $allowsDecimal);
            $this->units->save($unit);
            $this->events->dispatch($unit->releaseEvents());

            return Result::success($unit->id);
        });
    }

    /**
     * @return Result<string>
     */
    public function update(string $id, string $code, string $name, bool $allowsDecimal): Result
    {
        return $this->transactions->run(function () use ($id, $code, $name, $allowsDecimal): Result {
            $unit = $this->units->find($id);
            if ($unit === null) {
                return Result::failure(CatalogErrors::unitNotFound());
            }

            if ($this->units->codeExists($code, $id)) {
                return Result::failure(CatalogErrors::unitCodeTaken());
            }

            $unit->change($code, $name, $allowsDecimal);
            $this->units->save($unit);
            $this->events->dispatch($unit->releaseEvents());

            return Result::success($id);
        });
    }

    /**
     * @return Result<null>
     */
    public function delete(string $id): Result
    {
        return $this->transactions->run(function () use ($id): Result {
            if ($this->units->find($id) === null) {
                return Result::failure(CatalogErrors::unitNotFound());
            }

            if ($this->units->isInUse($id)) {
                return Result::failure(CatalogErrors::unitInUse());
            }

            $this->units->delete($id);

            return Result::success();
        });
    }
}
