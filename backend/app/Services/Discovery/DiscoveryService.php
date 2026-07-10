<?php

namespace App\Services\Discovery;

use App\Models\Provider;
use App\Models\ProviderDatastore;
use App\Models\ProviderNetwork;
use App\Models\ProviderNode;
use App\Models\ProviderTemplate;
use App\Models\ProviderVm;
use App\Services\AuditService;
use App\Services\NodeCapacityMonitor;

/**
 * Orchestrates a full discovery sync for a provider via the driver, upserts the
 * provider_* tables, and flags absent rows Missing (never deletes). Writes a
 * SYNC_PROVIDER audit row (04-backend-services.md §2.3).
 */
class DiscoveryService
{
    public function __construct(
        private AuditService $audit,
        private ProviderSyncGuard $guard,
        private NodeCapacityMonitor $capacityMonitor,
    ) {}

    public function discover(Provider $provider): array
    {
        $driver = ProviderFactory::make($provider);
        $runAt = now();
        $prevStatus = $provider->status;   // capture BEFORE this run to detect a Connected↔Disconnected transition

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
                    // Mirror the template firmware so provisioning can clone a UEFI/Windows template
                    // with bios=ovmf. Proxmox omits the `bios` line when it is the seabios default, so a
                    // missing key means seabios; a config-fetch failure just keeps the default.
                    $bios = 'seabios';
                    try {
                        $bios = $driver->getVmConfig($node, $vmid)['bios'] ?? 'seabios';
                    } catch (\Throwable) {
                        // keep the seabios default on parse/HTTP error
                    }

                    ProviderTemplate::updateOrCreate(
                        ['provider_id' => $provider->id, 'external_template_id' => $vmid],
                        [
                            'provider_node_id' => $nodeId,
                            'template_name' => $vm['name'] ?? "vm-{$vmid}",
                            'node_name' => $node,
                            'template_type' => 'VM Template',
                            'bios' => $bios,
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

            // 6. Edge-triggered node-capacity alerts: nodes + datastores are fresh now, so compare each
            // online node's band to its last and audit any threshold crossing / recovery (the bell reads
            // these events). Rescued so a capacity hiccup never fails the whole discovery run.
            ProviderNode::with('datastores')->where('provider_id', $provider->id)
                ->where('discovered_status', 'Active')->where('status', 'online')->get()
                ->each(fn (ProviderNode $pn) => rescue(fn () => $this->capacityMonitor->check($pn)));

            $provider->discovery_status = 'success';
            $provider->status = 'Connected';
            $provider->last_discovery_at = $runAt;
            $provider->last_sync_at = $runAt;
            $provider->save();
            $this->guard->recordProviderSuccess($provider->id); // host reachable → close the breaker

            // Audit only the TRANSITION back to reachable (not every successful tick), so the trail
            // records recoveries without flooding. auth() is null on the scheduler → logged as 'system'.
            if ($prevStatus === 'Disconnected') {
                $this->audit->log(auth()->user(), 'PROVIDER_RECONNECTED',
                    "Provider {$provider->provider_name} is reachable again (Connected) — its nodes, catalogs, networks and datastores are back online.",
                    null, ['provider_id' => $provider->id, 'status' => 'Connected']);
            }
        } catch (\Throwable $e) {
            $provider->discovery_status = 'failed';
            // Sync the connection status too: a failed live probe means the host is unreachable, so
            // mark it Disconnected right here instead of waiting for a manual Test Connection. Every
            // effectiveStatus() (catalog/network/datastore/node) then reports "Provider Offline"
            // automatically; a later successful discover() flips it back to Connected (success path above).
            $provider->status = 'Disconnected';
            $provider->save();

            // Audit only the TRANSITION into unreachable (the first failing run, while it was still
            // Connected/new), so a long outage yields ONE entry, not one per discovery tick.
            if ($prevStatus !== 'Disconnected') {
                $this->audit->log(auth()->user(), 'PROVIDER_DISCONNECTED',
                    "Provider {$provider->provider_name} is unreachable (Disconnected) — its nodes, catalogs, networks and datastores are now offline.",
                    null, ['provider_id' => $provider->id, 'status' => 'Disconnected']);
            }

            // Record the failed RUN itself (symmetric with the SYNC_PROVIDER success audit below) so a
            // failed discovery is never silent nor mislabeled as success — including a repeat failure
            // while already Disconnected, which the transition guard above skips. Human-initiated only:
            // the scheduled cadence would flood the trail (its state transition is already audited).
            if (auth()->user()) {
                $this->audit->log(auth()->user(), 'DISCOVERY_FAILED',
                    "Discovery of {$provider->provider_name} failed — host unreachable: {$e->getMessage()}",
                    null, ['provider_id' => $provider->id, 'status' => 'Disconnected']);
            }

            $this->guard->recordProviderFailure($provider->id); // feed the circuit breaker
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
        try {
            $driver = ProviderFactory::make($provider);
            $runAt = now();
            $nodeId = ProviderNode::where('provider_id', $provider->id)->where('node_name', $node)->value('id');

            // The cluster-resources call is the connectivity probe — a host-down error throws here
            // and trips the breaker (outer catch).
            $match = null;
            foreach ($driver->getClusterResources('vm') as $vm) {
                if ((string) ($vm['vmid'] ?? '') === (string) $vmid) {
                    $match = $vm;
                    break;
                }
            }
            if (! $match) {
                $this->guard->recordProviderSuccess($provider->id); // host reachable, VM simply absent
                return null;
            }

            $alloc = ['vcpu' => null, 'ram_mb' => null, 'disk_allocated_gb' => null, 'disks' => []];
            try {
                $alloc = ConfigParser::parse($driver->getVmConfig($node, $vmid));
            } catch (\Throwable) {
                // leave allocation null
            }

            // IP comes from the guest agent, which can be unready well after the host is reachable —
            // wrap it so guest-agent lag never trips the breaker (the bounded IP follow-up retries).
            $ip = null;
            if (($match['status'] ?? '') === 'running') {
                try {
                    $ip = $this->firstIpv4($driver->getVmInterfaces($node, $vmid));
                } catch (\Throwable) {
                    // agent not ready yet — leave IP null
                }
            }

            $pv = ProviderVm::updateOrCreate(
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

            $this->guard->recordProviderSuccess($provider->id);
            return $pv;
        } catch (\Throwable $e) {
            $this->guard->recordProviderFailure($provider->id);
            throw $e;
        }
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
