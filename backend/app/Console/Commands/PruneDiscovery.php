<?php

namespace App\Console\Commands;

use App\Models\Catalog;
use App\Models\Datastore;
use App\Models\Network;
use App\Models\Node;
use App\Models\ProviderDatastore;
use App\Models\ProviderNetwork;
use App\Models\ProviderNode;
use App\Models\ProviderTemplate;
use App\Models\ProviderVm;
use Illuminate\Console\Command;

/**
 * Delete discovered resources that have been Missing longer than the stale window (default 24h,
 * config `provisioning.discovery_stale_hours`). `last_sync_at` is the last time the resource was
 * actually seen present, so "Missing AND last_sync_at older than cutoff" = gone for > window.
 *
 * VMs are never referenced by a published row → always safe to delete. Templates/networks/
 * datastores/nodes still bound to a PUBLISHED row are KEPT (deleting them would silently null the
 * published binding) — an admin must unpublish first; until then the published row shows its drift.
 */
class PruneDiscovery extends Command
{
    protected $signature = 'discovery:prune {--hours= : stale window in hours (overrides config)}';

    protected $description = 'Delete discovered resources Missing longer than the stale window (default 24h); keeps published-referenced templates/networks/datastores/nodes.';

    public function handle(): int
    {
        $hours = (int) ($this->option('hours') ?: config('provisioning.discovery_stale_hours', 24));
        $cutoff = now()->subHours($hours);

        // Base query: rows flagged Missing whose last-seen time is older than the cutoff.
        $stale = fn (string $model) => $model::where('discovered_status', 'Missing')
            ->where(fn ($q) => $q->whereNull('last_sync_at')->orWhere('last_sync_at', '<', $cutoff));

        $vms = $stale(ProviderVm::class)->delete();

        $tpl = $stale(ProviderTemplate::class)
            ->whereNotIn('id', Catalog::whereNotNull('provider_template_id')->pluck('provider_template_id'))
            ->delete();

        $net = $stale(ProviderNetwork::class)
            ->whereNotIn('id', Network::whereNotNull('provider_network_id')->pluck('provider_network_id'))
            ->delete();

        $ds = $stale(ProviderDatastore::class)
            ->whereNotIn('id', Datastore::whereNotNull('provider_datastore_id')->pluck('provider_datastore_id'))
            ->delete();

        // provider_nodes are referenced by published nodes AND by published catalogs/networks/datastores.
        $referencedNodes = Node::whereNotNull('provider_node_id')->pluck('provider_node_id')
            ->merge(Catalog::whereNotNull('provider_node_id')->pluck('provider_node_id'))
            ->merge(Network::whereNotNull('provider_node_id')->pluck('provider_node_id'))
            ->merge(Datastore::whereNotNull('provider_node_id')->pluck('provider_node_id'))
            ->unique()->values();
        $nodes = $stale(ProviderNode::class)->whereNotIn('id', $referencedNodes)->delete();

        $this->info("Pruned (Missing > {$hours}h): vms=$vms templates=$tpl networks=$net datastores=$ds nodes=$nodes");

        return self::SUCCESS;
    }
}
