<?php

namespace App\Observers;

use App\Events\VmStateChanged;
use App\Models\Inventory;

/**
 * Centralises VmStateChanged emission. Because it hangs off Eloquent's model events, ANY
 * code path that changes inventory.status (provisioning/lifecycle jobs, the lifecycle
 * service, controllers) emits exactly one event — no scattered manual dispatches to keep
 * in sync.
 */
class InventoryObserver
{
    public function created(Inventory $inventory): void
    {
        VmStateChanged::dispatch($inventory, null, $inventory->status);
    }

    public function updated(Inventory $inventory): void
    {
        // Broadcast on a governance status change OR an observed_power_state flip. The latter is an
        // OUT-OF-BAND change (someone stopped/started the VM in Proxmox) that the discovery sweep
        // detects — and since the UI derives Running/Stopped from observed_power_state, we push it so
        // the frontend updates instantly instead of waiting for its next poll. `wasChanged` is only
        // true on an actual flip, so the steady per-sweep fact mirror (cpu/ram/last_sync) won't spam.
        if ($inventory->wasChanged('status') || $inventory->wasChanged('observed_power_state')) {
            VmStateChanged::dispatch($inventory, $inventory->getOriginal('status'), $inventory->status);
        }
    }
}
