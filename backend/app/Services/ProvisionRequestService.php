<?php

namespace App\Services;

use App\Jobs\ProvisionVmJob;
use App\Models\ApprovalRequest;
use App\Models\Catalog;
use App\Models\Datastore;
use App\Models\Environment;
use App\Models\Inventory;
use App\Models\Network;
use App\Models\Node;
use App\Models\Provider;
use App\Models\ProvisionRequest;
use App\Models\Tier;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Captures a provision request and routes it for approval (04-backend-services.md §5.1).
 * Validates the selection against the (node-centric) environment policy, persists the
 * IDs-only row, and — when the environment requires approval — opens a Pending
 * approval_requests row with the auto-resolved approver. No Terraform here (Stage 6).
 */
class ProvisionRequestService
{
    public function __construct(
        private AuditService $audit,
        private ApproverResolutionService $approverResolution,
        private NodeCapacityService $capacity,
    ) {}

    /**
     * Whether this actor's request must wait for manager approval in this environment.
     * Single source of truth for the approval-vs-immediate-dispatch branch — used by
     * create(), resubmit(), AND the controller's response payload so they never drift.
     * Admins/Managers bypass approval entirely (User::isPrivileged); regular users go
     * through it whenever the environment requires approval.
     */
    public function requiresApproval(User $actor, Environment $env): bool
    {
        return $env->approval_required && ! $actor->isPrivileged();
    }

    public function create(User $requester, array $data): ProvisionRequest
    {
        $env = Environment::with(['providers:id', 'nodes:id', 'tiers:id'])->findOrFail($data['environment_id']);
        $node = Node::with('providerNode.datastores')->findOrFail($data['node_id']);
        $this->validatePolicy($env, $node, $data, $requester);
        $this->assertNamesAvailable($data, $requester);

        $data['requester_id'] = $requester->id;
        $pr = ProvisionRequest::create($data);

        // Admins/Managers bypass approval entirely; regular users still go through it when the env requires it.
        if ($this->requiresApproval($requester, $env)) {
            ApprovalRequest::create([
                'request_type' => 'PROVISION',
                'reference_id' => $pr->id,
                'requester_id' => $requester->id,
                'approver_id' => $this->approverResolution->resolve($requester)?->id,
                'group_id' => $requester->group_id,
                'status' => 'Pending',
            ]);
        } else {
            // No approval needed → provision immediately (Stage 6).
            $this->dispatchProvisioning($pr);
        }

        $this->audit->log($requester, 'CREATE_PROVISION_REQUEST', "Requested {$pr->instance_count}× {$pr->vm_name} in {$env->environment_name}");

        return $pr;
    }

    /**
     * Re-submit a REVERTED provision request (revert→edit→resubmit). Updates the request
     * in place and re-opens the SAME approval back to Pending — no duplicate request is
     * created — so the original entry stops showing as "Reverted / needs edit".
     */
    public function resubmit(ProvisionRequest $pr, User $actor, array $data): ProvisionRequest
    {
        abort_unless($actor->id === $pr->requester_id || $actor->isPrivileged(), 403, 'You cannot edit this request.');

        $env = Environment::with(['providers:id', 'nodes:id', 'tiers:id'])->findOrFail($data['environment_id']);
        $node = Node::with('providerNode.datastores')->findOrFail($data['node_id']);
        $this->validatePolicy($env, $node, $data, $actor);
        $this->assertNamesAvailable($data, $actor, $pr->id);

        $approval = ApprovalRequest::where('request_type', 'PROVISION')->where('reference_id', $pr->id)->latest('id')->first();
        abort_if($approval && $approval->status !== 'Reverted', 422, 'Only reverted requests can be edited and resubmitted.');

        // Update the request fields (the original requester is preserved).
        $pr->update(collect($data)->except('requester_id')->all());

        if ($this->requiresApproval($pr->requester, $env)) {
            // Re-open the same approval for a fresh decision (back to Pending).
            $payload = [
                'status' => 'Pending', 'action_type' => null, 'action_reason' => null, 'action_date' => null,
                'approver_id' => $this->approverResolution->resolve($pr->requester)?->id,
            ];
            $approval
                ? $approval->update($payload)
                : ApprovalRequest::create(array_merge($payload, [
                    'request_type' => 'PROVISION', 'reference_id' => $pr->id,
                    'requester_id' => $pr->requester_id, 'group_id' => $pr->requester?->group_id,
                ]));
        } else {
            // Privileged requester / no approval → provision now; close the approval.
            $approval?->update(['status' => 'Approved', 'action_type' => 'Approve', 'action_reason' => 'Resubmitted (no approval required)', 'action_date' => now(), 'approver_id' => $actor->id]);
            $this->dispatchProvisioning($pr);
        }

        $this->audit->log($actor, 'RESUBMIT_PROVISION_REQUEST', "Resubmitted {$pr->instance_count}× {$pr->vm_name}");

        return $pr;
    }

