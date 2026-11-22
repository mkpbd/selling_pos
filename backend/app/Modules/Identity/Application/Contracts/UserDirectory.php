<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Contracts;

/**
 * Published contract of the Identity context for displaying user names.
 */
interface UserDirectory
{
    /**
     * @param  list<string>  $ids
     * @return array<string, string> user id => display name
     */
    public function names(array $ids): array;
}
