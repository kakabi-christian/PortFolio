<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\FrameworkRequest;
use App\Models\Framework;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FrameworkController extends Controller
{
    /**
     * Display a listing of the resource with pagination.
     */
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $frameworks = Framework::orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($frameworks);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(FrameworkRequest $request)
    {
        $data = $request->validated();

        if ($request->hasFile('icon')) {
            $path = $request->file('icon')->store('frameworks', 'public');
            $data['icon'] = $path;
        }

        $framework = Framework::create($data);

        return response()->json([
            'message' => 'Framework créé avec succès !',
            'data' => $framework
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Framework $framework)
    {
        return response()->json([
            'data' => $framework
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(FrameworkRequest $request, Framework $framework)
    {
        $data = $request->validated();

        if ($request->hasFile('icon')) {
            // Supprimer l'ancienne image si elle existe
            if ($framework->icon && Storage::disk('public')->exists($framework->icon)) {
                Storage::disk('public')->delete($framework->icon);
            }

            // Enregistrer la nouvelle
            $path = $request->file('icon')->store('frameworks', 'public');
            $data['icon'] = $path;
        }

        $framework->update($data);

        return response()->json([
            'message' => 'Framework mis à jour avec succès !',
            'data' => $framework
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Framework $framework)
    {
        // Supprimer l'image associée du stockage
        if ($framework->icon && Storage::disk('public')->exists($framework->icon)) {
            Storage::disk('public')->delete($framework->icon);
        }

        $framework->delete();

        return response()->json([
            'message' => 'Framework supprimé avec succès !'
        ]);
    }
}