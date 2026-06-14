<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Node;
use App\Models\ProviderDatastore;
use App\Models\ProviderNetwork;
use App\Models\ProviderTemplate;
use App\Models\ProviderVm;
use App\Services\AuditService;
use App\Services\Discovery\DiscoveryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

// Published nodes (ADR-17) — the fourth published abstraction. CRUD twin of
// DatastoreController, plus a scoped re-sync and a node-scoped Explorer read.
class NodeController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function index(): JsonResponse
    {
        $rows = Node::with(['provider', 'providerNode'])->orderBy('id')->get();

        return response()->json($rows->map(fn (Node $n) => $this->transform($n)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request, true);
        $data['created_by'] = $request->user()->id;

        $node = Node::create($data);
        $this->audit->log($request->user(), 'CREATE_NODE', "Published node {$node->node_name}", $request);

        return response()->json($this->transform($node->fresh(['provider', 'providerNode'])), 201);
    }

    public function update(Request $request, Node $node): JsonResponse
    {
        $node->update($this->validateData($request, false));
        $this->audit->log($request->user(), 'UPDATE_NODE', "Updated node {$node->node_name}", $request);

        return response()->json($this->transform($node->fresh(['provider', 'providerNode'])));
    }

    public function destroy(Request $request, Node $node): JsonResponse
    {
        // Delete blocked (409) if referenced by a request, inventory, or env rule → unpublish instead.
        $refs = [
            'provision_requests' => 'node_id',
            'inventory' => 'node_id',
            'environment_node_rules' => 'node_id',
        ];
        foreach ($refs as $table => $column) {
            if (Schema::hasTable($table) && DB::table($table)->where($column, $node->id)->exists()) {
                abort(409, 'Node is in use by a request, an active VM, or an environment policy. Unpublish it instead.');
            }
        }

        $name = $node->node_name;
        $node->delete();
        $this->audit->log($request->user(), 'DELETE_NODE', "Deleted node {$name}", $request);

        return response()->json(null, 204);
    }

    // Scoped node discovery: refresh operational status + utilization snapshot ("Sync now").
    public function sync(Request $request, Node $node, DiscoveryService $discovery): JsonResponse
    {
        if ($node->providerNode) {
            $discovery->syncNode($node->providerNode);
        }
        $this->audit->log($request->user(), 'SYNC_NODE', "Synced node {$node->node_name}", $request);

        return response()->json($this->transform($node->fresh(['provider', 'providerNode'])));
    }

    // Node-scoped twin of /providers/{id}/explorer — only discovered rows on this node.
    public function explorer(Node $node): JsonResponse
    {
        $providerNodeId = $node->provider_node_id;
        $scoped = fn (string $model) => $providerNodeId
            ? $model::where('provider_node_id', $providerNodeId)->get()
            : collect();

        return response()->json([
            'node' => $this->transform($node->load(['provider', 'providerNode'])),
            'templates' => $scoped(ProviderTemplate::class),
            'networks' => $scoped(ProviderNetwork::class),
            'datastores' => $scoped(ProviderDatastore::class),
            // eager-load providerNode: ProviderVm appends node_name, so avoid an N+1 per row
            'vms' => $providerNodeId ? ProviderVm::with('providerNode')->where('provider_node_id', $providerNodeId)->get() : collect(),
        ]);
    }

    private function transform(Node $n): array
    {
        $pn = $n->providerNode;

        return [
            'id' => $n->id,
            'node_name' => $n->node_name,                       // friendly
            'description' => $n->description,
            'provider_id' => $n->provider_id,
            'provider_node_id' => $n->provider_node_id,
            'provider_name' => $n->provider?->provider_name,
            'provider_node_name' => $pn?->node_name,            // raw, e.g. pve01 (admin-only)
            'cpu_count' => $pn?->cpu_count,
            'cpu_utilization' => $pn?->cpu_utilization,         // snapshot %
            'ram_usage_mb' => $pn?->ram_usage_mb,
            'total_memory' => $pn?->total_memory,               // bytes — RAM% denominator
            'operational_status' => $pn?->status,               // online | offline | unknown
            'last_sync_at' => $pn?->last_sync_at,
            'status' => $n->effectiveStatus(),                  // governance: Active|Inactive|Provider Offline|Missing
            'updated_at' => $n->updated_at,
        ];
    }

    private function validateData(Request $request, bool $creating): array
    {
        $req = $creating ? 'required' : 'sometimes';

        return $request->validate([
            'node_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'provider_id' => [$req, 'integer', 'exists:providers,id'],
            'provider_node_id' => [$req, 'integer', 'exists:provider_nodes,id'],
            'status' => ['nullable', Rule::in(['Active', 'Inactive'])],
        ]);
    }
}
