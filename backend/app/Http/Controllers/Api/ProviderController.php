<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Provider;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProviderController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function index(): JsonResponse
    {
        // Secrets are hidden by the model.
        return response()->json(Provider::orderBy('id')->get());
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

    // Statistics widgets — all from the DB, never live API calls (07-api-contract §2).
    public function stats(): JsonResponse
    {
        return response()->json([
            'providers' => Provider::count(),
            'connected' => Provider::where('status', 'Connected')->count(),
            'discovery_success' => Provider::where('discovery_status', 'success')->count(),
            // Discovered-resource counts are wired in Stage 2c.
            'templates' => 0,
            'networks' => 0,
            'datastores' => 0,
            'vms' => 0,
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
