<?php

declare(strict_types=1);

namespace App\Shared\Domain\Result;

/**
 * Category of an expected (business) failure. The presentation layer maps
 * each category to a transport-level status (e.g. HTTP).
 */
enum ErrorType: string
{
    case Validation = 'validation';
    case NotFound = 'not_found';
    case Conflict = 'conflict';
    case Forbidden = 'forbidden';
    case Unauthorized = 'unauthorized';
    case BusinessRule = 'business_rule';
}
