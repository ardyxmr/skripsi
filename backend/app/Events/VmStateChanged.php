<?php

namespace App\Events;

use App\Models\Inventory;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired whenever an inventory VM's governance status transitions (Provisioning → Active,
 * Active → Updating → Active, Active → Deleting → Deleted, → Failed, …). Dispatched from
 * InventoryObserver, so EVERY status change — wherever it originates (jobs, lifecycle
 * service, controllers) — emits exactly one event.
 *
 * This is the deliberate "push-ready" seam (Phase 1 keeps the UI poll-based). To turn it
 * into real-time push later, make this class `implements ShouldBroadcast`, add
 * `InteractsWithSockets`, and define `broadcastOn()` (e.g. a per-owner private channel) +
 * `broadcastWith()` (id, status, ip, observed_power_state). No call sites change — only
 * this class — because the observer already emits it everywhere.
 */
class VmStateChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Inventory $inventory,
        public ?string $previousStatus,
        public string $currentStatus,
    ) {}
}
