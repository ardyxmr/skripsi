<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProviderNode extends Model
{
    protected $guarded = [];

    protected $casts = ['last_sync_at' => 'datetime', 'block_on_critical' => 'boolean'];

    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }

    /** Discovered datastores bound to this node — drives the DISK% side of the capacity snapshot. */
    public function datastores(): HasMany
    {
        return $this->hasMany(ProviderDatastore::class, 'provider_node_id');
    }

    /**
     * Effective display status for the node itself (Discovery Explorer "Nodes" tab). A disconnected
     * provider leaves this row's raw `status` stale ('online'), so the provider check runs BEFORE the
     * node's own status. Mirrors the child-resource derivation in DerivesEffectiveStatus.
     * Returns: Missing | Provider Offline | Node Offline | Active.
     */
    public function effectiveStatus(): string
    {
        if (($this->discovered_status ?? null) === 'Missing') {
            return 'Missing';
        }
        if ($this->provider && $this->provider->status !== 'Connected') {
            return 'Provider Offline';
        }
        if ($this->status === 'offline') {
            return 'Node Offline';
        }

        return 'Active';
    }
}
