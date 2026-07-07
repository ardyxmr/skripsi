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
}
