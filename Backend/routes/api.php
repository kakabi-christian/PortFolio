<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\DatabaseController;
use App\Http\Controllers\Api\FrameworkController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ToolController;
use App\Http\Controllers\Api\TranslationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Routes publiques d'authentification
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Routes publiques pour lister ou afficher les ressources
Route::get('/frameworks', [FrameworkController::class, 'index']);
Route::get('/frameworks/{framework}', [FrameworkController::class, 'show']);

Route::get('/databases', [DatabaseController::class, 'index']);
Route::get('/databases/{database}', [DatabaseController::class, 'show']);

Route::get('/tools', [ToolController::class, 'index']);
Route::get('/tools/{tool}', [ToolController::class, 'show']);

// Routes publiques pour les projets
Route::get('/projects', [ProjectController::class, 'index']);
Route::get('/projects/{project}', [ProjectController::class, 'show']);

// Route publique pour envoyer un message depuis le formulaire de contact
Route::post('/contact', [ContactController::class, 'store']);

// ============================================================
// ROUTE PUBLIQUE DE TRADUCTION DEEPL
// ============================================================

Route::post('/translate', [TranslationController::class, 'store']);


// Routes protégées par Sanctum
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/logout', [AuthController::class, 'logout']);

    // Gestion complète des Frameworks
    Route::apiResource('frameworks', FrameworkController::class)
        ->except(['index', 'show']);

    // Gestion complète des Databases
    Route::apiResource('databases', DatabaseController::class)
        ->except(['index', 'show']);

    // Gestion complète des Tools
    Route::apiResource('tools', ToolController::class)
        ->except(['index', 'show']);

    // Gestion complète des Projects
    Route::apiResource('projects', ProjectController::class)
        ->except(['index', 'show']);

    // ========================================================
    // DASHBOARD ADMIN - CONTACTS
    // ========================================================

    Route::get('/admin/contacts', [ContactController::class, 'index']);
    Route::get('/admin/contacts/count/unread', [ContactController::class, 'countUnread']);
    Route::get('/admin/contacts/{id}', [ContactController::class, 'show']);
    Route::post('/admin/contacts/{id}/reply', [ContactController::class, 'reply']);
    Route::delete('/admin/contacts/{id}', [ContactController::class, 'destroy']);
});