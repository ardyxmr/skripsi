<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Route-level RBAC gate. Usage: ->middleware('role:Administrator')
 * or ->middleware('role:Manager,Administrator'). Compares against the
 * authenticated user's role name (06-database-schema.md §1).
 */
class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        abort_unless($user !== null, 401, 'Unauthenticated.');

        $roleName = $user->role?->role_name;
        abort_unless(in_array($roleName, $roles, true), 403, 'You do not have access to this resource.');

        return $next($request);
    }
}
