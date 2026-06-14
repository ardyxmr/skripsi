<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProvisionRequest;
use App\Services\ProvisionRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProvisionRequestController extends Controller
{
    public function __construct(private ProvisionRequestService $service) {}

    // Any authenticated user may submit. Field-shape validated here; policy validated in the service.
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'vm_name' => ['required', 'string', 'max:255'],
            'environment_id' => ['required', 'integer', 'exists:environments,id'],
            'provider_id' => ['required', 'integer', 'exists:providers,id'],
            'node_id' => ['required', 'integer', 'exists:nodes,id'],
            'catalog_id' => ['required', 'integer', 'exists:catalogs,id'],
            'tier_id' => ['required', 'integer', 'exists:tiers,id'],
            'network_id' => ['required', 'integer', 'exists:networks,id'],
            'datastore_id' => ['required', 'integer', 'exists:datastores,id'],
            'instance_count' => ['nullable', 'integer', 'min:1', 'max:20'],
            'security_hardening' => ['boolean'],
            'boot_disk_gb' => ['nullable', 'integer', 'min:1'],
            'requested_expiry' => ['nullable', 'date'],
            'description' => ['nullable', 'string'],
        ]);
        $data['instance_count'] ??= 1;

        $pr = $this->service->create($request->user(), $data);

        return response()->json([
            'id' => $pr->id,
            'approval_required' => (bool) $pr->environment->approval_required,
        ], 201);
    }

    // Re-submit a reverted request: update it in place and re-open its approval (no new request).
    public function update(Request $request, ProvisionRequest $provisionRequest): JsonResponse
    {
        $data = $request->validate([
            'vm_name' => ['required', 'string', 'max:255'],
            'environment_id' => ['required', 'integer', 'exists:environments,id'],
            'provider_id' => ['required', 'integer', 'exists:providers,id'],
            'node_id' => ['required', 'integer', 'exists:nodes,id'],
            'catalog_id' => ['required', 'integer', 'exists:catalogs,id'],
            'tier_id' => ['required', 'integer', 'exists:tiers,id'],
            'network_id' => ['required', 'integer', 'exists:networks,id'],
            'datastore_id' => ['required', 'integer', 'exists:datastores,id'],
            'instance_count' => ['nullable', 'integer', 'min:1', 'max:20'],
            'security_hardening' => ['boolean'],
            'boot_disk_gb' => ['nullable', 'integer', 'min:1'],
            'requested_expiry' => ['nullable', 'date'],
            'description' => ['nullable', 'string'],
        ]);
        $data['instance_count'] ??= 1;

        $this->service->resubmit($provisionRequest, $request->user(), $data);

        return response()->json(['id' => $provisionRequest->id, 'resubmitted' => true]);
    }
}
