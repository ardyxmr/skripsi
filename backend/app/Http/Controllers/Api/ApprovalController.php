<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApprovalRequest;
use App\Models\Inventory;
use App\Models\ProvisionRequest;
use App\Services\ApprovalWorkflowService;
use App\Services\AuditService;
use App\Services\LifecycleService;
use App\Services\NodeCapacityService;
use App\Services\ProvisionRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// Approvals (Module 09) — gated to Manager/Administrator in routes/api.php.
class ApprovalController extends Controller
{
    private const LIFECYCLE_TYPES = ['RENEWAL', 'PERMANENT', 'RESIZE', 'DESTROY', 'ADD_DISK', 'EDIT_RESOURCES', 'HARDEN'];

    public function __construct(
        private ApprovalWorkflowService $workflow,
        private ProvisionRequestService $provisioning,
        private LifecycleService $lifecycle,
        private NodeCapacityService $capacity,
        private AuditService $audit,
    ) {}

    // Visibility-scoped: Admin → all; Manager → requests from members of the groups they manage;
    // regular user → only their own. Single source of truth: User::visibleOwnerIds().
    public function index(Request $request): JsonResponse
    {
        $query = ApprovalRequest::with(['requester', 'approver', 'group.manager'])->orderByDesc('id');
        $ownerIds = $request->user()->visibleOwnerIds();
        if ($ownerIds !== null) {
            $query->whereIn('requester_id', $ownerIds);
        }
        $approvals = $query->get();

        // Batch-load the referenced PROVISION requests and lifecycle inventory VMs.
        $provisions = ProvisionRequest::with(['environment', 'provider', 'catalog', 'tier', 'node.providerNode.datastores'])
            ->whereIn('id', $approvals->where('request_type', 'PROVISION')->pluck('reference_id'))->get()->keyBy('id');
        $inventories = Inventory::with(['environment', 'provider', 'catalog', 'tier', 'node.providerNode.datastores'])
            ->whereIn('id', $approvals->whereIn('request_type', self::LIFECYCLE_TYPES)->pluck('reference_id'))->get()->keyBy('id');

        return response()->json($approvals->map(fn (ApprovalRequest $a) => $this->transform(
            $a, $provisions->get($a->reference_id), $inventories->get($a->reference_id),
        )));
    }

    public function stats(): JsonResponse
    {
        $by = ApprovalRequest::selectRaw('status, count(*) as c')->groupBy('status')->pluck('c', 'status');

        return response()->json([
            'total' => (int) $by->sum(),
            'pending' => (int) ($by['Pending'] ?? 0),
            'approved' => (int) ($by['Approved'] ?? 0),
            'rejected' => (int) ($by['Rejected'] ?? 0),
            'reverted' => (int) ($by['Reverted'] ?? 0),
        ]);
    }

    public function approve(Request $request, ApprovalRequest $approval): JsonResponse
    {
        return $this->run($request, $approval, 'Approve');
    }

    public function reject(Request $request, ApprovalRequest $approval): JsonResponse
    {
        return $this->run($request, $approval, 'Reject');
    }

    public function revert(Request $request, ApprovalRequest $approval): JsonResponse
    {
        return $this->run($request, $approval, 'Revert');
    }

