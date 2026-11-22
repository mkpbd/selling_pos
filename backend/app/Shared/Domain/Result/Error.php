<?php

declare(strict_types=1);

namespace App\Shared\Domain\Result;

/**
 * Immutable description of an expected failure.
 *
 * `details` carries structured context; for validation errors it is a
 * map of field => list of messages.
 */
final readonly class Error
{
    /**
     * @param  array<string, mixed>  $details
     */
    public function __construct(
        public string $code,
        public string $message,
        public ErrorType $type,
        public array $details = [],
    ) {}

    /**
     * @param  array<string, list<string>>  $fieldErrors
     */
    public static function validation(string $code, string $message, array $fieldErrors = []): self
    {
        return new self($code, $message, ErrorType::Validation, $fieldErrors);
    }

    public static function notFound(string $code, string $message): self
    {
        return new self($code, $message, ErrorType::NotFound);
    }

    /**
     * @param  array<string, mixed>  $details
     */
    public static function conflict(string $code, string $message, array $details = []): self
    {
        return new self($code, $message, ErrorType::Conflict, $details);
    }

    public static function forbidden(string $code, string $message): self
    {
        return new self($code, $message, ErrorType::Forbidden);
    }

    public static function unauthorized(string $code, string $message): self
    {
        return new self($code, $message, ErrorType::Unauthorized);
    }

    /**
     * @param  array<string, mixed>  $details
     */
    public static function businessRule(string $code, string $message, array $details = []): self
    {
        return new self($code, $message, ErrorType::BusinessRule, $details);
    }
}
