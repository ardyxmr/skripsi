<?php

namespace App\Services\Discovery;

use App\Models\Provider;
use App\Models\ProviderDatastore;
use App\Models\ProviderNetwork;
use App\Models\ProviderNode;
use App\Models\ProviderTemplate;
use App\Models\ProviderVm;
use App\Services\AuditService;

/**
 * Orchestrates a full discovery sync for a provider via the driver, upserts the
 * provider_* tables, and flags absent rows Missing (never deletes). Writes a
 * SYNC_PROVIDER audit row (04-backend-services.md §2.3).
 */
class DiscoveryService
{
    public function __construct(private AuditService $audit) {}

    public function discover(Provider $provider): array
    {
        $driver = ProviderFactory::make($provider);
        $runAt = now();

        $provider->discovery_status = 'running';
        $provider->save();

        try {
            // 1. Nodes (capacity).
            foreach ($driver->getClusterResources('node') as $n) {
                ProviderNode::updateOrCreate(
                    ['provider_id' => $provider->id, 'node_name' => $n['node']],
                    [
                        'external_node_id' => $n['id'] ?? $n['node'],
                        'status' => $n['status'] ?? null,
                        'cpu_count' => $n['maxcpu'] ?? null,
                        'total_memory' => $n['maxmem'] ?? null,
                        'total_storage' => $n['maxdisk'] ?? null,
                        // Point-in-time utilization snapshot (§2.2) — same math as provider_vms.
                        'cpu_utilization' => isset($n['cpu']) ? round(((float) $n['cpu']) * 100, 4) : null,
                        'ram_usage_mb' => isset($n['mem']) ? intdiv((int) $n['mem'], 1048576) : null,
                        'discovered_status' => 'Active',
                        'last_sync_at' => $runAt,
                    ],
                );
            }
            $nodeIdByName = ProviderNode::where('provider_id', $provider->id)->pluck('id', 'node_name');

            // 2. Storage / datastores.
            foreach ($driver->getClusterResources('storage') as $s) {
                ProviderDatastore::updateOrCreate(
                    ['provider_id' => $provider->id, 'node_name' => $s['node'] ?? null, 'datastore_name' => $s['storage']],
                    [
                        'provider_node_id' => $nodeIdByName[$s['node'] ?? ''] ?? null,
                        'datastore_type' => $s['plugintype'] ?? ($s['type'] ?? null),
                        'total_space' => $s['maxdisk'] ?? null,
                        'available_space' => isset($s['maxdisk'], $s['disk']) ? $s['maxdisk'] - $s['disk'] : null,
                        'discovered_status' => 'Active',
                        'last_sync_at' => $runAt,
                    ],
                );
            }

            // 3. One cluster call classifies VMs vs templates by the `template` flag.
            foreach ($driver->getClusterResources('vm') as $vm) {
                $node = $vm['node'] ?? null;
                $nodeId = $nodeIdByName[$node] ?? null;
                $vmid = (string) $vm['vmid'];

                if ((int) ($vm['template'] ?? 0) === 1) {
                    ProviderTemplate::updateOrCreate(
                        ['provider_id' => $provider->id, 'external_template_id' => $vmid],
                        [
                            'provider_node_id' => $nodeId,
                            'template_name' => $vm['name'] ?? "vm-{$vmid}",
                            'node_name' => $node,
                            'template_type' => 'VM Template',
                            'discovered_status' => 'Active',
                            'last_sync_at' => $runAt,
                        ],
                    );

                    continue;
                }

                // Allocation: parse /config (lazy/heavier tier).
                $alloc = ['vcpu' => null, 'ram_mb' => null, 'disk_allocated_gb' => null, 'disks' => []];
                try {
                    $alloc = ConfigParser::parse($driver->getVmConfig($node, $vmid));
                } catch (\Throwable) {
                    // leave allocation null on parse/HTTP error
                }

                // IP only for running VMs (avoids guest-agent timeouts on stopped VMs).
                $ip = ($vm['status'] ?? '') === 'running'
                    ? $this->firstIpv4($driver->getVmInterfaces($node, $vmid))
                    : null;

                ProviderVm::updateOrCreate(
                    ['provider_id' => $provider->id, 'external_vmid' => $vmid],
                    [
                        'provider_node_id' => $nodeId,
                        'vm_name' => $vm['name'] ?? null,
                        'power_state' => $vm['status'] ?? null,
                        'ip_address' => $ip,
                        'vcpu' => $alloc['vcpu'],
                        'ram_mb' => $alloc['ram_mb'],
                        'disk_allocated_gb' => $alloc['disk_allocated_gb'],
                        'disks_json' => $alloc['disks'],
                        'cpu_utilization' => isset($vm['cpu']) ? round(((float) $vm['cpu']) * 100, 4) : null,
                        'ram_usage_mb' => isset($vm['mem']) ? intdiv((int) $vm['mem'], 1048576) : null,
                        'discovered_status' => 'Active',
                        'last_sync_at' => $runAt,
                    ],
                );
            }

            // 4. Networks (per node) — bridges only.
            foreach ($nodeIdByName as $nodeName => $nodeId) {
                try {
                    $nets = $driver->getNodeNetwork($nodeName);
                } catch (\Throwable) {
                    continue;
                }
                foreach ($nets as $net) {
                    if (($net['type'] ?? '') !== 'bridge') {
                        continue;
                    }
                    ProviderNetwork::updateOrCreate(
                        ['provider_id' => $provider->id, 'node_name' => $nodeName, 'network_name' => $net['iface']],
                        [
                            'provider_node_id' => $nodeId,
                            'network_type' => $net['type'] ?? null,
                            'cidr' => $net['cidr'] ?? null,
                            'gateway' => $net['gateway'] ?? null,
                            'discovered_status' => 'Active',
                            'last_sync_at' => $runAt,
                        ],
                    );
                }
            }

            // 5. Flag anything not touched this run as Missing (never delete).
            foreach ([ProviderNode::class, ProviderTemplate::class, ProviderNetwork::class, ProviderDatastore::class, ProviderVm::class] as $model) {
                $model::where('provider_id', $provider->id)
                    ->where('last_sync_at', '<', $runAt)
                    ->update(['discovered_status' => 'Missing']);
            }

            $provider->discovery_status = 'success';
            $provider->status = 'Connected';
            $provider->last_discovery_at = $runAt;
            $provider->last_sync_at = $runAt;
            $provider->save();
        } catch (\Throwable $e) {
            $provider->discovery_status = 'failed';
            $provider->save();
            throw $e;
        }

        $counts = $this->activeCounts($provider);
        // Audit only human-initiated discovery (Provider Management "Discover"); the scheduled
        // discovery:refresh runs with no auth user — auditing every tick would flood the log (ADR-12).
        if (auth()->user()) {
            $this->audit->log(auth()->user(), 'SYNC_PROVIDER', "Discovered {$provider->provider_name}: ".json_encode($counts));
        }

        return $counts;
    }

