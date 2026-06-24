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
        if (! $vm) {
            return;
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
