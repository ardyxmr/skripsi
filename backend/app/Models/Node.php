<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Published node (ADR-17): friendly-named pointer to one discovered provider_nodes row.
#[Fillable(['node_name', 'description', 'provider_id', 'provider_node_id', 'status', 'created_by'])]
class Node extends Model
{
    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }

    public function providerNode(): BelongsTo
    {
        return $this->belongsTo(ProviderNode::class);
    }

    // Governance state mirrors networks/datastores: Active | Inactive | Provider Offline | Missing.
    public function effectiveStatus(): string
    {
        if ($this->providerNode && $this->providerNode->discovered_status === 'Missing') {
            return 'Missing';
        }
        if ($this->provider && $this->provider->status !== 'Connected') {
            return 'Provider Offline';
        }

        return $this->status;
    }
}
