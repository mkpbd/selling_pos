<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Contracts;

use App\Shared\Domain\Result\Result;

interface PasswordResetService
{
    /** Sends a reset link when the email belongs to an active user. Never reveals existence. */
    public function sendResetLink(string $email): void;

    /**
     * @return Result<null>
     */
    public function reset(string $email, string $token, string $newPassword): Result;
}
