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

// ============================================================
// ROUTES PUBLIQUES D'AUTHENTIFICATION
// ============================================================

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// ============================================================
// ROUTES PUBLIQUES - FRAMEWORKS
// ============================================================

Route::get('/frameworks', [FrameworkController::class, 'index']);
Route::get('/frameworks/{framework}', [FrameworkController::class, 'show']);

// ============================================================
// ROUTES PUBLIQUES - DATABASES
// ============================================================

Route::get('/databases', [DatabaseController::class, 'index']);
Route::get('/databases/{database}', [DatabaseController::class, 'show']);

// ============================================================
// ROUTES PUBLIQUES - TOOLS
// ============================================================

Route::get('/tools', [ToolController::class, 'index']);
Route::get('/tools/{tool}', [ToolController::class, 'show']);

// ============================================================
// ROUTES PUBLIQUES - PROJECTS
// ============================================================

Route::get('/projects', [ProjectController::class, 'index']);
Route::get('/projects/{project}', [ProjectController::class, 'show']);

// ============================================================
// ROUTE PUBLIQUE - CONTACT
// ============================================================

Route::post('/contact', [ContactController::class, 'store']);

// ============================================================
// ROUTE PUBLIQUE - TRADUCTION DEEPL
// ============================================================

Route::post('/translate', [TranslationController::class, 'store']);

// ============================================================
// ROUTES ADMINISTRATEUR
// Authentification Sanctum + vérification du rôle admin
// ============================================================

Route::middleware(['auth:sanctum', 'admin'])->group(function () {

    // --------------------------------------------------------
    // UTILISATEUR CONNECTÉ
    // --------------------------------------------------------

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // --------------------------------------------------------
    // DÉCONNEXION
    // --------------------------------------------------------

    Route::post('/logout', [AuthController::class, 'logout']);

    // ========================================================
    // GESTION DES FRAMEWORKS
    // ========================================================

    Route::apiResource('frameworks', FrameworkController::class)
        ->except(['index', 'show']);

    // ========================================================
    // GESTION DES DATABASES
    // ========================================================

    Route::apiResource('databases', DatabaseController::class)
        ->except(['index', 'show']);

    // ========================================================
    // GESTION DES TOOLS
    // ========================================================

    Route::apiResource('tools', ToolController::class)
        ->except(['index', 'show']);

    // ========================================================
    // GESTION DES PROJECTS
    // ========================================================

    Route::apiResource('projects', ProjectController::class)
        ->except(['index', 'show']);

    // ========================================================
    // DASHBOARD ADMIN - CONTACTS
    // ========================================================

    Route::get('/admin/contacts', [ContactController::class, 'index']);

    Route::get(
        '/admin/contacts/count/unread',
        [ContactController::class, 'countUnread']
    );

    Route::get(
        '/admin/contacts/{id}',
        [ContactController::class, 'show']
    );

    Route::post(
        '/admin/contacts/{id}/reply',
        [ContactController::class, 'reply']
    );

    Route::delete(
        '/admin/contacts/{id}',
        [ContactController::class, 'destroy']
    );
});
