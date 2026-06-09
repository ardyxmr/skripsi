<?php

use Illuminate\Support\Facades\Route;

// Liveness probe (no auth).
Route::get('/health', fn () => response()->json(['status' => 'ok', 'app' => config('app.name')]));

// --- Stage 1 (Auth + IAM) routes are appended here as we build. ---
