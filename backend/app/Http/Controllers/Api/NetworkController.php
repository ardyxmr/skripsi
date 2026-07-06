<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\EnforcesUniqueness;
use App\Http\Controllers\Controller;
use App\Models\Network;
use App\Models\ProviderNetwork;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class NetworkController extends Controller
{
    use EnforcesUniqueness;

    public function __construct(private AuditService $audit) {}

    public function index(): JsonResponse
    {
        $rows = Network::with(['provider', 'providerNode', 'providerNetwork'])
            ->withCount(['inventories as active_vms' => fn ($q) => $q->whereNotIn('status', ['Deleted'])])
            ->orderBy('id')->get();

        return response()->json($rows->map(fn (Network $n) => $this->transform($n)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request, true, null);
        $data['provider_node_id'] ??= ProviderNetwork::find($data['provider_network_id'] ?? null)?->provider_node_id;
        $data['created_by'] = $request->user()->id;

        $network = Network::create($data);
        $this->audit->log($request->user(), 'CREATE_NETWORK', "Published network {$network->network_name}", $request);

        return response()->json($this->transform($network->fresh(['provider', 'providerNode', 'providerNetwork'])), 201);
    }

    public function update(Request $request, Network $network): JsonResponse
    {
        $data = $this->validateData($request, false, $network);
        if (! empty($data['provider_network_id'])) {
            $data['provider_node_id'] ??= ProviderNetwork::find($data['provider_network_id'])?->provider_node_id;
        }

        $network->update($data);
        $this->audit->log($request->user(), 'UPDATE_NETWORK', "Updated network {$network->network_name}", $request);

        return response()->json($this->transform($network->fresh(['provider', 'providerNode', 'providerNetwork'])));
    }

    public function destroy(Request $request, Network $network): JsonResponse
    {
        // Block (409) only while a LIVE VM uses it. Historical requests null out on delete; the env
        // network allow-list is node-derived + cascades on delete, so it is not a delete blocker.
        foreach (['inventory' => 'network_id'] as $table => $column) {
            if (\Illuminate\Support\Facades\Schema::hasTable($table)
                && \Illuminate\Support\Facades\DB::table($table)->where($column, $network->id)->exists()) {
                abort(409, 'Network has active VMs. Wait for its VMs to be deleted before deleting it.');
            }
        }

        $name = $network->network_name;
        $network->delete();
        $this->audit->log($request->user(), 'DELETE_NETWORK', "Deleted network {$name}", $request);

        return response()->json(null, 204);
    }

    private function transform(Network $n): array
    {
        return [
            'id' => $n->id,
            'network_name' => $n->network_name,
            'description' => $n->description,
            'provider_id' => $n->provider_id,
            'provider_node_id' => $n->provider_node_id,
            'provider_network_id' => $n->provider_network_id,
            'provider_name' => $n->provider?->provider_name,
            'node_name' => $n->providerNode?->node_name,
            'provider_network_name' => $n->providerNetwork?->network_name,  // the bridge, e.g. vmbr0
            'cidr' => $n->providerNetwork?->cidr,
            'status' => $n->effectiveStatus(),
            'active_vms' => $n->active_vms ?? $n->inventories()->whereNotIn('status', ['Deleted'])->count(),
            'updated_at' => $n->updated_at,
        ];
    }

    private function validateData(Request $request, bool $creating, ?Network $network): array
    {
        $req = $creating ? 'required' : 'sometimes';

        return $request->validate([
            // Network name is unique; a discovered bridge can back exactly ONE published network.
            'network_name' => [$req, 'string', 'max:255', $this->uniqueNameCI('networks', 'network_name', $network?->id)],
            'description' => ['nullable', 'string'],
            'provider_id' => [$req, 'integer', 'exists:providers,id'],
            'provider_network_id' => [$req, 'integer', 'exists:provider_networks,id', Rule::unique('networks', 'provider_network_id')->ignore($network?->id)],
            'provider_node_id' => ['nullable', 'integer', 'exists:provider_nodes,id'],
            'status' => ['nullable', Rule::in(['Active', 'Inactive', 'Disabled'])],
        ], [
            'provider_network_id.unique' => 'This network bridge is already published.',
        ]);
    }
}
