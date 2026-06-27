<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable([
    'environment_name', 'description', 'expiry_type', 'expiry_value',
    'grace_period_type', 'grace_period_value',
    'approval_required', 'allow_data_disk', 'max_data_disks', 'status', 'display_order', 'created_by',
])]
class Environment extends Model
{
    protected $casts = [
        'approval_required' => 'boolean',
        'allow_data_disk' => 'boolean',
        'max_data_disks' => 'integer',
    ];

    public function providers(): BelongsToMany
    {
        return $this->belongsToMany(Provider::class, 'environment_provider_rules');
    }

    public function tiers(): BelongsToMany
    {
        return $this->belongsToMany(Tier::class, 'environment_tier_rules');
    }

    public function nodes(): BelongsToMany
    {
        return $this->belongsToMany(Node::class, 'environment_node_rules');
    }
}
