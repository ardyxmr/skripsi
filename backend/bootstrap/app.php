<?php

use App\Http\Middleware\ForceJsonAccept;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Every /api/* request is treated as JSON.
        $middleware->api(prepend: [ForceJsonAccept::class]);

        // Route-level RBAC gate: ->middleware('role:Administrator')
        $middleware->alias([
            'role' => RoleMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        // Normalize every API error to { error: { code, message, details } }
        // — the exact shape the frontend client (src/lib/api.js) reads.
        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            [$status, $code, $message, $details] = match (true) {
                $e instanceof ValidationException => [422, 'VALIDATION', 'The given data was invalid.', $e->errors()],
                $e instanceof AuthenticationException => [401, 'UNAUTHENTICATED', 'Unauthenticated.', null],
                $e instanceof AuthorizationException => [403, 'FORBIDDEN', $e->getMessage() ?: 'This action is unauthorized.', null],
                $e instanceof ModelNotFoundException => [404, 'NOT_FOUND', 'Resource not found.', null],
                $e instanceof HttpExceptionInterface => [
                    $e->getStatusCode(),
                    match ($e->getStatusCode()) { 401 => 'UNAUTHENTICATED', 403 => 'FORBIDDEN', 404 => 'NOT_FOUND', 409 => 'CONFLICT', 422 => 'UNPROCESSABLE', default => 'HTTP_ERROR' },
                    $e->getMessage() ?: 'Request failed.',
                    null,
                ],
                default => [500, 'SERVER_ERROR', config('app.debug') ? $e->getMessage() : 'Server error.', null],
            };

            return response()->json([
                'error' => array_filter([
                    'code' => $code,
                    'message' => $message,
                    'details' => $details,
                ], fn ($v) => $v !== null),
            ], $status);
        });
    })->create();
