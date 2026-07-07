<?php

namespace App\Services;

use App\Models\ProviderNode;

/**
 * Edge-triggered node-capacity alerting. Compares a node's freshly computed capacity band against the
 * last-recorded `capacity_band` and, ONLY on a change, writes an audit event (which is also what the
 * notification bell reads). Mirrors DiscoveryService's provider connect/disconnect transition audit:
 * a node that stays hot yields ONE breach entry, and a single "back to normal" entry on recovery —
 * cross the line again → a fresh event fires again.
 */
class NodeCapacityMonitor
{
    public function __construct(
        private NodeCapacityService $capacity,
        private AuditService $audit,
    ) {}

    /** Detect + record a band transition for one node. Returns the emitted action_type, or null. */
    public function check(ProviderNode $pn): ?string
    {
        $snap = $this->capacity->snapshot($pn->loadMissing('datastores'));
        $new = $snap['level'];              // ok | warning | critical
        $old = $pn->capacity_band;          // null until first observed

        if ($old === $new) {
            return null;                    // no transition
        }

        $firstObservation = $old === null;
        $pn->update(['capacity_band' => $new]);

        // First time we ever see a healthy node → baseline silently (no spurious "recovered").
        if ($firstObservation && $new === 'ok') {
            return null;
        }

        $detail = $this->detailLine($snap);

        if ($new === 'ok') {
            $this->audit->log(auth()->user(), 'NODE_CAPACITY_RECOVERED',
                "Node {$pn->node_name} is back to normal (Green) — {$detail}.",
                null, $this->meta($pn, $snap, 'ok'));

            return 'NODE_CAPACITY_RECOVERED';
        }

        $reached = $new === 'critical' ? 'CRITICAL' : 'HIGH';
        // Coming DOWN from critical to warning is an improvement, not a new breach — word it so.
        $verb = ($old === 'critical' && $new === 'warning') ? 'eased to' : 'reached';
        $this->audit->log(auth()->user(), 'NODE_CAPACITY_BREACH',
            "Node {$pn->node_name} {$verb} {$reached} capacity — {$detail}.",
            null, $this->meta($pn, $snap, $new));

        return 'NODE_CAPACITY_BREACH';
    }

    private function detailLine(array $snap): string
    {
        $parts = [];
        foreach (['CPU' => 'cpu_pct', 'RAM' => 'ram_pct', 'DISK' => 'disk_pct'] as $label => $key) {
            if ($snap[$key] !== null) {
                $parts[] = "{$label} {$snap[$key]}%";
            }
        }

        return implode(' · ', $parts);
    }

    private function meta(ProviderNode $pn, array $snap, string $band): array
    {
        return [
            'node' => $pn->node_name,
            'band' => $band,
            'cpu_pct' => $snap['cpu_pct'],
            'ram_pct' => $snap['ram_pct'],
            'disk_pct' => $snap['disk_pct'],
        ];
    }
}
