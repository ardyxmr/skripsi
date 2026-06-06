<?php

namespace App\Http\Controllers;

use App\Models\VmRequest;
use Illuminate\Http\Request;

class VmRequestController extends Controller
{
    public function index(Request $request)
    {
        // Users see their own requests, Managers see pending group requests
        $user = $request->user();
        if ($user->hasRole('Admin') || $user->hasRole('Manager')) {
             return VmRequest::with(['user', 'catalog', 'tier'])->get();
        }
        return VmRequest::with(['catalog', 'tier'])->where('user_id', $user->id)->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'catalog_id' => 'required|exists:catalogs,id',
            'tier_id' => 'required|exists:tiers,id',
            'vm_name' => 'required|string|max:255'
        ]);

        $user = $request->user();
        
        $vmRequest = VmRequest::create([
            'user_id' => $user->id,
            'group_id' => $user->group_id,
            'catalog_id' => $validated['catalog_id'],
            'tier_id' => $validated['tier_id'],
            'vm_name' => $validated['vm_name'],
            'status' => 'pending',
            'approval_status' => 'pending'
        ]);

        return response()->json($vmRequest, 201);
    }

    public function approve(Request $request, VmRequest $vmRequest, \App\Services\ProvisioningService $provisioningService)
    {
        // Logic for manager to approve request. Phase 4 will handle the Terraform execution here.
        $vmRequest->update([
            'approval_status' => 'approved',
            'status' => 'processing',
            'approved_at' => now()
        ]);
        
        // Dispatch Provisioning
        // Note: In production, this should be dispatched to a Job queue (e.g. Redis/Horizon)
        // rather than running synchronously in the web request.
        try {
            $provisioningService->provision($vmRequest);
            return response()->json(['message' => 'Request approved, provisioning completed', 'data' => $vmRequest]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Provisioning failed: ' . $e->getMessage()], 500);
        }
    }
}
