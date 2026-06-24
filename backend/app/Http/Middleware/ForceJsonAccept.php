<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Treat every API request as wanting JSON, so framework defaults (e.g. the
 * unauthenticated handler) never try to redirect to a non-existent `login`
 * route. Keeps all /api/* responses in our { error: {...} } shape.
 */
class ForceJsonAccept
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        return $next($request);
    }
}
