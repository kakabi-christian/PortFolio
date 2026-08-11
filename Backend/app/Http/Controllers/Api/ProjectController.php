<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProjectRequest;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource (avec pagination).
     */
    public function index(): JsonResponse
    {
        // Pagination (par exemple, 10 projets par page)
        $projects = Project::latest()->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $projects
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ProjectRequest $request): JsonResponse
    {
        $validatedData = $request->validated();

        // Générer le slug automatiquement à partir du titre si aucun slug n'est fourni
        if (empty($validatedData['slug'])) {
            $validatedData['slug'] = Str::slug($validatedData['title']);
        } else {
            $validatedData['slug'] = Str::slug($validatedData['slug']);
        }

        $project = Project::create($validatedData);

        return response()->json([
            'status' => 'success',
            'message' => 'Projet créé avec succès.',
            'data' => $project
        ], 201);
    }

    /**
     * Display the specified resource.
     * (Grâce au Route Model Binding, Laravel récupère le projet automatiquement,
     *  idéalement on configure le modèle pour chercher par 'slug' ou on gère l'ID/slug).
     */
    public function show(Project $project): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $project
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ProjectRequest $request, Project $project): JsonResponse
    {
        $validatedData = $request->validated();

        // Mettre à jour ou régénérer le slug si le titre change ou si un nouveau slug est envoyé
        if (!empty($validatedData['title']) && empty($validatedData['slug'])) {
            $validatedData['slug'] = Str::slug($validatedData['title']);
        } elseif (!empty($validatedData['slug'])) {
            $validatedData['slug'] = Str::slug($validatedData['slug']);
        }

        $project->update($validatedData);

        return response()->json([
            'status' => 'success',
            'message' => 'Projet mis à jour avec succès.',
            'data' => $project
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project): JsonResponse
    {
        $project->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Projet supprimé avec succès.'
        ], 200);
    }
}