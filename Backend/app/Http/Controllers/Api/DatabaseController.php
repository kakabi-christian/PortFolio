<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DatabaseRequest;
use App\Models\Database;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DatabaseController extends Controller
{
    /**
     * Afficher la liste paginée des bases de données.
     */
    public function index(Request $request): JsonResponse
    {
        // Récupération du nombre d'éléments par page (par défaut 10)
        $perPage = $request->query('per_page', 10);

        // Récupération des données paginées
        $databases = Database::latest()->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $databases,
        ], 200);
    }

    /**
     * Enregistrer une nouvelle base de données.
     */
    public function store(DatabaseRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Gestion de l'upload de l'icône / image
        if ($request->hasFile('icon')) {
            $path = $request->file('icon')->store('databases', 'public');
            $validated['icon'] = $path;
        }

        $database = Database::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Base de données créée avec succès.',
            'data' => $database,
        ], 201);
    }

    /**
     * Afficher une base de données spécifique.
     */
    public function show(Database $database): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $database,
        ], 200);
    }

    /**
     * Mettre à jour une base de données existante.
     */
    public function update(DatabaseRequest $request, Database $database): JsonResponse
    {
        $validated = $request->validated();

        // Gestion du remplacement de l'icône / image
        if ($request->hasFile('icon')) {
            // Supprimer l'ancienne image si elle existe
            if ($database->icon && Storage::disk('public')->exists($database->icon)) {
                Storage::disk('public')->delete($database->icon);
            }

            // Enregistrer la nouvelle image
            $path = $request->file('icon')->store('databases', 'public');
            $validated['icon'] = $path;
        }

        $database->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Base de données mise à jour avec succès.',
            'data' => $database,
        ], 200);
    }

    /**
     * Supprimer une base de données.
     */
    public function destroy(Database $database): JsonResponse
    {
        // Supprimer le fichier image du stockage si présent
        if ($database->icon && Storage::disk('public')->exists($database->icon)) {
            Storage::disk('public')->delete($database->icon);
        }

        $database->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Base de données supprimée avec succès.',
        ], 200);
    }
}