<?php

declare(strict_types=1);

namespace App\Modules\Organization\Domain;

use App\Shared\Domain\Result\Error;

final class BranchErrors
{
    public static function notFound(): Error
    {
        return Error::notFound('BRANCH_NOT_FOUND', 'Branch not found.');
    }

    public static function codeTaken(string $code): Error
    {
        return Error::conflict('BRANCH_CODE_TAKEN', "Branch code [{$code}] is already in use.", [
            'code' => ["Branch code [{$code}] is already in use."],
        ]);
    }
}
