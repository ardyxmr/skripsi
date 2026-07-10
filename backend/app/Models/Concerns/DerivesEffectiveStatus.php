<?php

namespace App\Models\Concerns;

/**
 * Effective display status for a discovered CHILD resource (template / network / datastore / vm),
 * derived from the live health of its provider + owning node — mirroring Catalog::effectiveStatus().
 *
 * The discovery layer stores each row's raw `discovered_status` (Active | Missing) from the last
 * successful scan; when the provider is unreachable that raw value goes stale (the Missing-sweep
 * never runs), so the Explorer must overlay the live provider/node reachability at read time instead
 * of trusting the stored value. Order matters: a disconnected provider leaves the node's own status
 * stale ('online'), so the node checks fall through to the Provider Offline verdict.
 *
 * Requires the using model to define `provider()` and `providerNode()` belongsTo relations and to
 * have a `discovered_status` column.
 */
trait DerivesEffectiveStatus
{
    public function effectiveStatus(): string
    {
        if (($this->discovered_status ?? null) === 'Missing') {
            return 'Missing';
        }

        $node = $this->providerNode;
        if ($node && ($node->discovered_status === 'Missing' || $node->status === 'offline')) {
            return 'Node Offline';
        }

        if ($this->provider && $this->provider->status !== 'Connected') {
            return 'Provider Offline';
        }

        return 'Active';
    }
}
