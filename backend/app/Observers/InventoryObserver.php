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
        if ($inventory->wasChanged('status')) {
            VmStateChanged::dispatch($inventory, $inventory->getOriginal('status'), $inventory->status);
        }
    }
}
