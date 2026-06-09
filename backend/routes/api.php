<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\ProviderController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Liveness probe (no auth).
Route::get('/health', fn () => response()->json(['status' => 'ok', 'app' => config('app.name')]));

// Auth (Module 10 / 07-api-contract §1).
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Published catalog — user-facing read (any authenticated role).
    Route::get('catalogs', [CatalogController::class, 'index']);

    // Admin-only IAM CRUD (07-api-contract §10).
    Route::middleware('role:Administrator')->group(function () {
        // Catalog publishing (write).
        Route::post('catalogs', [CatalogController::class, 'store']);
        Route::put('catalogs/{catalog}', [CatalogController::class, 'update']);
        Route::delete('catalogs/{catalog}', [CatalogController::class, 'destroy']);
        Route::post('catalogs/{catalog}/image', [CatalogController::class, 'uploadImage']);

        Route::apiResource('users', UserController::class)->except('show');
        Route::apiResource('roles', RoleController::class)->except('show');
        Route::apiResource('groups', GroupController::class)->except('show');

        // Provider Discovery (Module 01). /stats before the resource so it isn't
        // captured as {provider}. test-connection/discover/explorer added in 2b/2c.
        Route::get('providers/stats', [ProviderController::class, 'stats']);
        Route::post('providers/{provider}/test-connection', [ProviderController::class, 'testConnection']);
        Route::post('providers/{provider}/discover', [ProviderController::class, 'discover']);
        Route::get('providers/{provider}/explorer', [ProviderController::class, 'explorer']);
        Route::apiResource('providers', ProviderController::class)->except('show');
    });
});
