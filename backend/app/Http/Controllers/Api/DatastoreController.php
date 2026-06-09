<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Datastore;
use App\Models\ProviderDatastore;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DatastoreController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function index(): JsonResponse
    {
        $rows = Datastore::with(['provider', 'providerNode', 'providerDatastore'])->orderBy('id')->get();

        return response()->json($rows->map(fn (Datastore $d) => $this->transform($d)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request, true);
        $data['provider_node_id'] ??= ProviderDatastore::find($data['provider_datastore_id'] ?? null)?->provider_node_id;
        $data['created_by'] = $request->user()->id;

        $datastore = Datastore::create($data);
        $this->audit->log($request->user(), 'CREATE_DATASTORE', "Published datastore {$datastore->datastore_name}", $request);

        return response()->json($this->transform($datastore->fresh(['provider', 'providerNode', 'providerDatastore'])), 201);
    }

    public function update(Request $request, Datastore $datastore): JsonResponse
    {
        $data = $this->validateData($request, false);
        if (! empty($data['provider_datastore_id'])) {
            $data['provider_node_id'] ??= ProviderDatastore::find($data['provider_datastore_id'])?->provider_node_id;
        }

        $datastore->update($data);
        $this->audit->log($request->user(), 'UPDATE_DATASTORE', "Updated datastore {$datastore->datastore_name}", $request);

        return response()->json($this->transform($datastore->fresh(['provider', 'providerNode', 'providerDatastore'])));
    }

    public function destroy(Request $request, Datastore $datastore): JsonResponse
    {
        $name = $datastore->datastore_name;
        $datastore->delete();
        $this->audit->log($request->user(), 'DELETE_DATASTORE', "Deleted datastore {$name}", $request);

        return response()->json(null, 204);
    }

    private function transform(Datastore $d): array
    {
        $pd = $d->providerDatastore;

        return [
            'id' => $d->id,
            'datastore_name' => $d->datastore_name,
            'description' => $d->description,
            'provider_id' => $d->provider_id,
            'provider_node_id' => $d->provider_node_id,
            'provider_datastore_id' => $d->provider_datastore_id,
            'provider_name' => $d->provider?->provider_name,
            'node_name' => $d->providerNode?->node_name,
            'provider_datastore_name' => $pd?->datastore_name,   // storage id, e.g. local-lvm
            'datastore_type' => $pd?->datastore_type,
            'total_space' => $pd?->total_space,
            'available_space' => $pd?->available_space,
            'status' => $d->effectiveStatus(),
            'updated_at' => $d->updated_at,
        ];
    }

    private function validateData(Request $request, bool $creating): array
    {
        $req = $creating ? 'required' : 'sometimes';

        return $request->validate([
            'datastore_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'provider_id' => [$req, 'integer', 'exists:providers,id'],
            'provider_datastore_id' => [$req, 'integer', 'exists:provider_datastores,id'],
            'provider_node_id' => ['nullable', 'integer', 'exists:provider_nodes,id'],
            'status' => ['nullable', Rule::in(['Active', 'Inactive', 'Disabled'])],
        ]);
    }
}
