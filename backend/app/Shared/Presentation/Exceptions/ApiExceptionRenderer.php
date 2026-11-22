<?php

declare(strict_types=1);

namespace App\Shared\Presentation\Exceptions;

use App\Shared\Presentation\Http\ApiResponse;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

/**
 * Converts any exception raised during an API request into the standard
 * error envelope. Laravel has already mapped ModelNotFound -> 404,
 * AuthorizationException -> 403 and TokenMismatch -> 419 before this runs.
 */
final class ApiExceptionRenderer
{
    private const array CODES = [
        400 => 'BAD_REQUEST',
        401 => 'UNAUTHENTICATED',
        403 => 'FORBIDDEN',
        404 => 'NOT_FOUND',
        405 => 'METHOD_NOT_ALLOWED',
        409 => 'CONFLICT',
        413 => 'PAYLOAD_TOO_LARGE',
        415 => 'UNSUPPORTED_MEDIA_TYPE',
        419 => 'CSRF_TOKEN_MISMATCH',
        429 => 'TOO_MANY_REQUESTS',
        503 => 'SERVICE_UNAVAILABLE',
    ];

    public static function shouldRender(Request $request): bool
    {
        return $request->is('api/*') || $request->expectsJson();
    }

    public static function render(Throwable $e, Request $request): ?JsonResponse
    {
        if (! self::shouldRender($request)) {
            return null;
        }

        return match (true) {
            $e instanceof ValidationException => ApiResponse::failure(
                'VALIDATION_FAILED',
                'The given data was invalid.',
                422,
                $e->errors(),
            ),
            $e instanceof AuthenticationException => ApiResponse::failure(
                'UNAUTHENTICATED',
                'Authentication is required.',
                401,
            ),
            $e instanceof HttpExceptionInterface => self::http($e),
            default => self::internal($e),
        };
    }

    private static function http(HttpExceptionInterface $e): JsonResponse
    {
        $status = $e->getStatusCode();

        $message = match ($status) {
            404 => 'The requested resource was not found.',
            419 => 'CSRF token mismatch. Refresh the CSRF cookie and retry.',
            429 => 'Too many requests. Please slow down.',
            default => $e instanceof Throwable && $e->getMessage() !== '' && $status < 500
                ? $e->getMessage()
                : 'The request could not be completed.',
        };

        return ApiResponse::failure(
            self::CODES[$status] ?? 'HTTP_ERROR',
            $message,
            $status,
            headers: $e->getHeaders(),
        );
    }

    private static function internal(Throwable $e): JsonResponse
    {
        $details = config('app.debug')
            ? ['exception' => $e::class, 'message' => $e->getMessage()]
            : [];

        return ApiResponse::failure('INTERNAL_ERROR', 'An unexpected error occurred.', 500, $details);
    }
}
