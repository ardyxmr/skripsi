<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\Provider;
use App\Models\ProviderVm;

/**
 * Mirrors provider-sourced runtime facts (discovery → provider_vms) into an inventory
 * row by external_vmid (04-backend-services.md §2.3a). The lifecycle layer never calls
 * the provider directly; it reads only what discovery has already written.
 */
class VmFactSyncService
{
    public function __construct(private AuditService $audit) {}

    public function sync(Inventory $inv): void
    {
        if (! $inv->external_vmid || ! $inv->provider_id) {
            return;
        }

        $vm = ProviderVm::where('provider_id', $inv->provider_id)
            ->where('external_vmid', $inv->external_vmid)
            ->first();

        // The VM is gone from the hypervisor when discovery either has NO row for its vmid, OR keeps
        // the row but flagged it Missing. DiscoveryService never deletes — it sets provider_vms
        // discovered_status='Missing' for anything absent in a run (this is exactly what the
        // Discovery/Node Explorer shows). Both mean the underlying Proxmox VM no longer exists — e.g.
        // a portal-created VM deleted directly in Proxmox.
        if (! $vm || $vm->discovered_status === 'Missing') {
            // Trust this only when the provider is Connected (so provider_vms is authoritative for
            // this run): an Active VM that's gone was destroyed out-of-band → flag it Missing so it
            // stops blocking resource deletion and can be purged. Transient states
            // (Provisioning/Updating/Deleting) are left alone.
            if ($inv->status === 'Active' && $inv->provider?->status === 'Connected') {
                $this->audit->log(null, 'VM_MISSING', "VM {$inv->vm_name} (vmid {$inv->external_vmid}) not found on the hypervisor — flagged Missing (destroyed out-of-band).");
                $inv->update(['status' => 'Missing']);
            }

            return;
        }

        // The VM is present + Active on the hypervisor. A VM previously flagged Missing has
        // reappeared → restore it to Active.
        if ($inv->status === 'Missing') {
            $inv->update(['status' => 'Active']);
        }

        $previousPower = $inv->observed_power_state;   // snapshot before we overwrite it

        // IP is a RUNTIME fact — valid only while the VM is running (Proxmox can't read it once
        // stopped). Clear it when not running so the DB mirrors the provider exactly; keep the
        // last-known IP only if a RUNNING VM momentarily can't report one (guest-agent lag).
        $running = $vm->power_state === 'running';
        $ip = $running ? ($vm->ip_address ?? $inv->ip_address) : null;

        // Out-of-band shutdown detection: a governed (Active) VM going running → stopped was NOT
        // initiated from the portal (no power-control feature yet, and portal ops set Updating/
        // Deleting), so record it with a null/system actor → "Unknown" status in the audit trail.
        if ($previousPower === 'running' && ($vm->power_state ?? null) === 'stopped' && $inv->status === 'Active') {
            $this->audit->log(null, 'POWER_OFF', "VM {$inv->vm_name} (vmid {$inv->external_vmid}) powered off — detected out-of-band (not initiated from the portal)");
        }

        $inv->update([
            'ip_address' => $ip,
            'observed_power_state' => $vm->power_state ?? 'unknown',
            // Config/allocation facts — Proxmox still reports these when stopped, so keep last-known.
            'vcpu' => $vm->vcpu ?? $inv->vcpu,
            'ram_mb' => $vm->ram_mb ?? $inv->ram_mb,
            'disk_allocated_gb' => $vm->disk_allocated_gb ?? $inv->disk_allocated_gb,
            // Runtime utilization — already overwrites (0/null when stopped).
            'cpu_utilization' => $vm->cpu_utilization,
            'ram_usage_mb' => $vm->ram_usage_mb,
            'last_sync_at' => now(),
        ]);
    }

    /** Mirror every live inventory VM for one provider (call right after a discovery run). */
    public function syncProvider(Provider $provider): void
    {
        Inventory::where('provider_id', $provider->id)
            ->whereNotIn('status', ['Deleted'])->whereNotNull('external_vmid')
            ->each(fn (Inventory $inv) => rescue(fn () => $this->sync($inv)));
    }
}
