<?php

namespace App\Services;

use App\Models\ProviderNode;

/**
 * Point-in-time node capacity, derived purely from the already-discovered snapshot on
 * provider_nodes (+ its datastores) — no live Proxmox call. One shared computation so the wizard,
 * approval, node list and notifications all agree on the level.
 *
 *   • CPU%  = provider_nodes.cpu_utilization (Proxmox node load, already a %)
 *   • RAM%  = ram_usage_mb / (total_memory / 1MiB)
 *   • DISK% = the fullest datastore bound to the node: (total - available) / total
 *
 * The highest of the three drives the level. `warning` is informational; `critical` only BLOCKS
 * provisioning when the admin opted the node in (block_on_critical) → provisioning_blocked.
 */
class NodeCapacityService
{
    public function warnPct(): int
    {
        return (int) config('provisioning.node_capacity_warn_pct', 90);
    }

    public function criticalPct(): int
    {
        return (int) config('provisioning.node_capacity_critical_pct', 95);
    }

    /** Pass a ProviderNode with `datastores` eager-loaded to avoid an N+1 in list endpoints. */
    public function snapshot(?ProviderNode $pn): array
    {
        $warn = $this->warnPct();
        $critical = $this->criticalPct();

        $cpu = $pn && $pn->cpu_utilization !== null ? round((float) $pn->cpu_utilization, 1) : null;

        $ram = null;
        if ($pn && $pn->ram_usage_mb !== null && $pn->total_memory) {
            $totalMb = (int) $pn->total_memory / 1048576;
            $ram = $totalMb > 0 ? round($pn->ram_usage_mb / $totalMb * 100, 1) : null;
        }

        $disk = null;
        if ($pn && $pn->relationLoaded('datastores')) {
            foreach ($pn->datastores as $d) {
                if ($d->total_space) {
                    $used = ($d->total_space - (int) $d->available_space) / $d->total_space * 100;
                    $disk = max($disk ?? 0.0, round($used, 1));
                }
            }
        }

        $breached = [];
        foreach (['CPU' => $cpu, 'RAM' => $ram, 'DISK' => $disk] as $label => $pct) {
            if ($pct !== null && $pct >= $warn) {
                $breached[] = $label;
            }
        }

        $known = array_filter([$cpu, $ram, $disk], fn ($v) => $v !== null);
        $peak = $known ? max($known) : 0.0;
        $level = $peak >= $critical ? 'critical' : ($peak >= $warn ? 'warning' : 'ok');

        $blockOnCritical = (bool) ($pn?->block_on_critical);

        return [
            'cpu_pct' => $cpu,
            'ram_pct' => $ram,
            'disk_pct' => $disk,
            'level' => $level,                 // ok | warning | critical
            'breached' => $breached,           // which of CPU/RAM/DISK crossed the warn line
            'warn_pct' => $warn,
            'critical_pct' => $critical,
            'block_on_critical' => $blockOnCritical,
            // The teeth: TRUE only when an admin opted this node in AND it is actually critical.
            'provisioning_blocked' => $blockOnCritical && $level === 'critical',
        ];
    }
}
