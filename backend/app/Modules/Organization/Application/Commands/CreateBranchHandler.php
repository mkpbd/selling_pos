<?php

declare(strict_types=1);

namespace App\Modules\Organization\Application\Commands;

use App\Modules\Organization\Application\DTOs\BranchData;
use App\Modules\Organization\Domain\Branch;
use App\Modules\Organization\Domain\BranchCode;
use App\Modules\Organization\Domain\BranchErrors;
use App\Modules\Organization\Domain\BranchRepository;
use App\Shared\Application\Contracts\EventDispatcher;
use App\Shared\Application\Contracts\TransactionManager;
use App\Shared\Domain\Result\Result;

final readonly class CreateBranchHandler
{
    public function __construct(
        private BranchRepository $branches,
        private TransactionManager $transactions,
        private EventDispatcher $events,
    ) {}

    /**
     * @return Result<string> id of the new branch
     */
    public function handle(BranchData $data): Result
    {
        $code = new BranchCode($data->code);

        return $this->transactions->run(function () use ($data, $code): Result {
            if ($this->branches->codeExists($code)) {
                return Result::failure(BranchErrors::codeTaken($code->value));
            }

            $branch = Branch::open(
                $this->branches->nextId(),
                $code,
                $data->name,
                $data->phone,
                $data->email,
                $data->address,
                $data->isActive,
            );

            $this->branches->save($branch);
            $this->events->dispatch($branch->releaseEvents());

            return Result::success($branch->id);
        });
    }
}