    /**
     * Fan a request out to one ProvisionVmJob per instance (ADR-08 per-VM, parallel on
     * the queue). instance_count==1 keeps the exact name; a batch gets -01..-0N suffixes.
     */
    public function dispatchProvisioning(ProvisionRequest $pr): void
    {
        foreach ($this->targetNames($pr->vm_name, (int) $pr->instance_count) as $name) {
            ProvisionVmJob::dispatch($pr->id, $name);
        }
    }

    /** The exact VM names a request will create — single keeps the name, a batch gets -01..-0N.
     *  Single source of truth for both dispatch and the pre-flight uniqueness check. */
    private function targetNames(string $vmName, int $count): array
    {
        $n = max(1, $count);
        if ($n === 1) {
            return [$vmName];
        }

        return array_map(fn ($i) => sprintf('%s-%02d', $vmName, $i), range(1, $n));
    }

    /**
     * Reject a request whose target name(s) collide with an existing, non-deleted VM. Duplicate
     * names would create two Proxmox VMs sharing a hostname (and two inventory rows) — confusing and
     * a real footgun — so they're blocked at submit. Case-insensitive (hostnames aren't case-unique).
     */
    private function assertNamesAvailable(array $data, User $actor, ?int $ignoreRequestId = null): void
    {
        $names = $this->targetNames($data['vm_name'], (int) ($data['instance_count'] ?? 1));
        $lower = array_map('strtolower', $names);

        // Live VMs already carrying the name (provisioned, non-deleted).
        $live = Inventory::query()
            ->whereNotIn('status', ['Deleted'])
            ->when($ignoreRequestId, fn ($q) => $q->where('provision_request_id', '!=', $ignoreRequestId))
            ->whereIn(DB::raw('LOWER(vm_name)'), $lower)
            ->pluck('vm_name');

        // Names reserved by an in-flight sibling request (Pending or Approved). Closes the window where
        // two same-named requests could both be submitted before either provisions — a footgun that
        // would later create two Proxmox VMs sharing a hostname.
        $reserved = $this->reservedNames($ignoreRequestId, ['Pending', 'Approved']);
        $reservedHits = collect($lower)->filter(fn ($l) => isset($reserved[$l]))->map(fn ($l) => $reserved[$l]);

        $taken = $live->merge($reservedHits)->unique()->sort()->values();

        if ($taken->isNotEmpty()) {
            $this->audit->log($actor, 'PROVISION_BLOCKED', "Submit refused: VM name(s) {$taken->implode(', ')} already in use or pending", null, ['vm_name' => $data['vm_name'] ?? null, 'conflicts' => $taken->all()]);
            throw ValidationException::withMessages([
                'vm_name' => 'A VM named '.$taken->implode(', ').' already exists or has a pending request. Pick a different name.',
            ]);
        }
    }

    /**
     * Names reserved by in-flight sibling PROVISION requests, keyed lower => display. A request is
     * "in-flight" when its approval sits in one of $statuses (Pending reserves at submit; Approved
     * covers the brief window between approve and the inventory row landing). Batch names expand to
     * -01..-0N so a single submit can't slip into a reserved batch slot. Excludes $ignoreRequestId.
     */
    private function reservedNames(?int $ignoreRequestId, array $statuses): array
    {
        $rows = ProvisionRequest::query()
            ->join('approval_requests', function ($j) {
                $j->on('approval_requests.reference_id', '=', 'provision_requests.id')
                    ->where('approval_requests.request_type', '=', 'PROVISION');
            })
            ->whereIn('approval_requests.status', $statuses)
            ->when($ignoreRequestId, fn ($q) => $q->where('provision_requests.id', '!=', $ignoreRequestId))
            ->get(['provision_requests.vm_name', 'provision_requests.instance_count']);

        $names = [];
        foreach ($rows as $row) {
            foreach ($this->targetNames($row->vm_name, (int) $row->instance_count) as $n) {
                $names[strtolower($n)] = $n;
            }
        }

        return $names;
    }

