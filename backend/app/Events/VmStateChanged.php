<?php

namespace App\Events;

use App\Models\Inventory;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired whenever an inventory VM's governance status transitions (Provisioning → Active,
 * Active → Updating → Active, Active → Deleting → Deleted, → Failed, …). Dispatched from
 * InventoryObserver, so EVERY status change — wherever it originates (jobs, lifecycle
 * service, controllers) — emits exactly one event, then broadcasts it (Phase 5 / 1c).
 *
 * Queued broadcast (ShouldBroadcast, not …Now) so a down/slow Reverb can never break a
 * provision/resize/delete — the broadcast fails in isolation on the queue.
 */
class VmStateChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Inventory $inventory,
        public ?string $previousStatus,
        public string $currentStatus,
    ) {}

    /**
     * Mirror the Inventory read-ACL exactly (defence in depth — the client still refetches the
     * RBAC-scoped rows): the owner (user.{id}); the manager of the owner's group, routed to THAT
     * manager's own user channel so managers need no group-channel knowledge; and all
     * Administrators via the presence channel.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('user.'.$this->inventory->owner_user_id),
            new PresenceChannel('role.admin'),
        ];

        $managerId = $this->inventory->owner?->group?->manager_user_id;
        if ($managerId && (int) $managerId !== (int) $this->inventory->owner_user_id) {
            $channels[] = new PrivateChannel('user.'.$managerId);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'vm.state';
    }

    /** Minimal signal — the client refetches the scoped row(s); this just says "something changed". */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->inventory->id,
            'status' => $this->currentStatus,
            'previous' => $this->previousStatus,
        ];
    }
}
