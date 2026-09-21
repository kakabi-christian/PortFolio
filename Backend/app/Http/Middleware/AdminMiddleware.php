<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Vérifier que l'utilisateur connecté est administrateur
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'Accès interdit. Vous devez être administrateur.',
            ], 403);
        }

        return $next($request);
    }
}
