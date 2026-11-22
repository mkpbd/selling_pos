<?php

declare(strict_types=1);

namespace App\Shared\Presentation\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Correlates logs, errors and responses with a request id. Accepts a sane
 * client-supplied X-Request-Id, otherwise generates one.
 */
final class AssignRequestId
{
    public const string HEADER = 'X-Request-Id';

    public function handle(Request $request, Closure $next): Response
    {
        $incoming = (string) $request->headers->get(self::HEADER, '');
        $requestId = preg_match('/^[A-Za-z0-9\-_.]{8,64}$/', $incoming) === 1
            ? $incoming
            : (string) Str::uuid7();

        Context::add('request_id', $requestId);

        $response = $next($request);
        $response->headers->set(self::HEADER, $requestId);

        return $response;
    }
}
