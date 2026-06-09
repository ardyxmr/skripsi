<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GroupController;
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

    // Admin-only IAM CRUD (07-api-contract §10).
    Route::middleware('role:Administrator')->group(function () {
        Route::apiResource('users', UserController::class)->except('show');
        Route::apiResource('roles', RoleController::class)->except('show');
        Route::apiResource('groups', GroupController::class)->except('show');
    });
});