    /**
     * Scoped re-sync of a single discovered node — refreshes its status + utilization
     * snapshot from /cluster/resources?type=node (published-node "Sync now" action).
     * Returns the fresh ProviderNode, or null if the provider no longer reports it.
     */
    public function syncNode(ProviderNode $node): ?ProviderNode
    {
        $driver = ProviderFactory::make($node->provider);
        $runAt = now();

        foreach ($driver->getClusterResources('node') as $n) {
            if (($n['node'] ?? null) !== $node->node_name) {
                continue;
            }
            $node->update([
                'status' => $n['status'] ?? null,
                'cpu_count' => $n['maxcpu'] ?? $node->cpu_count,
                'total_memory' => $n['maxmem'] ?? $node->total_memory,
                'total_storage' => $n['maxdisk'] ?? $node->total_storage,
                'cpu_utilization' => isset($n['cpu']) ? round(((float) $n['cpu']) * 100, 4) : null,
                'ram_usage_mb' => isset($n['mem']) ? intdiv((int) $n['mem'], 1048576) : null,
                'discovered_status' => 'Active',
                'last_sync_at' => $runAt,
            ]);

            return $node->fresh();
        }

        return null;
    }

    /**
     * Scoped single-VM discovery (Stage 6 post-provision): upsert one provider_vms row
     * for the just-created VM so VmFactSyncService can mirror its IP/power into inventory.
     */
    public function syncVm(Provider $provider, string $node, string $vmid): ?ProviderVm
    {
        $driver = ProviderFactory::make($provider);
        $runAt = now();
        $nodeId = ProviderNode::where('provider_id', $provider->id)->where('node_name', $node)->value('id');

        $match = null;
        foreach ($driver->getClusterResources('vm') as $vm) {
            if ((string) ($vm['vmid'] ?? '') === (string) $vmid) {
                $match = $vm;
                break;
            }
        }
        if (! $match) {
            return null;
        }

        $alloc = ['vcpu' => null, 'ram_mb' => null, 'disk_allocated_gb' => null, 'disks' => []];
        try {
            $alloc = ConfigParser::parse($driver->getVmConfig($node, $vmid));
        } catch (\Throwable) {
            // leave allocation null
        }
        $ip = ($match['status'] ?? '') === 'running'
            ? $this->firstIpv4($driver->getVmInterfaces($node, $vmid))
            : null;

        return ProviderVm::updateOrCreate(
            ['provider_id' => $provider->id, 'external_vmid' => (string) $vmid],
            [
                'provider_node_id' => $nodeId,
                'vm_name' => $match['name'] ?? null,
                'power_state' => $match['status'] ?? null,
                'ip_address' => $ip,
                'vcpu' => $alloc['vcpu'],
                'ram_mb' => $alloc['ram_mb'],
                'disk_allocated_gb' => $alloc['disk_allocated_gb'],
                'disks_json' => $alloc['disks'],
                'cpu_utilization' => isset($match['cpu']) ? round(((float) $match['cpu']) * 100, 4) : null,
                'ram_usage_mb' => isset($match['mem']) ? intdiv((int) $match['mem'], 1048576) : null,
                'discovered_status' => 'Active',
                'last_sync_at' => $runAt,
            ],
        );
    }

    public function activeCounts(Provider $provider): array
    {
        $active = fn (string $model) => $model::where('provider_id', $provider->id)->where('discovered_status', 'Active')->count();

        return [
            'nodes' => $active(ProviderNode::class),
            'templates' => $active(ProviderTemplate::class),
            'networks' => $active(ProviderNetwork::class),
            'datastores' => $active(ProviderDatastore::class),
            'vms' => $active(ProviderVm::class),
        ];
    }

    private function firstIpv4(?array $ifaces): ?string
    {
        foreach ($ifaces ?? [] as $if) {
            if (($if['name'] ?? '') === 'lo') {
                continue;
            }
            foreach ($if['ip-addresses'] ?? [] as $addr) {
                if (($addr['ip-address-type'] ?? '') === 'ipv4' && ($addr['ip-address'] ?? '') !== '127.0.0.1') {
                    return $addr['ip-address'];
                }
            }
        }

        return null;
    }
}
