<?php

namespace App\Services;

use App\Models\Catalog;
use App\Models\Datastore;
use App\Models\Network;
use App\Models\ProviderNode;

/**
 * Converts business IDs → real provider values (04-backend-services.md §3.3).
 * The single place that does this; guarantees Terraform never receives any *_id.
 * The full resolve(provisionRequest) that also folds in tier CPU/RAM/disk is
 * composed in Stage 6 (provisioning) once tiers + provision_requests exist.
 */
class ResourceResolutionService
{
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

    public function resolveNode(int $providerNodeId): ?string
    {
        return ProviderNode::find($providerNodeId)?->node_name;
    }
}
