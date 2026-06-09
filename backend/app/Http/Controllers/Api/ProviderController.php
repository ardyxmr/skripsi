<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Provider;
use App\Models\ProviderDatastore;
use App\Models\ProviderNetwork;
use App\Models\ProviderNode;
use App\Models\ProviderTemplate;
use App\Models\ProviderVm;
use App\Services\AuditService;
use App\Services\Discovery\DiscoveryService;
use App\Services\Discovery\ProviderFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProviderController extends Controller
{
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
        $data = $this->validateData($request, creating: true);

        $provider = Provider::create($data);
        $this->audit->log($request->user(), 'CREATE_PROVIDER', "Registered provider {$provider->provider_name}", $request);

        return response()->json($provider->fresh(), 201);
    }

    public function update(Request $request, Provider $provider): JsonResponse
    {
        $data = $this->validateData($request, creating: false);

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
    public function discover(Request $request, Provider $provider, DiscoveryService $discovery): JsonResponse
    {
        $counts = $discovery->discover($provider);

        return response()->json([
            'discovery_status' => $provider->fresh()->discovery_status,
            'counts' => $counts,
        ]);
    }

    // Read-only Discovery Explorer: discovered resources + health (from the DB).
    public function explorer(Provider $provider): JsonResponse
    {
        return response()->json([
            'connection_status' => $provider->status,
            'discovery_status' => $provider->discovery_status,
            'last_discovery_at' => $provider->last_discovery_at,
            'next_discovery_at' => null,
            'nodes' => ProviderNode::where('provider_id', $provider->id)->get(),
            'templates' => ProviderTemplate::where('provider_id', $provider->id)->get(),
            'networks' => ProviderNetwork::where('provider_id', $provider->id)->get(),
            'datastores' => ProviderDatastore::where('provider_id', $provider->id)->get(),
            'vms' => ProviderVm::where('provider_id', $provider->id)->get(),
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
            'templates' => $active(ProviderTemplate::class),
            'networks' => $active(ProviderNetwork::class),
            'datastores' => $active(ProviderDatastore::class),
            'vms' => $active(ProviderVm::class),
        ]);
    }

    private function validateData(Request $request, bool $creating): array
    {
        $req = $creating ? 'required' : 'sometimes';

        return $request->validate([
            'provider_name' => ['required', 'string', 'max:255'],
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
            'discovery_interval' => ['nullable', Rule::in(['15m', '30m', '1h', '6h', '12h', '24h'])],
        ]);
    }
}
