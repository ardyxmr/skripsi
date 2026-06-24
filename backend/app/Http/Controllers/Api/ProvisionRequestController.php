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
            // DNS-label charset only (letters/digits/internal hyphens, no leading/trailing hyphen).
            // Blocks path traversal (/, .., .) and Terraform ${} interpolation in the workspace path
            // + tfvars. Capped at 60 so a batch's "-0N" suffix stays within the 63-char hostname limit.
            'vm_name' => ['required', 'string', 'max:60', 'regex:/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/'],
            'environment_id' => ['required', 'integer', 'exists:environments,id'],
            'provider_id' => ['required', 'integer', 'exists:providers,id'],
            'node_id' => ['required', 'integer', 'exists:nodes,id'],
            'catalog_id' => ['required', 'integer', 'exists:catalogs,id'],
            'tier_id' => ['required', 'integer', 'exists:tiers,id'],
            'network_id' => ['required', 'integer', 'exists:networks,id'],
            'datastore_id' => ['required', 'integer', 'exists:datastores,id'],
            'instance_count' => ['nullable', 'integer', 'min:1', 'max:20'],
            'boot_disk_gb' => ['nullable', 'integer', 'min:1'],
            'requested_expiry' => ['nullable', 'date'],
            'description' => ['nullable', 'string'],
        ]);
        $data['instance_count'] ??= 1;

        $pr = $this->service->create($request->user(), $data);

        return response()->json(['id' => $pr->id] + $this->outcome($pr, $request->user()), 201);
    }

    /**
     * The outcome of a submit/resubmit, so the frontend can branch on what actually
     * happened instead of guessing from the environment policy:
     *   - approval_required: the env policy (unchanged semantics — an honest echo).
     *   - status: 'pending_approval' (awaiting a manager) | 'dispatched' (provisioning started now).
     *   - bypassed: true only when a privileged actor skipped an approval the env would otherwise require.
     * The environment is read fresh (resubmit may have changed environment_id) and the branch is
     * derived from the same ProvisionRequestService::requiresApproval() used to act, so they can't drift.
     */
    private function outcome(ProvisionRequest $pr, $actor): array
    {
        $env = $pr->environment()->first();
        $approvalRequired = (bool) $env->approval_required;
        $pending = $this->service->requiresApproval($actor, $env);

        return [
            'approval_required' => $approvalRequired,
            'status' => $pending ? 'pending_approval' : 'dispatched',
            'bypassed' => $approvalRequired && ! $pending,
        ];
    }

    // Re-submit a reverted request: update it in place and re-open its approval (no new request).
    public function update(Request $request, ProvisionRequest $provisionRequest): JsonResponse
    {
        $data = $request->validate([
            // DNS-label charset only (letters/digits/internal hyphens, no leading/trailing hyphen).
            // Blocks path traversal (/, .., .) and Terraform ${} interpolation in the workspace path
            // + tfvars. Capped at 60 so a batch's "-0N" suffix stays within the 63-char hostname limit.
            'vm_name' => ['required', 'string', 'max:60', 'regex:/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/'],
            'environment_id' => ['required', 'integer', 'exists:environments,id'],
            'provider_id' => ['required', 'integer', 'exists:providers,id'],
            'node_id' => ['required', 'integer', 'exists:nodes,id'],
            'catalog_id' => ['required', 'integer', 'exists:catalogs,id'],
            'tier_id' => ['required', 'integer', 'exists:tiers,id'],
            'network_id' => ['required', 'integer', 'exists:networks,id'],
            'datastore_id' => ['required', 'integer', 'exists:datastores,id'],
            'instance_count' => ['nullable', 'integer', 'min:1', 'max:20'],
            'boot_disk_gb' => ['nullable', 'integer', 'min:1'],
            'requested_expiry' => ['nullable', 'date'],
            'description' => ['nullable', 'string'],
        ]);
        $data['instance_count'] ??= 1;

        $this->service->resubmit($provisionRequest, $request->user(), $data);

        return response()->json(
            ['id' => $provisionRequest->id, 'resubmitted' => true] + $this->outcome($provisionRequest, $request->user())
        );
    }
}
