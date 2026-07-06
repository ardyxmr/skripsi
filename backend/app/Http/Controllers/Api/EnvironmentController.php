<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\EnforcesUniqueness;
use App\Http\Controllers\Controller;
use App\Models\Environment;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EnvironmentController extends Controller
{
    use EnforcesUniqueness;

    public function __construct(private AuditService $audit) {}

    public function index(): JsonResponse
    {
        $envs = Environment::with(['providers:id', 'tiers:id', 'nodes:id'])
            ->orderBy('display_order')->orderBy('id')->get();

        return response()->json($envs->map(fn (Environment $e) => $this->transform($e)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request, true, null);
        $data['created_by'] = $request->user()->id;

        $env = Environment::create($data);
        $this->syncRules($env, $request);
        $this->audit->log($request->user(), 'CREATE_ENVIRONMENT', "Created environment {$env->environment_name}", $request);

        return response()->json($this->transform($env->fresh(['providers:id', 'tiers:id', 'nodes:id'])), 201);
    }

    public function update(Request $request, Environment $environment): JsonResponse
    {
        $environment->update($this->validateData($request, false, $environment));
        $this->syncRules($environment, $request);
        $this->audit->log($request->user(), 'UPDATE_ENVIRONMENT', "Updated environment {$environment->environment_name}", $request);

        return response()->json($this->transform($environment->fresh(['providers:id', 'tiers:id', 'nodes:id'])));
    }

    public function destroy(Request $request, Environment $environment): JsonResponse
    {
        // Block (409) while LIVE VMs belong to this environment: deleting it would orphan them from
        // their expiry/approval policy. Historical requests + soft-deleted VMs null out on delete.
        $liveVms = \Illuminate\Support\Facades\DB::table('inventory')
            ->where('environment_id', $environment->id)
            ->whereNotIn('status', ['Deleted'])
            ->count();
        if ($liveVms > 0) {
            abort(409, "Environment has {$liveVms} active VM(s). Delete or let them expire before deleting this environment.");
        }

        $name = $environment->environment_name;
        $environment->delete(); // cascades the provider/node/tier rule rows
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
            'nodes' => $environment->nodes()->where('nodes.status', 'Active')
                ->get(['nodes.id', 'nodes.node_name']),
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
        if ($request->has('allowed_node_ids')) {
            $env->nodes()->sync($request->input('allowed_node_ids', []));
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
            'grace_period_type' => $e->grace_period_type,
            'grace_period_value' => $e->grace_period_value,
            'approval_required' => $e->approval_required,
            'allow_data_disk' => $e->allow_data_disk,
            'max_data_disks' => $e->max_data_disks,
            'status' => $e->status,
            'display_order' => $e->display_order,
            'allowed_provider_ids' => $e->providers->pluck('id'),
            'allowed_tier_ids' => $e->tiers->pluck('id'),
            'allowed_node_ids' => $e->nodes->pluck('id'),
            'updated_at' => $e->updated_at,
        ];
    }

    private function validateData(Request $request, bool $creating, ?Environment $environment): array
    {
        $req = $creating ? 'required' : 'sometimes';

        $validated = $request->validate([
            'environment_name' => [$req, 'string', 'max:255', $this->uniqueNameCI('environments', 'environment_name', $environment?->id)],
            'description' => ['nullable', 'string'],
            'expiry_type' => [$req, Rule::in(['days', 'hours', 'minutes', 'permanent', 'lifetime', 'custom'])],
            'expiry_value' => ['nullable', 'integer', 'min:1'],
            'grace_period_type' => ['nullable', Rule::in(['days', 'hours', 'minutes'])],
            'grace_period_value' => ['nullable', 'integer', 'min:1'],
            'approval_required' => ['boolean'],
            'allow_data_disk' => ['boolean'],
            // Policy cap must stay under the physical stub ceiling (ADR-18 two-tier capping).
            'max_data_disks' => ['nullable', 'integer', 'min:0', 'max:'.config('provisioning.max_data_disk_slots')],
            'status' => ['nullable', Rule::in(['Active', 'Inactive'])],
            'display_order' => ['nullable', 'integer'],
            'allowed_provider_ids' => ['array'],
            'allowed_provider_ids.*' => ['integer', 'exists:providers,id'],
            'allowed_tier_ids' => ['array'],
            'allowed_tier_ids.*' => ['integer', 'exists:tiers,id'],
            'allowed_node_ids' => ['array'],
            'allowed_node_ids.*' => ['integer', 'exists:nodes,id'],
        ]);

        // Rule arrays are synced separately, not mass-assigned to the model.
        return collect($validated)->except([
            'allowed_provider_ids', 'allowed_tier_ids', 'allowed_node_ids',
        ])->all();
    }
}
