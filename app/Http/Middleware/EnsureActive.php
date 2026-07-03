<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// Blocks suspended accounts mid-session/token, not just at login.
class EnsureActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('sanctum');

        abort_if($user && $user->status === 'suspended', 403, 'Account suspended.');

        return $next($request);
    }
}