    private function run(Request $request, ApprovalRequest $approval, string $action): JsonResponse
    {
        // Scope guard: a Manager may only act on requests from members of the groups they manage
        // (Administrator → any). Mirrors InventoryController::authorizeView (404, no existence leak).
        $ownerIds = $request->user()->visibleOwnerIds();
        abort_if($ownerIds !== null && ! in_array($approval->requester_id, $ownerIds, true), 404, 'Not found.');

        $reason = $request->validate(['action_reason' => ['required', 'string']])['action_reason'];

        $provision = $approval->request_type === 'PROVISION' ? ProvisionRequest::with(['environment', 'provider', 'catalog', 'tier', 'node.providerNode.datastores'])->find($approval->reference_id) : null;
        $inventory = in_array($approval->request_type, self::LIFECYCLE_TYPES, true) ? Inventory::with(['environment', 'provider', 'catalog', 'tier', 'node.providerNode.datastores'])->find($approval->reference_id) : null;

        // Gate BEFORE recording the decision: re-check capacity (it may have crossed critical since
        // submit) and refuse to approve a PROVISION onto a hard-blocked node — otherwise the request
        // would be left Approved-but-undispatched. Only NEW provisioning is gated (a lifecycle change
        // acts on a VM already on the node). The refused attempt is written to the audit trail.
        if ($action === 'Approve' && $provision) {
            $node = $provision->node;
            if ($node?->providerNode && $this->capacity->snapshot($node->providerNode->loadMissing('datastores'))['provisioning_blocked']) {
                $this->audit->log($request->user(), 'PROVISION_BLOCKED', "Approve refused for {$provision->vm_name}: node \"{$node->node_name}\" at critical capacity (hard-block enabled)", $request, ['vm_name' => $provision->vm_name, 'node' => $node->node_name]);
                abort(422, "Node \"{$node->node_name}\" is at critical capacity and provisioning is blocked. Free up resources or disable the block on the node, then approve.");
            }
        }

        $this->workflow->act($approval, $request->user(), $action, $reason);

        // Approving a request applies it: PROVISION → per-VM jobs (Stage 6); lifecycle → LifecycleService (Stage 7).
        if ($action === 'Approve') {
            if ($provision) {
                $this->provisioning->dispatchProvisioning($provision);
            } elseif ($inventory) {
                $this->lifecycle->applyApproved($approval->fresh());
            }
        }

        return response()->json($this->transform($approval->fresh(['requester', 'approver', 'group.manager']), $provision, $inventory));
    }

    private function transform(ApprovalRequest $a, ?ProvisionRequest $p, ?Inventory $inv = null): array
    {
        // Source the named detail from the provision request (PROVISION) or the VM (lifecycle).
        $ctx = $p ?? $inv;
        $tier = $ctx?->tier;

        return [
            'id' => $a->id,
            'request_type' => $a->request_type,
            'reference_id' => $a->reference_id,
            'status' => $a->status,
            'action_type' => $a->action_type,
            'action_reason' => $a->action_reason,
            'action_date' => $a->action_date,
            'created_at' => $a->created_at,
            'requester_name' => $a->requester?->name,
            'approver_name' => $a->approver?->name,
            'group_name' => $a->group?->group_name,
            'manager' => $a->group?->manager?->name,

            // Shared detail — from the provision request (PROVISION) or the VM (lifecycle).
            'vm_name' => $ctx?->vm_name,
            'environment_id' => $ctx?->environment_id,
            'environment_name' => $ctx?->environment?->environment_name,
            'provider_id' => $ctx?->provider_id,
            'provider_name' => $ctx?->provider?->provider_name,
            'node_id' => $ctx?->node_id,
            // Target-node capacity so the approver decides with load in mind; approve is refused when blocked.
            'node_capacity' => $this->capacity->snapshot($ctx?->node?->providerNode),
            'catalog_id' => $ctx?->catalog_id,
            'catalog_name' => $ctx?->catalog?->catalog_name,
            'tier_id' => $ctx?->tier_id,
            'tier_name' => $tier?->tier_name,
            'cpu' => $tier?->cpu,
            'ram' => $tier ? (int) round($tier->ram_mb / 1024) : null,
            'disk' => $tier?->disk_gb,
            'network_id' => $ctx?->network_id,
            'datastore_id' => $ctx?->datastore_id,

            // Expiry context so the table can show a meaningful value per request type:
            // PROVISION falls back to the environment policy; lifecycle shows the VM's current expiry.
            'boot_disk_gb' => $p?->boot_disk_gb,
            'expiry_type' => $ctx?->environment?->expiry_type,
            'expiry_value' => $ctx?->environment?->expiry_value,
            'current_expiry' => $inv?->expiry_date,

            // PROVISION-only.
            'instance_count' => $p?->instance_count,
            'description' => $p?->description,
            'requested_expiry' => $p?->requested_expiry,

            // Lifecycle change detail (RESIZE cpu/ram, RENEWAL extension_period, …).
            'payload' => $a->payload,
        ];
    }
}
