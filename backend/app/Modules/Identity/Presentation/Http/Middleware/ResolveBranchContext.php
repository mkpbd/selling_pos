<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Middleware;

use App\Modules\Identity\Domain\UserErrors;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Identity\Presentation\Http\BranchContextBootstrapper;
use App\Shared\Presentation\Http\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves the active branch from `X-Branch-Id` (or the user's default) and
 * scopes all permission checks of the request to it. Must run after
 * authentication and before any `can:` authorization middleware.
 */
final readonly class ResolveBranchContext
{
    public const string HEADER = 'X-Branch-Id';

    public function __construct(private BranchContextBootstrapper $bootstrapper) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return $next($request);
        }

        $requested = trim((string) $request->headers->get(self::HEADER, ''));
        if ($requested !== '' && ! Str::isUuid($requested)) {
            return ApiResponse::error(UserErrors::branchAccessDenied());
        }

        $result = $this->bootstrapper->boot($user, $requested === '' ? null : strtolower($requested));

        return $result->isFailure() ? ApiResponse::error($result->error()) : $next($request);
    }
}
