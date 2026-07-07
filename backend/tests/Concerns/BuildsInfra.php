<?php

namespace Tests\Concerns;

use App\Models\Catalog;
use App\Models\Datastore;
use App\Models\Environment;
use App\Models\Inventory;
use App\Models\Network;
use App\Models\Node;
use App\Models\Provider;
use App\Models\ProviderNode;
use App\Models\Tier;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Builds a complete, policy-valid provisioning scenario for feature tests.
 *
 * The provision policy (ProvisionRequestService::validatePolicy) is node-centric:
 * provider/node/tier must be allow-listed in the environment, the provider must be
 * Connected, and catalog/network/datastore must be Active AND bound to the SAME
 * discovered provider_nodes row as the chosen node. seedScenario() wires all of that
 * up so a test can submit a request that PASSES, then mutate one piece to exercise a
 * failure path. Individual builders are exposed for tests that need finer control.
 */
trait BuildsInfra
{
    /** Unique-ish suffix so case-insensitive functional unique indexes (2026-06-18) don't collide. */
    private function rand(string $prefix): string
    {
        return $prefix.'-'.Str::lower(Str::random(8));
    }

    protected function provider(array $attrs = []): Provider
    {
        // `status` (+ discovery state) is not mass-assignable on Provider — it's set by
        // discovery/test-connection, never by the API. forceFill so the test can pin it.
        $provider = new Provider;
        $provider->forceFill(array_merge([
            'provider_name' => $this->rand('provider'),
            'provider_type' => 'proxmox',
            'endpoint' => 'https://pve.test:8006',
            'status' => 'Connected',
        ], $attrs))->save();

        return $provider;
    }

    protected function providerNode(Provider $provider, array $attrs = []): ProviderNode
    {
        return ProviderNode::create(array_merge([
            'provider_id' => $provider->id,
            'node_name' => $this->rand('pve'),
            'status' => 'online',
            'discovered_status' => 'Active',
        ], $attrs));
    }

    protected function node(Provider $provider, ProviderNode $pnode, array $attrs = []): Node
    {
        return Node::create(array_merge([
            'node_name' => $this->rand('node'),
            'provider_id' => $provider->id,
            'provider_node_id' => $pnode->id,
            'status' => 'Active',
        ], $attrs));
    }

    protected function catalog(Provider $provider, ProviderNode $pnode, array $attrs = []): Catalog
    {
        return Catalog::create(array_merge([
            'catalog_name' => $this->rand('catalog'),
            'provider_id' => $provider->id,
            'provider_node_id' => $pnode->id,
            'status' => 'Active',
        ], $attrs));
    }

    protected function network(Provider $provider, ProviderNode $pnode, array $attrs = []): Network
    {
        return Network::create(array_merge([
            'network_name' => $this->rand('net'),
            'provider_id' => $provider->id,
            'provider_node_id' => $pnode->id,
            'status' => 'Active',
        ], $attrs));
    }

    protected function datastore(Provider $provider, ProviderNode $pnode, array $attrs = []): Datastore
    {
        return Datastore::create(array_merge([
            'datastore_name' => $this->rand('ds'),
            'provider_id' => $provider->id,
            'provider_node_id' => $pnode->id,
            'status' => 'Active',
        ], $attrs));
    }

    protected function tier(array $attrs = []): Tier
    {
        return Tier::create(array_merge([
            'tier_name' => $this->rand('tier'),
            'cpu' => 2,
            'ram_mb' => 2048,
            'disk_gb' => 20,
            'status' => 'Active',
        ], $attrs));
    }

    protected function environment(array $attrs = []): Environment
    {
        return Environment::create(array_merge([
            'environment_name' => $this->rand('env'),
            'expiry_type' => 'days',
            'expiry_value' => 30,
            'approval_required' => true,
            'allow_data_disk' => false,
            'status' => 'Active',
        ], $attrs));
    }

    /**
     * Build the full graph and allow-list it into one environment.
     *
     * @param  array<string,mixed>  $envAttrs  Overrides for the environment (e.g. approval_required).
     * @return array{provider:Provider,providerNode:ProviderNode,node:Node,catalog:Catalog,network:Network,datastore:Datastore,tier:Tier,environment:Environment}
     */
    protected function seedScenario(array $envAttrs = []): array
    {
        $provider = $this->provider();
        $pnode = $this->providerNode($provider);
        $node = $this->node($provider, $pnode);
        $catalog = $this->catalog($provider, $pnode);
        $network = $this->network($provider, $pnode);
        $datastore = $this->datastore($provider, $pnode);
        $tier = $this->tier();
        $env = $this->environment($envAttrs);

        $env->providers()->attach($provider);
        $env->nodes()->attach($node);
        $env->tiers()->attach($tier);
        // Networks & datastores are NODE-scoped (validated via the node, not the env) since the
        // node-centric refactor — the Environment model no longer exposes networks()/datastores().

        return [
            'provider' => $provider,
            'providerNode' => $pnode,
            'node' => $node,
            'catalog' => $catalog,
            'network' => $network,
            'datastore' => $datastore,
            'tier' => $tier,
            'environment' => $env,
        ];
    }

    /**
     * An Active inventory VM owned by $owner, wired to the scenario's resources. Pass overrides
     * for lifecycle state (status, expiry_date, grace_period_until, is_permanent, …).
     *
     * @param  array{provider:Provider,node:Node,catalog:Catalog,network:Network,datastore:Datastore,tier:Tier,environment:Environment}  $s
     * @param  array<string,mixed>  $attrs
     */
    protected function inventoryVm(User $owner, array $s, array $attrs = []): Inventory
    {
        return Inventory::create(array_merge([
            'vm_name' => $this->rand('vm'),
            'owner_user_id' => $owner->id,
            'environment_id' => $s['environment']->id,
            'provider_id' => $s['provider']->id,
            'node_id' => $s['node']->id,
            'catalog_id' => $s['catalog']->id,
            'tier_id' => $s['tier']->id,
            'network_id' => $s['network']->id,
            'datastore_id' => $s['datastore']->id,
            'external_vmid' => (string) random_int(100, 9999),
            'status' => 'Active',
            'vcpu' => 2,
            'ram_mb' => 2048,
        ], $attrs));
    }

    /**
     * A valid provision-request body for the given scenario. Pass overrides to break one field.
     *
     * @param  array{provider:Provider,node:Node,catalog:Catalog,network:Network,datastore:Datastore,tier:Tier,environment:Environment}  $s
     * @param  array<string,mixed>  $overrides
     * @return array<string,mixed>
     */
    protected function provisionPayload(array $s, array $overrides = []): array
    {
        return array_merge([
            'vm_name' => 'test-vm',
            'environment_id' => $s['environment']->id,
            'provider_id' => $s['provider']->id,
            'node_id' => $s['node']->id,
            'catalog_id' => $s['catalog']->id,
            'tier_id' => $s['tier']->id,
            'network_id' => $s['network']->id,
            'datastore_id' => $s['datastore']->id,
            'instance_count' => 1,
        ], $overrides);
    }
}
