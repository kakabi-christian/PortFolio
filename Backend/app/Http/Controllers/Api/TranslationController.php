<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DeepLService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class TranslationController extends Controller
{
    /**
     * Service DeepL.
     */
    protected DeepLService $deepLService;

    /**
     * Injection du service DeepL.
     */
    public function __construct(DeepLService $deepLService)
    {
        $this->deepLService = $deepLService;
    }

    /**
     * Traduire un texte avec DeepL.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => ['required', 'string'],
            'target_language' => ['required', 'string', 'max:10'],
        ]);

        try {
            $translation = $this->deepLService->translate(
                $validated['text'],
                strtoupper($validated['target_language'])
            );

            return response()->json([
                'success' => true,
                'original_text' => $validated['text'],
                'translated_text' => $translation,
                'target_language' => strtoupper($validated['target_language']),
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la traduction.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}