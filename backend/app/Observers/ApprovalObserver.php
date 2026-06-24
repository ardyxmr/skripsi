<?php

namespace App\Observers;

use App\Events\ApprovalChanged;
use App\Models\ApprovalRequest;

/**
 * Emits ApprovalChanged on create + status transition — the approvals twin of InventoryObserver,
 * so a new request or an approve/reject/revert pushes to the requester + all privileged users.
 */
class ApprovalObserver
{
    public function created(ApprovalRequest $approval): void
    {
        ApprovalChanged::dispatch($approval, null, $approval->status);
    }

    public function updated(ApprovalRequest $approval): void
    {
        if ($approval->wasChanged('status')) {
            ApprovalChanged::dispatch($approval, $approval->getOriginal('status'), $approval->status);
        }
    }
}
