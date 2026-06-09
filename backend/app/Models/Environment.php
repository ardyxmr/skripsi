<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable([
    'environment_name', 'description', 'expiry_type', 'expiry_value',
    'approval_required', 'allow_data_disk', 'status', 'display_order', 'created_by',
])]
class Environment extends Model
{
    protected $casts = [
        'approval_required' => 'boolean',
        'allow_data_disk' => 'boolean',
    ];

    public function providers(): BelongsToMany
    {
        return $this->belongsToMany(Provider::class, 'environment_provider_rules');
    }

    public function tiers(): BelongsToMany
    {
        return $this->belongsToMany(Tier::class, 'environment_tier_rules');
    }

    public function networks(): BelongsToMany
    {
        return $this->belongsToMany(Network::class, 'environment_network_rules');
    }

    public function datastores(): BelongsToMany
    {
        return $this->belongsToMany(Datastore::class, 'environment_datastore_rules');
    }
}
