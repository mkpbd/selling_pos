<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Contracts;

/**
 * Terminates a user's authenticated sessions and API tokens.
 */
interface UserSessions
{
    /** Revoke every API token and browser session of the user. */
    public function revokeAll(string $userId): void;

    /** Revoke API tokens, optionally keeping the one in use. */
    public function revokeTokens(string $userId, ?string $keepTokenId = null): void;
}
