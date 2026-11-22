<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Middleware;

use App\Modules\Identity\Domain\UserErrors;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Shared\Presentation\Http\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

/**
 * Rejects requests from accounts deactivated after they signed in.
 */
final class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user instanceof User && ! $user->is_active) {
            $token = $user->currentAccessToken();

            if ($token instanceof PersonalAccessToken) {
                $token->delete();
            } elseif ($request->hasSession()) {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
            }

            return ApiResponse::error(UserErrors::inactive());
        }

        return $next($request);
    }
}
