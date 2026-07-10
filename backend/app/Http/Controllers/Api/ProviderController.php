<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\EnforcesUniqueness;
use App\Http\Controllers\Concerns\PurgesMissingVms;
use App\Http\Controllers\Controller;
use App\Models\Node;
use App\Models\Provider;
use App\Models\ProviderDatastore;
use App\Models\ProviderNetwork;
use App\Models\ProviderNode;
use App\Models\ProviderTemplate;
use App\Models\ProviderVm;
use App\Services\AuditService;
use App\Services\Discovery\DiscoveryService;
use App\Services\Discovery\ProviderFactory;
use App\Services\VmFactSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProviderController extends Controller
{
    use EnforcesUniqueness, PurgesMissingVms;

    public function __construct(private AuditService $audit) {}

    public function index(): JsonResponse
    {
        // Per-provider Active counts → nodes_count/templates_count/… for the widgets.
        $active = fn ($q) => $q->where('discovered_status', 'Active');

        return response()->json(
            Provider::withCount([
                'nodes as nodes_count' => $active,
                'templates as templates_count' => $active,
                'networks as networks_count' => $active,
                'datastores as datastores_count' => $active,
                'vms as vms_count' => $active,
            ])->orderBy('id')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request, creating: true, provider: null);

        // Provider Management is the source of truth → a new provider auto-discovers ON by default
        // (2-minute cadence) unless the form explicitly says otherwise, so its DB snapshot never goes stale.
        $data['auto_discovery_enabled'] = $data['auto_discovery_enabled'] ?? true;
        $data['discovery_interval'] = $data['discovery_interval'] ?? '2m';

        $provider = Provider::create($data);
        $this->audit->log($request->user(), 'CREATE_PROVIDER', "Registered provider {$provider->provider_name}", $request);

        return response()->json($provider->fresh(), 201);
    }

    public function update(Request $request, Provider $provider): JsonResponse
    {
        $data = $this->validateData($request, creating: false, provider: $provider);

        // Write-only secrets: blank/absent means "keep current" (07-api-contract §2).
        foreach (['discovery_token_secret', 'provision_token_secret'] as $secret) {
            if (! array_key_exists($secret, $data) || $data[$secret] === null || $data[$secret] === '') {
                unset($data[$secret]);
            }
        }

        $provider->update($data);
        $this->audit->log($request->user(), 'UPDATE_PROVIDER', "Updated provider {$provider->provider_name}", $request);

        return response()->json($provider->fresh());
    }

    public function destroy(Request $request, Provider $provider): JsonResponse
    {
        $name = $provider->provider_name;
        // Missing VMs (gone from the hypervisor) on this provider must not block its removal.
        $this->purgeMissingVms('provider_id', $provider->id);
        $provider->delete();
        $this->audit->log($request->user(), 'DELETE_PROVIDER', "Deleted provider {$name}", $request);

        return response()->json(null, 204);
    }

    // Live check against the provider using the discovery credential.
    public function testConnection(Request $request, Provider $provider): JsonResponse
    {
        $result = ProviderFactory::make($provider)->testConnection();

        // Direct assignment — these system fields are intentionally not mass-fillable.
        $provider->status = $result['status'];
        $provider->last_tested_at = now();
        $provider->save();
        $this->audit->log($request->user(), 'TEST_PROVIDER', "Tested {$provider->provider_name}: {$result['status']}", $request);

        return response()->json([
            'status' => $result['status'],
            'version' => $result['version'] ?? null,
        ]);
    }

    // Run discovery now (full sync via the driver → provider_* tables).
    public function discover(Request $request, Provider $provider, DiscoveryService $discovery, VmFactSyncService $facts): JsonResponse
    {
        $counts = $discovery->discover($provider);
        // Mirror the fresh facts into inventory too, so a manual Discover updates the Inventory
        // power state immediately — not only the Discovery Explorer (which reads provider_*).
        $facts->syncProvider($provider);

        return response()->json([
            'discovery_status' => $provider->fresh()->discovery_status,
            'counts' => $counts,
        ]);
    }

    // Read-only Discovery Explorer: discovered resources + health (from the DB).
    public function explorer(Provider $provider): JsonResponse
    {
        // Overlay each row's effectiveStatus() (live provider/node health) onto the raw discovered
        // data, then drop the eager-loaded relations from the payload (kept only for the derivation).
        $withEff = fn ($items) => $items->map(function ($m) {
            $arr = $m->toArray();
            $arr['effective_status'] = $m->effectiveStatus();
            unset($arr['provider'], $arr['provider_node']);

            return $arr;
        });

        $scoped = fn (string $model, array $with) => $withEff(
            $model::with($with)->where('provider_id', $provider->id)->get()
        );

        return response()->json([
            'connection_status' => $provider->status,
            'discovery_status' => $provider->discovery_status,
            'auto_discovery_enabled' => $provider->auto_discovery_enabled,
            'discovery_interval' => $provider->discovery_interval,
            'last_discovery_at' => $provider->last_discovery_at,
            'next_discovery_at' => $provider->next_discovery_at, // computed accessor (null if auto off)
            'nodes' => $scoped(ProviderNode::class, ['provider']),
            'templates' => $scoped(ProviderTemplate::class, ['provider', 'providerNode']),
            'networks' => $scoped(ProviderNetwork::class, ['provider', 'providerNode']),
            'datastores' => $scoped(ProviderDatastore::class, ['provider', 'providerNode']),
            'vms' => $scoped(ProviderVm::class, ['provider', 'providerNode']),
        ]);
    }

    // Statistics widgets — all from the DB, never live API calls (07-api-contract §2).
    public function stats(): JsonResponse
    {
        $active = fn (string $model) => $model::where('discovered_status', 'Active')->count();

        return response()->json([
            'providers' => Provider::count(),
            'connected' => Provider::where('status', 'Connected')->count(),
            'discovery_success' => Provider::where('discovery_status', 'success')->count(),
            'nodes' => Node::count(),   // published nodes (ADR-17 / §3.4)
            'templates' => $active(ProviderTemplate::class),
            'networks' => $active(ProviderNetwork::class),
            'datastores' => $active(ProviderDatastore::class),
            'vms' => $active(ProviderVm::class),
        ]);
    }

    private function validateData(Request $request, bool $creating, ?Provider $provider): array
    {
        $req = $creating ? 'required' : 'sometimes';

        return $request->validate([
            'provider_name' => ['required', 'string', 'max:255', $this->uniqueNameCI('providers', 'provider_name', $provider?->id)],
            'provider_type' => ['required', Rule::in(['proxmox', 'openstack', 'olvm'])],
            'endpoint' => ['required', 'string', 'max:1024'],
            'description' => ['nullable', 'string'],

            'discovery_username' => ['required', 'string'],
            'discovery_token_id' => ['required', 'string'],
            'discovery_token_secret' => [$req, 'string'],

            'provision_username' => ['required', 'string'],
            'provision_token_id' => ['required', 'string'],
            'provision_token_secret' => [$req, 'string'],

            'terraform_provider_source' => ['required', 'string'],
            'terraform_provider_version' => ['required', 'string'],

            'auto_discovery_enabled' => ['boolean'],
            'discovery_interval' => ['nullable', Rule::in(['10s', '15s', '20s', '30s', '1m', '2m'])],
        ]);
    }
}
