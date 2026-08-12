<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProjectRequest;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource (avec pagination).
     */
    public function index(): JsonResponse
    {
        Log::info('ProjectController@index : Récupération de la liste des projets.');
        $projects = Project::latest()->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $projects,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ProjectRequest $request): JsonResponse
    {
        Log::info('--- DEBUT STORE PROJECT ---');
        Log::info('Données brutes reçues (all):', $request->all());
        Log::info('Fichiers reçus (all files):', $request->allFiles());

        $validatedData = $request->validated();
        Log::info('Données validées par ProjectRequest:', $validatedData);

        // Gestion du slug
        if (empty($validatedData['slug'])) {
            $validatedData['slug'] = Str::slug($validatedData['title']);
        } else {
            $validatedData['slug'] = Str::slug($validatedData['slug']);
        }

        // Gestion de l'upload de l'image
        if ($request->hasFile('image_url')) {
            Log::info('Fichier image détecté dans store(). Upload en cours...');
            $path = $request->file('image_url')->store('projects', 'public');
            $validatedData['image_url'] = $path;
            Log::info('Image enregistrée avec succès sur le chemin : ' . $path);
        } else {
            Log::info('Aucun fichier image trouvé dans store(). Attribution de null.');
            $validatedData['image_url'] = null;
        }

        $project = Project::create($validatedData);
        Log::info('Projet créé avec succès ID: ' . $project->id);
        Log::info('--- FIN STORE PROJECT ---');

        return response()->json([
            'status' => 'success',
            'message' => 'Projet créé avec succès.',
            'data' => $project,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Project $project): JsonResponse
    {
        Log::info('ProjectController@show : Affichage du projet ID: ' . $project->id);
        return response()->json([
            'status' => 'success',
            'data' => $project,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ProjectRequest $request, Project $project): JsonResponse
    {
        Log::info('--- DEBUT UPDATE PROJECT ID: ' . $project->id . ' ---');
        Log::info('Données brutes reçues (all) pour update:', $request->all());
        Log::info('Fichiers reçus (all files) pour update:', $request->allFiles());
        Log::info('Valeur de image_url dans la requête (type/valeur) : ' . gettype($request->input('image_url')), ['val' => $request->input('image_url')]);

        $validatedData = $request->validated();
        Log::info('Données validées par ProjectRequest pour update:', $validatedData);

        // Mettre à jour ou régénérer le slug
        if (!empty($validatedData['title']) && empty($validatedData['slug'])) {
            $validatedData['slug'] = Str::slug($validatedData['title']);
        } elseif (!empty($validatedData['slug'])) {
            $validatedData['slug'] = Str::slug($validatedData['slug']);
        }

        // Gestion de l'upload de la nouvelle image
        if ($request->hasFile('image_url')) {
            Log::info('Nouveau fichier image détecté lors de la mise à jour.');
            
            // Supprimer l'ancienne image si elle existe
            if ($project->image_url && Storage::disk('public')->exists($project->image_url)) {
                Storage::disk('public')->delete($project->image_url);
                Log::info('Ancienne image supprimée du stockage : ' . $project->image_url);
            }

            $path = $request->file('image_url')->store('projects', 'public');
            $validatedData['image_url'] = $path;
            Log::info('Nouvelle image stockée à : ' . $path);
        } else {
            Log::info('Aucun nouveau fichier image envoyé. Conservation de l ancienne image en base.');
            // Conserver l'ancienne image si aucun nouveau fichier n'est envoyé
            unset($validatedData['image_url']);
        }

        $project->update($validatedData);
        Log::info('Projet mis à jour avec succès ID: ' . $project->id);
        Log::info('--- FIN UPDATE PROJECT ---');

        return response()->json([
            'status' => 'success',
            'message' => 'Projet mis à jour avec succès.',
            'data' => $project,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project): JsonResponse
    {
        Log::info('--- DEBUT DESTROY PROJECT ID: ' . $project->id . ' ---');
        
        // Supprimer l'image associée du stockage si elle existe
        if ($project->image_url && Storage::disk('public')->exists($project->image_url)) {
            Storage::disk('public')->delete($project->image_url);
            Log::info('Image du projet supprimée du disque : ' . $project->image_url);
        }

        $project->delete();
        Log::info('Projet supprimé de la base de données avec succès.');
        Log::info('--- FIN DESTROY PROJECT ---');

        return response()->json([
            'status' => 'success',
            'message' => 'Projet supprimé avec succès.',
        ], 200);
    }
}