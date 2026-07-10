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

    /** A relation set that lets effectiveStatus() judge every allowed provider + node's health. */
    public const HEALTH_RELATIONS = [
        'providers:id,provider_name,status',
        'tiers:id',
        'nodes:id,provider_id,provider_node_id',
        'nodes.provider:id,status',
        'nodes.providerNode:id,status,discovered_status',
    ];

    /** A node is usable only when its cluster API is reachable, Proxmox reports it online, and it
     *  was seen in the last discovery (not Missing). */
    private function nodeUsable(Node $node): bool
    {
        return $node->provider?->status === 'Connected'
            && $node->providerNode?->status === 'online'
            && $node->providerNode?->discovered_status === 'Active';
    }

    /**
     * Effective status for the Environment list/explorer. Unlike catalog/network/datastore (1:1 to a
     * node), an environment is an allow-list of MANY providers + nodes, so it degrades gradually:
     *   Inactive (admin) → Provider Offline / Node Offline (no usable path left, red) →
     *   Degraded (some allowed provider/node down but a usable path remains, amber) → Active.
     * Only ASSIGNED resources are judged — an empty allow-list is a config gap, not a disconnect.
     */
    public function effectiveStatus(): string
    {
        if ($this->status === 'Inactive') {
            return 'Inactive';
        }

        $providersAssigned = $this->providers->count();
        $providersUp = $this->providers->where('status', 'Connected')->count();

        $nodesAssigned = $this->nodes->count();
        $nodesUsable = $this->nodes->filter(fn (Node $n) => $this->nodeUsable($n))->count();

        // No usable path at all → unusable (red). Only when something was actually assigned.
        if ($providersAssigned > 0 && $providersUp === 0) {
            return 'Provider Offline';
        }
        if ($nodesAssigned > 0 && $nodesUsable === 0) {
            return 'Node Offline';
        }

        // Partial: an allowed provider/node is down but a usable path still exists.
        if ($providersUp < $providersAssigned || $nodesUsable < $nodesAssigned) {
            return 'Degraded';
        }

        return 'Active';
    }
}
