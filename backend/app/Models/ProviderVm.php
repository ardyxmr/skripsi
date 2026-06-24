<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProviderVm extends Model
{
    protected $guarded = [];

    // Resolve the parent node so the Discovery Explorer VMs tab can show the Node column
    // (provider_vms stores only provider_node_id — no denormalized node_name like the other tables).
    protected $appends = ['node_name'];

    protected $casts = [
        'disks_json' => 'array',
        'cpu_utilization' => 'float',
        'last_sync_at' => 'datetime',
    ];

    public function providerNode(): BelongsTo
    {
        return $this->belongsTo(ProviderNode::class);
    }

    public function getNodeNameAttribute(): ?string
    {
        return $this->providerNode?->node_name;
    }
}
