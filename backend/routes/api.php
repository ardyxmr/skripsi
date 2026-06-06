<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\TierController;
use App\Http\Controllers\VmRequestController;
use App\Http\Controllers\VmInventoryController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Admin Only Management API
    // Route::middleware('role:Admin')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::apiResource('groups', GroupController::class);
        Route::apiResource('tiers', TierController::class);
        Route::get('/admin/catalogs', [CatalogController::class, 'indexAdmin']);
        Route::post('/catalogs', [CatalogController::class, 'store']);
        Route::put('/catalogs/{catalog}', [CatalogController::class, 'update']);
        Route::delete('/catalogs/{catalog}', [CatalogController::class, 'destroy']);
        
        // Proxmox Synchronization
        Route::post('/sync/networks', [App\Http\Controllers\ProxmoxSyncController::class, 'syncNetworks']);
        Route::post('/sync/datastores', [App\Http\Controllers\ProxmoxSyncController::class, 'syncDatastores']);
    // });

    // User Facing APIs
    Route::get('/catalogs', [CatalogController::class, 'index']);
    
    // VM Requests
    Route::get('/vm-requests', [VmRequestController::class, 'index']);
    Route::post('/vm-requests', [VmRequestController::class, 'store']);
    Route::post('/vm-requests/{vmRequest}/approve', [VmRequestController::class, 'approve']); // ->middleware('role:Manager|Admin')

    // VM Inventory
    Route::get('/vms', [VmInventoryController::class, 'index']);
    Route::post('/vms/{vm}/action', [VmInventoryController::class, 'action']);
});
