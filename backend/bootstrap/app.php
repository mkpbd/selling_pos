<?php

use App\Modules\Identity\Presentation\Http\Middleware\EnsureUserIsActive;
use App\Modules\Identity\Presentation\Http\Middleware\ResolveBranchContext;
use App\Shared\Presentation\Exceptions\ApiExceptionRenderer;
use App\Shared\Presentation\Http\Middleware\AssignRequestId;
use App\Shared\Presentation\Http\Middleware\SecurityHeaders;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Request correlation id on every request (API + web).
        $middleware->prepend(AssignRequestId::class);

        // Sanctum: cookie sessions for the first-party SPA, bearer tokens otherwise.
        $middleware->statefulApi();
        $middleware->throttleApi();
        $middleware->appendToGroup('api', SecurityHeaders::class);

        // Authenticated API stack: identity -> account status -> branch scope.
        $middleware->group('authenticated', [
            'auth:sanctum',
            EnsureUserIsActive::class,
            ResolveBranchContext::class,
        ]);

        // Branch scope must be set before `can:` permission checks run.
        $middleware->prependToPriorityList(Authorize::class, EnsureUserIsActive::class);
        $middleware->prependToPriorityList(Authorize::class, ResolveBranchContext::class);

        // Pure API: never redirect unauthenticated requests to a login page.
        $middleware->redirectGuestsTo(fn (Request $request) => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => ApiExceptionRenderer::shouldRender($request),
        );
        $exceptions->render(
            fn (Throwable $e, Request $request) => ApiExceptionRenderer::render($e, $request),
        );
        $exceptions->dontFlash(['current_password', 'password', 'password_confirmation', 'token']);
    })->create();
