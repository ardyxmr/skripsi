<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['datastore_name', 'description', 'provider_id', 'provider_node_id', 'provider_datastore_id', 'status', 'created_by'])]
class Datastore extends Model
{
    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }

    public function providerNode(): BelongsTo
    {
        return $this->belongsTo(ProviderNode::class);
    }

    public function providerDatastore(): BelongsTo
    {
        return $this->belongsTo(ProviderDatastore::class);
    }

    /** VMs provisioned onto this datastore — for the Usage count + delete-guard. */
    public function inventories(): HasMany
    {
        return $this->hasMany(Inventory::class, 'datastore_id');
    }

    public function effectiveStatus(): string
    {
        if ($this->providerDatastore && $this->providerDatastore->discovered_status === 'Missing') {
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
