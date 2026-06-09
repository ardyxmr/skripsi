<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Environment;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EnvironmentController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function index(): JsonResponse
    {
        $envs = Environment::with(['providers:id', 'tiers:id', 'networks:id', 'datastores:id'])
            ->orderBy('display_order')->orderBy('id')->get();

        return response()->json($envs->map(fn (Environment $e) => $this->transform($e)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request, true);
        $data['created_by'] = $request->user()->id;

        $env = Environment::create($data);
        $this->syncRules($env, $request);
        $this->audit->log($request->user(), 'CREATE_ENVIRONMENT', "Created environment {$env->environment_name}", $request);

        return response()->json($this->transform($env->fresh(['providers:id', 'tiers:id', 'networks:id', 'datastores:id'])), 201);
    }

    public function update(Request $request, Environment $environment): JsonResponse
    {
        $environment->update($this->validateData($request, false));
        $this->syncRules($environment, $request);
        $this->audit->log($request->user(), 'UPDATE_ENVIRONMENT', "Updated environment {$environment->environment_name}", $request);

        return response()->json($this->transform($environment->fresh(['providers:id', 'tiers:id', 'networks:id', 'datastores:id'])));
    }

    public function destroy(Request $request, Environment $environment): JsonResponse
    {
        $name = $environment->environment_name;
        $environment->delete(); // cascades rule rows
        $this->audit->log($request->user(), 'DELETE_ENVIRONMENT', "Deleted environment {$name}", $request);

        return response()->json(null, 204);
    }

    // Drives wizard Step 1 → Step 2: allowed resources intersected with Active status.
    public function allowedResources(Environment $environment): JsonResponse
    {
        return response()->json([
            'providers' => $environment->providers()->where('providers.status', 'Connected')
                ->get(['providers.id', 'providers.provider_name']),
            'tiers' => $environment->tiers()->where('tiers.status', 'Active')
                ->get(['tiers.id', 'tiers.tier_name', 'tiers.cpu', 'tiers.ram_mb', 'tiers.disk_gb']),
            'networks' => $environment->networks()->where('networks.status', 'Active')
                ->get(['networks.id', 'networks.network_name']),
            'datastores' => $environment->datastores()->where('datastores.status', 'Active')
                ->get(['datastores.id', 'datastores.datastore_name']),
        ]);
    }

    private function syncRules(Environment $env, Request $request): void
    {
        if ($request->has('allowed_provider_ids')) {
            $env->providers()->sync($request->input('allowed_provider_ids', []));
        }
        if ($request->has('allowed_tier_ids')) {
            $env->tiers()->sync($request->input('allowed_tier_ids', []));
        }
        if ($request->has('allowed_network_ids')) {
            $env->networks()->sync($request->input('allowed_network_ids', []));
        }
        if ($request->has('allowed_datastore_ids')) {
            $env->datastores()->sync($request->input('allowed_datastore_ids', []));
        }
    }

    private function transform(Environment $e): array
    {
        return [
            'id' => $e->id,
            'environment_name' => $e->environment_name,
            'description' => $e->description,
            'expiry_type' => $e->expiry_type,
            'expiry_value' => $e->expiry_value,
            'approval_required' => $e->approval_required,
            'allow_data_disk' => $e->allow_data_disk,
            'status' => $e->status,
            'display_order' => $e->display_order,
            'allowed_provider_ids' => $e->providers->pluck('id'),
            'allowed_tier_ids' => $e->tiers->pluck('id'),
            'allowed_network_ids' => $e->networks->pluck('id'),
            'allowed_datastore_ids' => $e->datastores->pluck('id'),
            'updated_at' => $e->updated_at,
        ];
    }

    private function validateData(Request $request, bool $creating): array
    {
        $req = $creating ? 'required' : 'sometimes';

        $validated = $request->validate([
            'environment_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'expiry_type' => [$req, Rule::in(['days', 'hours', 'minutes', 'permanent', 'lifetime', 'custom'])],
            'expiry_value' => ['nullable', 'integer', 'min:1'],
            'approval_required' => ['boolean'],
            'allow_data_disk' => ['boolean'],
            'status' => ['nullable', Rule::in(['Active', 'Inactive'])],
            'display_order' => ['nullable', 'integer'],
            'allowed_provider_ids' => ['array'],
            'allowed_provider_ids.*' => ['integer', 'exists:providers,id'],
            'allowed_tier_ids' => ['array'],
            'allowed_tier_ids.*' => ['integer', 'exists:tiers,id'],
            'allowed_network_ids' => ['array'],
            'allowed_network_ids.*' => ['integer', 'exists:networks,id'],
            'allowed_datastore_ids' => ['array'],
            'allowed_datastore_ids.*' => ['integer', 'exists:datastores,id'],
        ]);

        // Rule arrays are synced separately, not mass-assigned to the model.
        return collect($validated)->except([
            'allowed_provider_ids', 'allowed_tier_ids', 'allowed_network_ids', 'allowed_datastore_ids',
        ])->all();
    }
}
