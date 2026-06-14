<?php

namespace App\Services;

use App\Models\Catalog;
use App\Models\Datastore;
use App\Models\Network;
use App\Models\Node;
use App\Models\ProviderNode;
use App\Models\ProvisionRequest;
use App\Models\Tier;

/**
 * Converts business IDs → real provider values (04-backend-services.md §3.3).
 * The single place that does this; guarantees Terraform never receives any *_id.
 * The full resolve(provisionRequest) that also folds in tier CPU/RAM/disk is
 * composed in Stage 6 (provisioning) once tiers + provision_requests exist.
 */
class ResourceResolutionService
{
    /**
     * Compose the full, IDs-free value set for one VM's terraform.tfvars (Stage 6).
     * Terraform never receives any *_id. `vmName` lets a batch fan out to suffixed names;
     * `bootDiskGb` (if set on the request) raises the tier disk floor.
     */
    public function resolve(ProvisionRequest $pr, string $vmName, ?int $bootDiskGb = null): array
    {
        $tier = Tier::findOrFail($pr->tier_id);
        $diskGb = max((int) $tier->disk_gb, (int) ($bootDiskGb ?? 0));

        // cores = fixed MAX topology (built once, never changes live); vcpus = how many are ONLINE
        // (the tier's cpu). A CPU resize moves vcpus within [1, cores] and hot-plugs with no reboot.
        $maxCores = max((int) config('provisioning.max_cpu_cores'), (int) $tier->cpu);

        return [
            'vm_name' => $vmName,
            'target_node' => $this->resolvePublishedNode($pr->node_id),
            'template' => $this->resolveCatalog($pr->catalog_id)['template'],
            'network' => $this->resolveNetwork($pr->network_id),
            'storage' => $this->resolveDatastore($pr->datastore_id),
            'cores' => $maxCores,
            'sockets' => 1,
            'vcpus' => (int) $tier->cpu,
            'memory' => (int) $tier->ram_mb,
            'disk_size_gb' => $diskGb,
        ];
    }

    /** catalog_id → [template, node] provider names. */
    public function resolveCatalog(int $catalogId): array
    {
        $c = Catalog::with(['providerTemplate', 'providerNode'])->findOrFail($catalogId);

        return [
            'template' => $c->providerTemplate?->template_name,
            'node' => $c->providerNode?->node_name,
        ];
    }

    /** network_id (published) → provider bridge, e.g. vmbr0. */
    public function resolveNetwork(int $networkId): ?string
    {
        return Network::with('providerNetwork')->find($networkId)?->providerNetwork?->network_name;
    }

    /** datastore_id (published) → provider storage id, e.g. local-lvm. */
    public function resolveDatastore(int $datastoreId): ?string
    {
        return Datastore::with('providerDatastore')->find($datastoreId)?->providerDatastore?->datastore_name;
    }

    /** node_id (PUBLISHED) → provider_nodes.node_name, e.g. pve01 (§4.3 / ADR-17). */
    public function resolvePublishedNode(int $nodeId): ?string
    {
        return Node::with('providerNode')->find($nodeId)?->providerNode?->node_name;
    }

    /** Raw provider_node_id → node_name (internal; never fed to Terraform directly). */
    public function resolveNode(int $providerNodeId): ?string
    {
        return ProviderNode::find($providerNodeId)?->node_name;
    }
}
