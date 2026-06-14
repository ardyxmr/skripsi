<?php

namespace App\Events;

use App\Models\ApprovalRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when an approval request is created or changes status (Pending → Approved/Rejected/
 * Reverted). Dispatched from ApprovalObserver. The inventory side got its broadcast seam in
 * Phase 1; this gives approvals the same treatment so the Approvals table pushes too.
 */
class ApprovalChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ApprovalRequest $approval,
        public ?string $previousStatus,
        public string $currentStatus,
    ) {}

    /**
     * Mirror the Approval read-ACL: the requester (user.{id}) + ALL privileged users — Managers and
     * Admins both see every approval (ApprovalController scopes `isPrivileged → all`), so they share
     * one `role.privileged` channel rather than group-scoped channels.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.'.$this->approval->requester_id),
            new PrivateChannel('role.privileged'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'approval.changed';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->approval->id,
            'status' => $this->currentStatus,
            'previous' => $this->previousStatus,
            'request_type' => $this->approval->request_type,
        ];
    }
}
