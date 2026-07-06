<?php

use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\DatastoreController;
use App\Http\Controllers\Api\EnvironmentController;
use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\NetworkController;
use App\Http\Controllers\Api\NodeController;
use App\Http\Controllers\Api\ApprovalController;
use App\Http\Controllers\Api\ProviderController;
use App\Http\Controllers\Api\ProvisionRequestController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\SetupController;
use App\Http\Controllers\Api\TierController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Liveness probe (no auth).
Route::get('/health', fn () => response()->json(['status' => 'ok', 'app' => config('app.name')]));

// First-run installer (no auth) — self-locks once any user exists. See SetupController.
Route::get('/setup/status', [SetupController::class, 'status']);
Route::post('/setup', [SetupController::class, 'store']);

// Auth (Module 10 / 07-api-contract §1).
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/verify-password', [AuthController::class, 'verifyPassword']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // Published resources — user-facing reads (any authenticated role).
    Route::get('catalogs', [CatalogController::class, 'index']);
    Route::get('catalogs/{catalog}/hardening', [CatalogController::class, 'listHardening']); // versions list — users read it for the harden modal
    Route::get('nodes', [NodeController::class, 'index']);
    Route::get('networks', [NetworkController::class, 'index']);
    Route::get('datastores', [DatastoreController::class, 'index']);
    Route::get('tiers', [TierController::class, 'index']);
    Route::get('tiers/stats', [TierController::class, 'stats']);
    Route::get('environments', [EnvironmentController::class, 'index']);
    Route::get('environments/{environment}/allowed-resources', [EnvironmentController::class, 'allowedResources']);

    // Provision requests — any authenticated user may submit (Stage 5 / Module 12).
    Route::post('provision-requests', [ProvisionRequestController::class, 'store']);
    Route::put('provision-requests/{provisionRequest}', [ProvisionRequestController::class, 'update']); // resubmit a reverted request

    // Requests list — any authenticated user (controller scopes: privileged see all, users see own).
    Route::get('approvals', [ApprovalController::class, 'index']);

    // Inventory & lifecycle (Stage 7) — RBAC-scoped reads; mutations route through LifecycleService.
    Route::get('inventory', [InventoryController::class, 'index']);
    Route::post('inventory/sync-all', [InventoryController::class, 'syncAll']); // global DB mirror — defined before {inventory} routes
    Route::get('inventory/{inventory}', [InventoryController::class, 'show']);
    Route::get('inventory/{inventory}/credentials', [InventoryController::class, 'credentials']); // audited reveal of per-VM login
    Route::post('inventory/{inventory}/retry', [InventoryController::class, 'retry']);
    Route::post('inventory/{inventory}/renew', [InventoryController::class, 'renew']);
    Route::post('inventory/{inventory}/permanent', [InventoryController::class, 'permanent']);
    Route::post('inventory/{inventory}/resize', [InventoryController::class, 'resize']);
    Route::post('inventory/{inventory}/edit-resources', [InventoryController::class, 'editResources']); // unified CPU/RAM + add-disk bundle
    Route::post('inventory/{inventory}/harden', [InventoryController::class, 'harden']);                 // Stage 8 — run catalog Ansible hardening
    Route::post('inventory/{inventory}/delete', [InventoryController::class, 'destroyVm']);
    Route::post('inventory/{inventory}/add-disk', [InventoryController::class, 'addDisk']);                       // gated by environment.allow_data_disk
    Route::post('inventory/{inventory}/disks/{disk}/complete', [InventoryController::class, 'completeDisk']);     // Administrator only — marks data disk Ready

    // Approval ACTIONS (Module 09) — Manager or Administrator only. (The list above is open to all, scoped.)
    Route::middleware('role:Manager,Administrator')->group(function () {
        Route::get('approvals/stats', [ApprovalController::class, 'stats']);
        Route::post('approvals/{approval}/approve', [ApprovalController::class, 'approve']);
        Route::post('approvals/{approval}/reject', [ApprovalController::class, 'reject']);
        Route::post('approvals/{approval}/revert', [ApprovalController::class, 'revert']);
    });

    // Admin-only IAM CRUD (07-api-contract §10).
    Route::middleware('role:Administrator')->group(function () {
        // Audit trail (read + CSV export) — Administrator only.
        Route::get('audit-logs/export', [AuditController::class, 'export']);
        Route::get('audit-logs', [AuditController::class, 'index']);

        // Catalog publishing (write).
        Route::post('catalogs', [CatalogController::class, 'store']);
        Route::put('catalogs/{catalog}', [CatalogController::class, 'update']);
        Route::delete('catalogs/{catalog}', [CatalogController::class, 'destroy']);
        Route::post('catalogs/{catalog}/image', [CatalogController::class, 'uploadImage']);
        Route::post('catalogs/{catalog}/hardening', [CatalogController::class, 'uploadHardening']);              // add a new hardening version
        Route::delete('catalogs/{catalog}/hardening/{version}', [CatalogController::class, 'retireHardening']); // retire (is_active=false)

        // Published node publishing (write) + scoped sync/explorer. Specific routes
        // before the apiResource so /sync and /explorer aren't captured as {node}.
        Route::post('nodes/{node}/sync', [NodeController::class, 'sync']);
        Route::get('nodes/{node}/explorer', [NodeController::class, 'explorer']);
        Route::post('nodes', [NodeController::class, 'store']);
        Route::put('nodes/{node}', [NodeController::class, 'update']);
        Route::delete('nodes/{node}', [NodeController::class, 'destroy']);

        // Network + Datastore publishing (write).
        Route::post('networks', [NetworkController::class, 'store']);
        Route::put('networks/{network}', [NetworkController::class, 'update']);
        Route::delete('networks/{network}', [NetworkController::class, 'destroy']);
        Route::post('datastores', [DatastoreController::class, 'store']);
        Route::put('datastores/{datastore}', [DatastoreController::class, 'update']);
        Route::delete('datastores/{datastore}', [DatastoreController::class, 'destroy']);

        // Tier policy (write).
        Route::post('tiers', [TierController::class, 'store']);
        Route::put('tiers/{tier}', [TierController::class, 'update']);
        Route::delete('tiers/{tier}', [TierController::class, 'destroy']);

        // Environment policy (write).
        Route::post('environments', [EnvironmentController::class, 'store']);
        Route::put('environments/{environment}', [EnvironmentController::class, 'update']);
        Route::delete('environments/{environment}', [EnvironmentController::class, 'destroy']);

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
