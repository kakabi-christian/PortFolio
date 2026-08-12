<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\DatabaseController;
use App\Http\Controllers\Api\FrameworkController; // Importation du controller Tool
use App\Http\Controllers\Api\ProjectController; // Importation du controller Contact
use App\Http\Controllers\Api\ToolController; // Importation du controller Project
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Routes publiques d'authentification
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Routes publiques pour lister ou afficher les ressources (accessibles sans connexion)
Route::get('/frameworks', [FrameworkController::class, 'index']);
Route::get('/frameworks/{framework}', [FrameworkController::class, 'show']);

Route::get('/databases', [DatabaseController::class, 'index']);
Route::get('/databases/{database}', [DatabaseController::class, 'show']);

Route::get('/tools', [ToolController::class, 'index']);
Route::get('/tools/{tool}', [ToolController::class, 'show']);

// Routes publiques pour les projets
Route::get('/projects', [ProjectController::class, 'index']);
Route::get('/projects/{project}', [ProjectController::class, 'show']);

// Route publique pour envoyer un message depuis le formulaire de contact du portfolio
Route::post('/contact', [ContactController::class, 'store']);

// Routes protégées par Sanctum
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/logout', [AuthController::class, 'logout']);

    // Gestion complète des Frameworks (hors index et show)
    Route::apiResource('frameworks', FrameworkController::class)->except(['index', 'show']);

    // Gestion complète des Databases (hors index et show)
    Route::apiResource('databases', DatabaseController::class)->except(['index', 'show']);

    // Gestion complète des Tools (hors index et show)
    Route::apiResource('tools', ToolController::class)->except(['index', 'show']);

    // Gestion complète des Projects (hors index et show)
    Route::apiResource('projects', ProjectController::class)->except(['index', 'show']);

    // --- Routes du Dashboard Admin pour les Contacts ---
    Route::get('/admin/contacts', [ContactController::class, 'index']);
    Route::get('/admin/contacts/count/unread', [ContactController::class, 'countUnread']);
    Route::get('/admin/contacts/{id}', [ContactController::class, 'show']);
    Route::post('/admin/contacts/{id}/reply', [ContactController::class, 'reply']);
    Route::delete('/admin/contacts/{id}', [ContactController::class, 'destroy']);
});
