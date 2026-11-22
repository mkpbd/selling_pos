<?php

declare(strict_types=1);

namespace App\Shared\Infrastructure\Persistence;

final class Search
{
    /** Build a safe ILIKE "contains" pattern (escapes %, _ and \). */
    public static function contains(string $term): string
    {
        return '%'.addcslashes($term, '%_\\').'%';
    }
}
