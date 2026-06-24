<?php

namespace App\Jobs;

use App\Models\Inventory;
use App\Models\ProviderVm;
use App\Services\Discovery\DiscoveryService;
use App\Services\Discovery\ProviderSyncGuard;
use App\Services\Provisioning\WorkspaceService;
use App\Services\VmFactSyncService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Targeted, single-VM live sync — the "event-driven freshness" tier of the two-tier sync
 * model. A spec-changing job (provision/resize/edit/add-disk) dispatches this on completion
 * so the VM's runtime facts (status, IP, vCPU, RAM, disk, utilisation) are refreshed in the
 * DB immediately, instead of waiting for the periodic 30s reconciliation sweep.
 *
 * It hits the Proxmox API for ONE vmid only (DiscoveryService::syncVm), never a full
 * discovery. This is the third sanctioned live-API caller, alongside Provider Management and
 * the scheduled discovery:refresh sweep.
 *
 * BOUNDED IP FOLLOW-UP: a cloud-init VM only reports its IP via the guest agent AFTER it
 * boots, so a single post-apply sync usually misses it. When the VM is running but still has
 * no IP, this job re-queues itself (delayed) a few times until the IP lands or the attempt
 * ceiling is hit — then the periodic reconciliation sweep owns it. Scoped to one VM and
 * time-bounded, so it never stampedes the Proxmox API.
 */
class SyncVmFactsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 120;

    public function __construct(
        public int $inventoryId,
        public int $attempt = 1,
        public int $maxAttempts = 6,   // ~6 × 5s ≈ 30s of IP-chasing, then the sweep takes over
        public int $delaySeconds = 5,
    ) {
        // Light fact-sync runs on the dedicated `system` queue (own worker) so it never queues
        // behind heavy Terraform provisioning jobs on `default`. See scripts/backend.sh worker_sys.
        $this->onQueue('system');
    }

    public function handle(DiscoveryService $discovery, VmFactSyncService $facts, WorkspaceService $workspaces, ProviderSyncGuard $guard): void
    {
        $vm = Inventory::with('provider')->find($this->inventoryId);
        if (! $vm || ! $vm->provider || ! $vm->external_vmid) {
            return;
        }
        // A destroyed/in-destruction VM has nothing to refresh.
        if (in_array($vm->status, ['Deleted', 'Deleting'], true)) {
            return;
        }

        $node = $this->resolveNode($vm, $workspaces);
        if (! $node) {
            return;
        }

        // Circuit breaker: don't chase facts against a provider that's in cooldown — drop the chain
        // (the periodic sweep resumes once the breaker closes).
        if (! $guard->providerAvailable($vm->provider_id)) {
            return;
        }

        // Throttle: collapse duplicate triggers — if a sync ran for this VM within the throttle
        // window, that chain owns the follow-up, so this one bows out.
        if (! $guard->shouldSyncVm($vm->provider_id, (string) $vm->external_vmid)) {
            return;
        }

        try {
            $discovery->syncVm($vm->provider, $node, (string) $vm->external_vmid);
            $facts->sync($vm->fresh());
        } catch (\Throwable) {
            // Provider unreachable — leave it to the periodic reconciliation sweep (circuit-breaker
            // friendly: we don't keep retrying a dead host from here).
            return;
        }

        // Bounded IP follow-up: keep chasing only while the VM is running and still IP-less.
        $vm->refresh();
        $needsIp = $vm->observed_power_state === 'running' && empty($vm->ip_address);
        if ($needsIp && $this->attempt < $this->maxAttempts) {
            self::dispatch($this->inventoryId, $this->attempt + 1, $this->maxAttempts, $this->delaySeconds)
                ->delay(now()->addSeconds($this->delaySeconds));
        }
    }

    /** Raw Proxmox node name for the VM: prefer the workspace's resolved target_node, then fall back. */
    private function resolveNode(Inventory $vm, WorkspaceService $workspaces): ?string
    {
        if ($vm->workspace_path && is_dir($vm->workspace_path)) {
            $resolved = $workspaces->readResolved($vm->workspace_path);
            if (! empty($resolved['target_node'])) {
                return $resolved['target_node'];
            }
        }

        $pv = ProviderVm::where('provider_id', $vm->provider_id)
            ->where('external_vmid', $vm->external_vmid)
            ->first();

        return $pv?->node_name ?? $vm->node?->providerNode?->node_name;
    }
}
