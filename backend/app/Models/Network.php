<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['network_name', 'description', 'provider_id', 'provider_node_id', 'provider_network_id', 'status', 'created_by'])]
class Network extends Model
{
    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }

    public function providerNode(): BelongsTo
    {
        return $this->belongsTo(ProviderNode::class);
    }

    public function providerNetwork(): BelongsTo
    {
        return $this->belongsTo(ProviderNetwork::class);
    }

    public function effectiveStatus(): string
    {
        if ($this->providerNetwork && $this->providerNetwork->discovered_status === 'Missing') {
            return 'Missing';
        }
        // Health follows the bound node (etc.txt): node down -> resource offline even if provider Connected.
        if ($this->providerNode && $this->providerNode->discovered_status === 'Missing') {
            return 'Missing';
        }
        if ($this->providerNode && $this->providerNode->status === 'offline') {
            return 'Node Offline';
        }
        if ($this->provider && $this->provider->status !== 'Connected') {
            return 'Provider Offline';
        }

        return $this->status;
    }
}
