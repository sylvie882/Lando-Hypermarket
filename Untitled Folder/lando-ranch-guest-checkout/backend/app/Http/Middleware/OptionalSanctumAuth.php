<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Lets a route accept BOTH a logged-in user (via Sanctum bearer token)
 * and a guest (no token, identified instead by an X-Guest-Id header).
 *
 * Unlike `auth:sanctum`, this never aborts the request when no token
 * is present — it just leaves the request unauthenticated so the
 * controller can fall back to guest logic.
 */
class OptionalSanctumAuth
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->bearerToken() && ! $request->user()) {
            if ($user = auth('sanctum')->user()) {
                auth()->setUser($user);
                $request->setUserResolver(fn () => $user);
            }
        }

        return $next($request);
    }
}
