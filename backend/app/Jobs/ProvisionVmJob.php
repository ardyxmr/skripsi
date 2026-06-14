<?php

namespace App\Jobs;

use App\Models\Inventory;
use App\Models\InventoryDisk;
use App\Models\ProvisionRequest;
use App\Services\AuditService;
use App\Services\Discovery\DiscoveryService;
use App\Services\Provisioning\TerraformRunner;
use App\Services\Provisioning\WorkspaceService;
use App\Services\ResourceResolutionService;
use App\Services\VmFactSyncService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

/**
 * Provisions ONE VM (ADR-08 per-VM): own workspace, own state, own inventory row.
 * A batch request dispatches N of these, which run in parallel on the queue. No auto
 * retry (tries=1) — retry is an explicit Stage-7 lifecycle action that reuses the workspace.
 */
class ProvisionVmJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 1800;

    // $inventoryId set → retry: reuse that existing row + its workspace instead of creating a new one.
    public function __construct(public int $provisionRequestId, public string $vmName, public ?int $inventoryId = null) {}

    public function handle(
        ResourceResolutionService $resolver,
        WorkspaceService $workspaces,
        TerraformRunner $terraform,
        DiscoveryService $discovery,
        VmFactSyncService $facts,
        AuditService $audit,
    ): void {
        $pr = ProvisionRequest::with(['requester', 'provider', 'environment'])->find($this->provisionRequestId);
        if (! $pr) {
            return;
        }

        $resolved = $resolver->resolve($pr, $this->vmName, $pr->boot_disk_gb);
        $work = $workspaces->prepare($pr, $this->vmName, $resolved);

        // Expiry from the environment policy (lifetime/permanent → no expiry).
        $env = $pr->environment;
        $isPermanent = in_array($env?->expiry_type, ['lifetime', 'permanent'], true);
        $expiryDate = $isPermanent ? null : match ($env?->expiry_type) {
            'minutes' => now()->addMinutes((int) $env->expiry_value),
            'hours' => now()->addHours((int) $env->expiry_value),
            'days', 'custom' => now()->addDays((int) $env->expiry_value),
            default => now()->addDays((int) ($env->expiry_value ?? 30)),
        };

        // Retry reuses the existing row + workspace (ADR-08); first run pre-creates the row
        // (Provisioning) so a crash/timeout is still visible.
        if ($this->inventoryId) {
            $inv = Inventory::find($this->inventoryId);
            if (! $inv) {
                return;
            }
            $inv->update([
                'status' => 'Provisioning',
                'error_message' => null,
                'workspace_path' => $work['path'],
                'terraform_state_path' => $work['statePath'],
            ]);
        } else {
            $inv = Inventory::create([
                'provision_request_id' => $pr->id,
                'vm_name' => $this->vmName,
                'owner_user_id' => $pr->requester_id,
                'environment_id' => $pr->environment_id,
                'provider_id' => $pr->provider_id,
                'node_id' => $pr->node_id,
                'catalog_id' => $pr->catalog_id,
                'tier_id' => $pr->tier_id,
                'network_id' => $pr->network_id,
                'datastore_id' => $pr->datastore_id,
                'status' => 'Provisioning',
                'vcpu' => $resolved['vcpus'] ?? ($resolved['cores'] * $resolved['sockets']),
                'ram_mb' => $resolved['memory'],
                'disk_allocated_gb' => $resolved['disk_size_gb'],
                'security_hardening' => (bool) $pr->security_hardening,
                'hardening_status' => $pr->security_hardening ? 'Pending' : 'Not Requested',
                'expiry_date' => $expiryDate,
                'is_permanent' => $isPermanent,
                'workspace_path' => $work['path'],
                'terraform_state_path' => $work['statePath'],
            ]);
        }

        $result = $terraform->apply($work['path'], $pr->provider);

        if (! $result['ok']) {
            $inv->update([
                'status' => 'Failed',
                'error_message' => Str::limit("[{$result['step']}] ".$result['output'], 2000),
            ]);
            $audit->log($pr->requester, 'CREATE_VM', "Provision FAILED {$this->vmName} (step {$result['step']})");

            return;
        }

        $out = $terraform->outputs($work['path'], $pr->provider);
        $vmid = $out['vmid'] ?? null;

        $inv->update([
            'status' => 'Active',
            'external_vmid' => $vmid !== null ? (string) $vmid : null,
            'ip_address' => $out['default_ipv4'] ?? null,
        ]);

        InventoryDisk::firstOrCreate(
            ['inventory_id' => $inv->id, 'disk_index' => 0],
            ['size_gb' => $resolved['disk_size_gb'], 'is_primary' => true, 'setup_status' => 'Ready'],
        );

        // Scoped post-provision discovery → mirror IP/power into inventory.
        if ($vmid !== null) {
            try {
                $discovery->syncVm($pr->provider, $resolved['target_node'], (string) $vmid);
                $facts->sync($inv->fresh());
            } catch (\Throwable) {
                // facts will catch up on the next provider sync (Stage 7)
            }
        }

        $audit->log($pr->requester, 'CREATE_VM', "Provisioned {$this->vmName} (vmid {$vmid})");
    }
}