    /**
     * Approve-time gate: the names this request would create that ALREADY collide with a live VM or a
     * sibling request that is itself already Approved. Pending siblings are intentionally NOT counted —
     * of two same-named Pending requests the first must stay approvable; the second collides here once
     * the first is Approved/live. Returns display names (empty = clear to approve).
     */
    public function conflictingNamesForApproval(ProvisionRequest $pr): Collection
    {
        $lower = array_map('strtolower', $this->targetNames($pr->vm_name, (int) $pr->instance_count));

        $live = Inventory::query()
            ->whereNotIn('status', ['Deleted'])
            ->whereIn(DB::raw('LOWER(vm_name)'), $lower)
            ->pluck('vm_name');

        $reserved = $this->reservedNames($pr->id, ['Approved']);
        $reservedHits = collect($lower)->filter(fn ($l) => isset($reserved[$l]))->map(fn ($l) => $reserved[$l]);

        return $live->merge($reservedHits)->unique()->sort()->values();
    }

    /** Node-centric policy check: provider/node/tier ∈ env; catalog/network/datastore Active & on the node. */
    private function validatePolicy(Environment $env, Node $node, array $data, User $actor): void
    {
        $errors = [];

        if ($env->status !== 'Active') {
            $errors['environment_id'] = 'Environment is not active.';
        }

        $provider = Provider::find($data['provider_id']);
        if (! $env->providers->contains('id', (int) $data['provider_id'])) {
            $errors['provider_id'] = 'Provider is not allowed in this environment.';
        } elseif (! $provider || $provider->status !== 'Connected') {
            $errors['provider_id'] = 'Provider is not connected.';
        }

        if (! $env->nodes->contains('id', $node->id)) {
            $errors['node_id'] = 'Node is not allowed in this environment.';
        } elseif ($node->effectiveStatus() !== 'Active') {
            $errors['node_id'] = 'Node is not active.';
        } elseif ((int) $node->provider_id !== (int) $data['provider_id']) {
            $errors['node_id'] = 'Node does not belong to the selected provider.';
        } elseif ($node->providerNode && $this->capacity->snapshot($node->providerNode)['provisioning_blocked']) {
            $errors['node_id'] = 'Node is at critical capacity and blocked for provisioning by an administrator.';
            $this->audit->log($actor, 'PROVISION_BLOCKED', "Submit refused for {$data['vm_name']}: node \"{$node->node_name}\" at critical capacity (hard-block enabled)", null, ['vm_name' => $data['vm_name'] ?? null, 'node' => $node->node_name]);
        }

        $tier = Tier::find($data['tier_id']);
        if (! $env->tiers->contains('id', (int) $data['tier_id'])) {
            $errors['tier_id'] = 'Tier is not allowed in this environment.';
        } elseif (! $tier || $tier->status !== 'Active') {
            $errors['tier_id'] = 'Tier is not active.';
        }

        $pnid = $node->provider_node_id;
        $this->checkNodeResource($errors, 'catalog_id', 'Catalog', Catalog::find($data['catalog_id']), $pnid);
        $this->checkNodeResource($errors, 'network_id', 'Network', Network::find($data['network_id']), $pnid);
        $this->checkNodeResource($errors, 'datastore_id', 'Datastore', Datastore::find($data['datastore_id']), $pnid);

        if ($errors) {
            throw ValidationException::withMessages($errors);
        }
    }

    /** A published catalog/network/datastore must be Active and live on the chosen node. */
    private function checkNodeResource(array &$errors, string $key, string $label, $resource, ?int $providerNodeId): void
    {
        if (! $resource) {
            $errors[$key] = "{$label} not found.";
        } elseif ($resource->effectiveStatus() !== 'Active') {
            $errors[$key] = "{$label} is not active.";
        } elseif ((int) $resource->provider_node_id !== (int) $providerNodeId) {
            $errors[$key] = "{$label} is not on the selected node.";
        }
    }
}
