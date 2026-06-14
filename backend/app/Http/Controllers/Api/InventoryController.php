<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProvisionVmJob;
use App\Models\ApprovalRequest;
use App\Models\Group;
use App\Models\Inventory;
use App\Models\InventoryDisk;
use App\Models\User;
use App\Services\AuditService;
use App\Services\LifecycleService;
use App\Services\VmFactSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Inventory reads + lifecycle (Stage 7). Reads are RBAC-scoped (07-api-contract §9):
 * User → own VMs; Manager → own + members of groups they manage; Admin → all.
 * sync/retry are immediate; renew/permanent/resize/delete route through LifecycleService.
 */
class InventoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // A destroyed VM keeps its row (ADR-08) but drops off the listing after the retention window.
        $cutoff = now()->subMinutes((int) config('provisioning.deleted_retention_minutes', 5));
        $rows = $this->scopedQuery($request->user())
            ->whereNot(fn ($q) => $q->where('status', 'Deleted')
                ->where(fn ($w) => $w->whereNull('destroyed_at')->orWhere('destroyed_at', '<', $cutoff)))
            ->with(['owner', 'environment', 'provider', 'node', 'catalog', 'tier', 'disks', 'pendingApprovals'])
            ->orderByDesc('id')->get();

        return response()->json($rows->map(fn (Inventory $i) => $this->transform($i)));
    }

    public function show(Request $request, Inventory $inventory): JsonResponse
    {
        $this->authorizeView($request->user(), $inventory);

        return response()->json($this->transform(
            $inventory->load(['owner', 'environment', 'provider', 'node', 'catalog', 'tier', 'disks', 'pendingApprovals'])
        ));
    }

    // Global Inventory sync: mirror the latest discovered facts (provider_vms) into EVERY VM the
    // user can see — DB ONLY. Proxmox is talked to in exactly one place (the discovery layer, driven
    // from Provider Management + the scheduled discovery:refresh); Inventory only reads the DB. These
    // are cheap local UPDATEs so it runs synchronously — chunked + rescued so one bad row can't abort
    // the batch. Returns the refreshed scoped list (same shape as index) for a one-round-trip UI update.
    public function syncAll(Request $request, VmFactSyncService $facts, AuditService $audit): JsonResponse
    {
        $this->scopedQuery($request->user())
            ->whereNotIn('status', ['Deleted'])->whereNotNull('external_vmid')
            ->chunkById(200, fn ($rows) => $rows->each(fn (Inventory $inv) => rescue(fn () => $facts->sync($inv))));

        $audit->log($request->user(), 'SYNC_INVENTORY', 'Synced all visible VMs from the latest provider snapshot');

        $cutoff = now()->subMinutes((int) config('provisioning.deleted_retention_minutes', 5));
        $rows = $this->scopedQuery($request->user())
            ->whereNot(fn ($q) => $q->where('status', 'Deleted')
                ->where(fn ($w) => $w->whereNull('destroyed_at')->orWhere('destroyed_at', '<', $cutoff)))
            ->with(['owner', 'environment', 'provider', 'node', 'catalog', 'tier', 'disks', 'pendingApprovals'])
            ->orderByDesc('id')->get();

        return response()->json($rows->map(fn (Inventory $i) => $this->transform($i)));
    }

    // Re-run a Failed provision in the SAME workspace (ADR-08), reusing this row.
    public function retry(Request $request, Inventory $inventory, AuditService $audit): JsonResponse
    {
        $this->authorizeView($request->user(), $inventory);

        if ($inventory->status !== 'Failed') {
            abort(422, 'Only failed VMs can be retried.');
        }
        if (! $inventory->provision_request_id) {
            abort(422, 'No originating request to retry.');
        }

        ProvisionVmJob::dispatch($inventory->provision_request_id, $inventory->vm_name, $inventory->id);
        $audit->log($request->user(), 'RETRY_PROVISION', "Retried provisioning {$inventory->vm_name}");

        return response()->json(['queued' => true]);
    }

    // ---- Mutating lifecycle actions (respect env.approval_required via LifecycleService) ----

    public function renew(Request $request, Inventory $inventory, LifecycleService $lifecycle): JsonResponse
    {
        $this->authorizeActionable($request->user(), $inventory);
        $data = $request->validate(['description' => ['nullable', 'string'], 'extension_period' => ['nullable', 'string']]);

        return response()->json($lifecycle->request(
            $inventory, 'RENEWAL', ['extension_period' => $data['extension_period'] ?? '7 Days'],
            $data['description'] ?? 'Renewal requested', $request->user(),
        ), 202);
    }

    public function permanent(Request $request, Inventory $inventory, LifecycleService $lifecycle): JsonResponse
    {
        $this->authorizeActionable($request->user(), $inventory);
        $data = $request->validate(['description' => ['nullable', 'string']]);

        return response()->json($lifecycle->request(
            $inventory, 'PERMANENT', [], $data['description'] ?? 'Permanent retention requested', $request->user(),
        ), 202);
    }

    public function resize(Request $request, Inventory $inventory, LifecycleService $lifecycle): JsonResponse
    {
        $this->authorizeActionable($request->user(), $inventory);
        $data = $request->validate([
            'cpu' => ['nullable', 'integer', 'min:1'],
            'ram_mb' => ['nullable', 'integer', 'min:1'],
            'vm_name_confirmation' => ['required', 'string'],
        ]);
        if (($data['cpu'] ?? null) === null && ($data['ram_mb'] ?? null) === null) {
            abort(422, 'Provide a new cpu and/or ram_mb.');
        }
        $this->assertNameConfirmed($data['vm_name_confirmation'], $inventory);

        return response()->json($lifecycle->request(
            $inventory, 'RESIZE', ['cpu' => $data['cpu'] ?? null, 'ram_mb' => $data['ram_mb'] ?? null],
            'Resize requested', $request->user(),
        ), 202);
    }

    // Unified "Edit Resources" — bundles a CPU/RAM resize and/or data-disk adds into ONE approval +
    // ONE terraform apply (all hotplug, no reboot). The modal submits this single request instead of
    // a separate resize + add-disk. Payload: { cpu?, ram_mb?, disks: [{size_gb, setup_description}] }.
    public function editResources(Request $request, Inventory $inventory, LifecycleService $lifecycle): JsonResponse
    {
        $this->authorizeActionable($request->user(), $inventory);
        abort_unless($inventory->status === 'Active', 422, 'Resources can only be edited on an Active VM.');

        $data = $request->validate([
            'cpu' => ['nullable', 'integer', 'min:1'],
            'ram_mb' => ['nullable', 'integer', 'min:1'],
            'disks' => ['nullable', 'array'],
            'disks.*.size_gb' => ['required_with:disks', 'integer', 'min:1'],
            'disks.*.setup_description' => ['nullable', 'string'],
            'vm_name_confirmation' => ['required', 'string'],
        ]);
        $this->assertNameConfirmed($data['vm_name_confirmation'], $inventory);

        $disks = $data['disks'] ?? [];
        if (($data['cpu'] ?? null) === null && ($data['ram_mb'] ?? null) === null && empty($disks)) {
            abort(422, 'Provide a CPU/RAM change and/or at least one data disk.');
        }

        // Data-disk gate + capacity pre-check (mirrors addDisk; the job re-checks the cap serially).
        if (! empty($disks)) {
            abort_unless((bool) $inventory->environment?->allow_data_disk, 403, 'Data disks are not permitted in this environment.');
            $ceiling = (int) ($inventory->environment?->max_data_disks ?? 0);
            $used = $inventory->disks()->where('disk_index', '>', 0)->count()
                + ApprovalRequest::whereIn('request_type', ['ADD_DISK', 'EDIT_RESOURCES'])
                    ->where('reference_id', $inventory->id)->where('status', 'Pending')->count();
            abort_if($used + count($disks) > $ceiling, 422,
                "Environment '{$inventory->environment?->environment_name}' allows at most {$ceiling} data disk(s) ({$used}/{$ceiling} used).");
        }

        $payload = array_filter([
            'cpu' => $data['cpu'] ?? null,
            'ram_mb' => $data['ram_mb'] ?? null,
            'disks' => empty($disks) ? null : array_map(
                fn ($d) => ['size_gb' => (int) $d['size_gb'], 'setup_description' => $d['setup_description'] ?? null],
                $disks,
            ),
        ], fn ($v) => $v !== null);

        return response()->json($lifecycle->request(
            $inventory, 'EDIT_RESOURCES', $payload, $data['description'] ?? 'Edit resources requested', $request->user(),
        ), 202);
    }

    public function destroyVm(Request $request, Inventory $inventory, LifecycleService $lifecycle): JsonResponse
    {
        $this->authorizeActionable($request->user(), $inventory);
        $data = $request->validate(['vm_name_confirmation' => ['required', 'string']]);
        $this->assertNameConfirmed($data['vm_name_confirmation'], $inventory);

        return response()->json($lifecycle->request(
            $inventory, 'DESTROY', [], 'Delete requested', $request->user(),
        ), 202);
    }

    // Attach a RAW data disk — only when the VM's environment permits it (allow_data_disk → else 403).
    // Routes through the approval engine like other lifecycle changes (ADR-11/16); existing disks
    // are never modified or shrunk, only a new one is added.
    public function addDisk(Request $request, Inventory $inventory, LifecycleService $lifecycle): JsonResponse
    {
        $this->authorizeActionable($request->user(), $inventory);
        abort_unless((bool) $inventory->environment?->allow_data_disk, 403, 'Data disks are not permitted in this environment.');
        abort_unless($inventory->status === 'Active', 422, 'Data disks can only be added to an Active VM.');

        // Per-environment policy cap (ADR-18). Count existing data disks + any in-flight ADD_DISK
        // approvals so parallel requests can't both slip under the limit.
        $ceiling = (int) ($inventory->environment?->max_data_disks ?? 0);
        $used = $inventory->disks()->where('disk_index', '>', 0)->count()
            + ApprovalRequest::where('request_type', 'ADD_DISK')
                ->where('reference_id', $inventory->id)->where('status', 'Pending')->count();
        abort_if($used >= $ceiling, 422,
            "Environment '{$inventory->environment?->environment_name}' allows at most {$ceiling} data disk(s) ({$used}/{$ceiling} used).");

        $data = $request->validate([
            'size_gb' => ['required', 'integer', 'min:1'],
            'setup_description' => ['nullable', 'string'],
            'vm_name_confirmation' => ['required', 'string'],
        ]);
        $this->assertNameConfirmed($data['vm_name_confirmation'], $inventory);

        return response()->json($lifecycle->request(
            $inventory, 'ADD_DISK',
            ['size_gb' => $data['size_gb'], 'setup_description' => $data['setup_description'] ?? null],
            'Add data disk requested', $request->user(),
        ), 202);
    }

    // Admin marks a Pending-Setup data disk Ready after formatting/mounting it in-guest (the
    // manual half of ADR-16). Optionally records the mount point / filesystem the admin set up.
    public function completeDisk(Request $request, Inventory $inventory, InventoryDisk $disk, AuditService $audit): JsonResponse
    {
        abort_unless($request->user()->role?->role_name === 'Administrator', 403, 'Only administrators can complete disk setup.');
        abort_if($disk->inventory_id !== $inventory->id, 404, 'Disk not found on this VM.');
        abort_if($disk->is_primary || $disk->disk_index === 0, 422, 'The boot disk does not require setup.');

        $data = $request->validate([
            'mount_point' => ['nullable', 'string'],
            'fs_type' => ['nullable', 'string'],
        ]);

        $disk->update(array_filter([
            'mount_point' => $data['mount_point'] ?? null,
            'fs_type' => $data['fs_type'] ?? null,
        ], fn ($v) => $v !== null) + ['setup_status' => 'Ready']);

        $audit->log($request->user(), 'ADD_DISK', "Marked data disk (scsi{$disk->disk_index}) Ready on {$inventory->vm_name}");

        return response()->json(['disk' => [
            'id' => $disk->id,
            'disk_index' => $disk->disk_index,
            'size_gb' => $disk->size_gb,
            'is_primary' => $disk->is_primary,
            'mount_point' => $disk->mount_point,
            'fs_type' => $disk->fs_type,
            'setup_status' => $disk->setup_status,
        ]]);
    }

    private function assertNameConfirmed(string $confirmation, Inventory $inventory): void
    {
        abort_if($confirmation !== $inventory->vm_name, 422, 'VM name confirmation does not match.');
    }

    private function authorizeActionable(User $user, Inventory $inventory): void
    {
        $this->authorizeView($user, $inventory);
        abort_if(in_array($inventory->status, ['Deleted'], true), 422, 'This VM is deleted.');
    }

    // ---- RBAC scoping ----

    /** Returns a query already filtered to what $user may see. */
    private function scopedQuery(User $user)
    {
        $ownerIds = $this->visibleOwnerIds($user);

        return Inventory::query()->when($ownerIds !== null, fn ($q) => $q->whereIn('owner_user_id', $ownerIds));
    }

    /** null = all (Admin); otherwise the owner ids this user may see. */
    private function visibleOwnerIds(User $user): ?array
    {
        $role = $user->role?->role_name;
        if ($role === 'Administrator') {
            return null;
        }
        if ($role === 'Manager') {
            $managedGroupIds = Group::where('manager_user_id', $user->id)->pluck('id');
            $memberIds = User::whereIn('group_id', $managedGroupIds)->pluck('id')->all();

            return array_values(array_unique([...$memberIds, $user->id]));
        }

        return [$user->id]; // User → own only
    }

    private function authorizeView(User $user, Inventory $inventory): void
    {
        $ownerIds = $this->visibleOwnerIds($user);
        abort_if($ownerIds !== null && ! in_array($inventory->owner_user_id, $ownerIds, true), 404, 'Not found.');
    }

    private function transform(Inventory $i): array
    {
        return [
            'id' => $i->id,
            'vm_name' => $i->vm_name,
            'owner_name' => $i->owner?->name,
            'environment_name' => $i->environment?->environment_name,
            'allow_data_disk' => (bool) $i->environment?->allow_data_disk,   // gates the add-disk UI
            'max_data_disks' => (int) ($i->environment?->max_data_disks ?? 0), // policy cap for used/max display
            'provider_name' => $i->provider?->provider_name,
            'node_name' => $i->node?->node_name,
            'catalog_name' => $i->catalog?->catalog_name,
            'tier_name' => $i->tier?->tier_name,
            'status' => $i->status,                              // portal lifecycle
            'observed_power_state' => $i->observed_power_state,  // provider-synced
            'ip_address' => $i->ip_address,
            'external_vmid' => $i->external_vmid,
            'vcpu' => $i->vcpu,
            'ram_mb' => $i->ram_mb,
            'disk_allocated_gb' => $i->disk_allocated_gb,
            'cpu_utilization' => $i->cpu_utilization,
            'ram_usage_mb' => $i->ram_usage_mb,
            'security_hardening' => $i->security_hardening,
            'hardening_status' => $i->hardening_status,
            'is_permanent' => $i->is_permanent,
            'expiry_date' => $i->expiry_date,
            // Environment expiry policy → lets the renew modal cap the extension to (now + window).
            'expiry_type' => $i->environment?->expiry_type,
            'expiry_value' => $i->environment?->expiry_value,
            // Pending lifecycle approvals on this VM → "Waiting approval (…)" badge in Inventory.
            'pending_actions' => $i->pendingApprovals->pluck('request_type')->unique()->values(),
            'grace_period_until' => $i->grace_period_until,
            'error_message' => $i->error_message,
            'last_sync_at' => $i->last_sync_at,
            'updated_at' => $i->updated_at,
            'disks' => $i->disks->map(fn ($d) => [
                'id' => $d->id,
                'disk_index' => $d->disk_index,
                'size_gb' => $d->size_gb,
                'is_primary' => $d->is_primary,
                'mount_point' => $d->mount_point,
                'fs_type' => $d->fs_type,
                'setup_status' => $d->setup_status,
            ])->values(),
        ];
    }
}
