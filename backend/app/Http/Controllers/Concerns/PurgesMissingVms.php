<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Inventory;
use App\Models\ProviderVm;

/**
 * A VM flagged `Missing` (gone from the hypervisor, detected by VmFactSyncService during discovery)
 * can no longer be managed via Terraform, yet its inventory row still references its catalog/network/
 * datastore/node/provider — which would block deleting those resources. Purge those orphan rows so
 * resource deletion is unblocked, then the caller's live-VM guard only sees real, manageable VMs.
 */
trait PurgesMissingVms
{
    /** Hard-delete Missing VM rows referencing $column = $id (with their disks + the stale discovered
     *  provider_vms row shown in the Explorer). Returns the count purged. */
    protected function purgeMissingVms(string $column, int $id): int
    {
        $purged = 0;
        Inventory::where($column, $id)->where('status', 'Missing')->get()->each(function (Inventory $vm) use (&$purged) {
            $this->purgeMissingVmRow($vm);
            $purged++;
        });

        return $purged;
    }

    /**
     * Hard-remove a single Missing inventory VM everywhere it lingers: its disks, the discovered
     * provider_vms row (so it disappears from the Discovery/Node Explorer too — the VM is truly
     * gone), and the inventory row itself.
     */
    protected function purgeMissingVmRow(Inventory $vm): void
    {
        if ($vm->provider_id && $vm->external_vmid) {
            ProviderVm::where('provider_id', $vm->provider_id)->where('external_vmid', $vm->external_vmid)->delete();
        }
        $vm->disks()->delete();
        $vm->delete();
    }
}
