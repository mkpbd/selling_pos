<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Controllers;

use App\Modules\Identity\Application\Commands\AuthenticateHandler;
use App\Modules\Identity\Application\Commands\ChangePasswordHandler;
use App\Modules\Identity\Application\Contracts\PasswordResetService;
use App\Modules\Identity\Application\Queries\GetCurrentUser;
use App\Modules\Identity\Domain\UserErrors;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Identity\Presentation\Http\BranchContextBootstrapper;
use App\Modules\Identity\Presentation\Http\Requests\ChangePasswordRequest;
use App\Modules\Identity\Presentation\Http\Requests\ForgotPasswordRequest;
use App\Modules\Identity\Presentation\Http\Requests\IssueTokenRequest;
use App\Modules\Identity\Presentation\Http\Requests\LoginRequest;
use App\Modules\Identity\Presentation\Http\Requests\ResetPasswordRequest;
use App\Modules\Identity\Presentation\Http\Resources\MeResource;
use App\Shared\Presentation\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * @tags Authentication
 */
final readonly class AuthController
{
    public function __construct(
        private AuthenticateHandler $authenticate,
        private GetCurrentUser $currentUser,
        private BranchContextBootstrapper $branchContext,
    ) {}

    /**
     * SPA login (cookie session)
     *
     * For the first-party browser SPA. Call `GET /sanctum/csrf-cookie` first and send the
     * `X-XSRF-TOKEN` header. Non-browser clients must use `POST /auth/tokens`.
     *
     * @unauthenticated
     *
     * @response array{success: true, data: MeResource, message: string, meta: array{request_id: string}}
     */
    public function login(LoginRequest $request): JsonResponse
    {
        if (! $request->hasSession()) {
            return ApiResponse::failure('BAD_REQUEST', 'Session login is only available to the first-party SPA. Use POST /auth/tokens.', 400);
        }

        $result = $this->authenticate->handle($request->validated('email'), $request->validated('password'));
        if ($result->isFailure()) {
            return ApiResponse::error($result->error());
        }

        /** @var User $user */
        $user = Auth::guard('web')->loginUsingId($result->value(), (bool) $request->validated('remember', false));
        $request->session()->regenerate();

        // Login runs without the branch middleware: honour a valid X-Branch-Id, else the default branch.
        $requested = $request->headers->get('X-Branch-Id');
        if (! is_string($requested) || ! Str::isUuid($requested) || $this->branchContext->boot($user, strtolower($requested))->isFailure()) {
            $this->branchContext->boot($user);
        }

        return $this->me($user->id, 'Signed in.');
    }

    /**
     * Issue an API token
     *
     * For devices, integrations and API tools. Send the token as `Authorization: Bearer <token>`.
     *
     * @unauthenticated
     *
     * @status 201
     *
     * @response array{success: true, data: array{token: string, token_type: 'Bearer', expires_at: string|null, user: MeResource}, message: string, meta: array{request_id: string}}
     */
    public function issueToken(IssueTokenRequest $request): JsonResponse
    {
        $result = $this->authenticate->handle($request->validated('email'), $request->validated('password'));
        if ($result->isFailure()) {
            return ApiResponse::error($result->error());
        }

        $user = User::query()->findOrFail($result->value());
        $minutes = config('sanctum.expiration');
        $expiresAt = $minutes === null ? null : now()->addMinutes((int) $minutes);
        $token = $user->createToken($request->validated('device_name'), ['*'], $expiresAt);

        $this->branchContext->boot($user);
        $me = $this->currentUser->handle($user->id);

        return ApiResponse::created([
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'expires_at' => $expiresAt?->toIso8601String(),
            'user' => (new MeResource($me))->resolve($request),
        ], 'Token issued.');
    }

    /**
     * Log out
     *
     * Revokes the current API token, or ends the browser session.
     *
     * @response array{success: true, data: null, message: string, meta: array{request_id: string}}
     */
    public function logout(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $token = $user->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        } else {
            Auth::guard('web')->logout();

            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }
        }

        return ApiResponse::success(null, 'Signed out.');
    }

    /**
     * Current user
     *
     * The authenticated user, accessible branches, and roles/permissions in the active branch.
     *
     * @response array{success: true, data: MeResource, meta: array{request_id: string}}
     */
    public function show(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return $this->me($user->id);
    }

    /**
     * Request a password reset link
     *
     * Always succeeds with the same message to avoid account enumeration.
     *
     * @unauthenticated
     *
     * @response array{success: true, data: null, message: string, meta: array{request_id: string}}
     */
    public function forgotPassword(ForgotPasswordRequest $request, PasswordResetService $resets): JsonResponse
    {
        $resets->sendResetLink($request->validated('email'));

        return ApiResponse::success(null, 'If an account exists for that email, a password reset link has been sent.');
    }

    /**
     * Reset password
     *
     * Completes a reset with the emailed token. All sessions and tokens of the user are revoked.
     *
     * @unauthenticated
     *
     * @response array{success: true, data: null, message: string, meta: array{request_id: string}}
     */
    public function resetPassword(ResetPasswordRequest $request, PasswordResetService $resets): JsonResponse
    {
        $result = $resets->reset(
            $request->validated('email'),
            $request->validated('token'),
            $request->validated('password'),
        );

        return $result->isFailure()
            ? ApiResponse::error($result->error())
            : ApiResponse::success(null, 'Your password has been reset. You can sign in now.');
    }

    /**
     * Change password
     *
     * Requires the current password. Other API tokens are revoked.
     *
     * @response array{success: true, data: null, message: string, meta: array{request_id: string}}
     */
    public function changePassword(ChangePasswordRequest $request, ChangePasswordHandler $handler): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $token = $user->currentAccessToken();

        $result = $handler->handle(
            $user->id,
            $request->validated('current_password'),
            $request->validated('password'),
            $token instanceof PersonalAccessToken && is_numeric($token->getKey()) ? (string) $token->getKey() : null,
        );

        return $result->isFailure()
            ? ApiResponse::error($result->error())
            : ApiResponse::success(null, 'Password changed.');
    }

    private function me(string $userId, ?string $message = null): JsonResponse
    {
        $me = $this->currentUser->handle($userId);

        return $me === null
            ? ApiResponse::error(UserErrors::notFound())
            : ApiResponse::success(new MeResource($me), $message);
    }
}
