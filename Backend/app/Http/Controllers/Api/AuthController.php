<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AuthRequest;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    /**
     * Enregistrement d'un nouvel utilisateur (utilisé par le seeder ou l'admin).
     */
    public function register(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'email', 'max:255', 'unique:utilisateurs'],
                'password' => ['required', 'string', 'min:6'],
                'role' => ['sometimes', 'string'],
            ]);

            $user = Utilisateur::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'] ?? 'admin',
            ]);

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Utilisateur créé avec succès',
                'user' => $user,
                'access_token' => $token,
                'token_type' => 'Bearer',
            ], 201);

        } catch (\Throwable $th) {
            Log::error('REGISTER ERREUR', ['msg' => $th->getMessage()]);

            return response()->json(['message' => 'Erreur lors de l\'enregistrement', 'error' => $th->getMessage()], 500);
        }
    }

    /**
     * Connexion de l'utilisateur.
     */
    public function login(AuthRequest $request)
    {
        Log::info('>>> LOGIN DÉMARRÉ', ['email' => $request->email]);
        try {
            $credentials = $request->validated();

            $user = Utilisateur::where('email', $credentials['email'])->first();

            if (! $user || ! Hash::check($credentials['password'], $user->password)) {
                return response()->json(['message' => 'Identifiants incorrects'], 401);
            }

            // Suppression des anciens tokens pour n'avoir qu'une session active si besoin
            $user->tokens()->delete();

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Connexion réussie',
                'user' => $user,
                'access_token' => $token,
                'token_type' => 'Bearer',
            ], 200);

        } catch (\Throwable $th) {
            Log::error('LOGIN ERREUR', ['msg' => $th->getMessage()]);

            return response()->json(['message' => 'Erreur connexion'], 500);
        }
    }

    /**
     * Déconnexion de l'utilisateur (suppression du token actif).
     */
    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'message' => 'Déconnexion réussie',
            ], 200);

        } catch (\Throwable $th) {
            Log::error('LOGOUT ERREUR', ['msg' => $th->getMessage()]);

            return response()->json(['message' => 'Erreur lors de la déconnexion'], 500);
        }
    }
}
