<?php

namespace App\Models;

use App\Observers\ApprovalObserver;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ObservedBy([ApprovalObserver::class])]
#[Fillable([
    'request_type', 'reference_id', 'requester_id', 'approver_id', 'group_id',
    'payload', 'status', 'action_type', 'action_reason', 'action_date',
])]
class ApprovalRequest extends Model
{
    protected $casts = ['action_date' => 'datetime', 'payload' => 'array'];

    // Lifecycle approvals (RENEWAL/PERMANENT/RESIZE/DESTROY) reference an inventory row.
    public function inventory(): BelongsTo
    {
        return $this->belongsTo(Inventory::class, 'reference_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    // Resolve the underlying PROVISION request (the only referenced type in Stage 5).
    public function provisionRequest(): ?ProvisionRequest
    {
        return $this->request_type === 'PROVISION'
            ? ProvisionRequest::find($this->reference_id)
            : null;
    }
}
