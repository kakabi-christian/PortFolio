<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ToolRequest;
use App\Models\Tool;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ToolController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $tools = Tool::latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $tools,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ToolRequest $request)
    {
        $validatedData = $request->validated();

        if ($request->hasFile('icon')) {
            $path = $request->file('icon')->store('tools', 'public');
            $validatedData['icon'] = $path;
        }

        $tool = Tool::create($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Outil créé avec succès !',
            'data' => $tool,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Tool $tool)
    {
        return response()->json([
            'success' => true,
            'data' => $tool,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ToolRequest $request, Tool $tool)
    {
        $validatedData = $request->validated();

        if ($request->hasFile('icon')) {
            // Supprimer l'ancienne icône si elle existe
            if ($tool->icon && Storage::disk('public')->exists($tool->icon)) {
                Storage::disk('public')->delete($tool->icon);
            }

            $path = $request->file('icon')->store('tools', 'public');
            $validatedData['icon'] = $path;
        }

        $tool->update($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Outil mis à jour avec succès !',
            'data' => $tool,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Tool $tool)
    {
        if ($tool->icon && Storage::disk('public')->exists($tool->icon)) {
            Storage::disk('public')->delete($tool->icon);
        }

        $tool->delete();

        return response()->json([
            'success' => true,
            'message' => 'Outil supprimé avec succès !',
        ]);
    }
}
