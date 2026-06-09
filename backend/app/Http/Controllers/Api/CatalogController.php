<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Catalog;
use App\Models\ProviderTemplate;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class CatalogController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function index(): JsonResponse
    {
        $catalogs = Catalog::with(['provider', 'providerTemplate', 'providerNode'])->orderBy('id')->get();

        return response()->json($catalogs->map(fn (Catalog $c) => $this->transform($c)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request, creating: true);
        $data['provider_node_id'] ??= $this->nodeForTemplate($data['provider_template_id'] ?? null);
        $data['created_by'] = $request->user()->id;

        $catalog = Catalog::create($data);
        $this->audit->log($request->user(), 'CREATE_CATALOG', "Published catalog {$catalog->catalog_name}", $request);

        return response()->json($this->transform($catalog->fresh(['provider', 'providerTemplate', 'providerNode'])), 201);
    }

    public function update(Request $request, Catalog $catalog): JsonResponse
    {
        $data = $this->validateData($request, creating: false);
        if (! empty($data['provider_template_id'])) {
            $data['provider_node_id'] ??= $this->nodeForTemplate($data['provider_template_id']);
        }

        $catalog->update($data);
        $this->audit->log($request->user(), 'UPDATE_CATALOG', "Updated catalog {$catalog->catalog_name}", $request);

        return response()->json($this->transform($catalog->fresh(['provider', 'providerTemplate', 'providerNode'])));
    }

    public function destroy(Request $request, Catalog $catalog): JsonResponse
    {
        $name = $catalog->catalog_name;
        if ($catalog->catalog_image) {
            Storage::disk('public')->delete($catalog->catalog_image);
        }
        $catalog->delete();
        $this->audit->log($request->user(), 'DELETE_CATALOG', "Deleted catalog {$name}", $request);

        return response()->json(null, 204);
    }

    // Multipart image upload: png/jpg/jpeg/webp, exactly 512x512, ≤2 MB (§3.2).
    public function uploadImage(Request $request, Catalog $catalog): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048', 'dimensions:width=512,height=512'],
        ]);

        if ($catalog->catalog_image) {
            Storage::disk('public')->delete($catalog->catalog_image);
        }
        $path = $request->file('image')->store('catalog-images', 'public');
        $catalog->update(['catalog_image' => $path]);
        $this->audit->log($request->user(), 'UPDATE_CATALOG', "Uploaded image for {$catalog->catalog_name}", $request);

        return response()->json(['catalog_image' => $this->imageUrl($path)]);
    }

    private function transform(Catalog $c): array
    {
        return [
            'id' => $c->id,
            'catalog_name' => $c->catalog_name,
            'catalog_description' => $c->catalog_description,
            'provider_id' => $c->provider_id,
            'provider_node_id' => $c->provider_node_id,
            'provider_template_id' => $c->provider_template_id,
            'provider_name' => $c->provider?->provider_name,
            'node_name' => $c->providerNode?->node_name,
            'provider_template_name' => $c->providerTemplate?->template_name,
            'status' => $c->effectiveStatus(),
            'catalog_image' => $this->imageUrl($c->catalog_image),
            'updated_at' => $c->updated_at,
        ];
    }

    private function imageUrl(?string $path): ?string
    {
        return $path ? asset('storage/'.$path) : null;
    }

    private function nodeForTemplate(?int $templateId): ?int
    {
        return $templateId ? ProviderTemplate::find($templateId)?->provider_node_id : null;
    }

    private function validateData(Request $request, bool $creating): array
    {
        $req = $creating ? 'required' : 'sometimes';

        return $request->validate([
            'catalog_name' => ['required', 'string', 'max:255'],
            'catalog_description' => ['nullable', 'string'],
            'provider_id' => [$req, 'integer', 'exists:providers,id'],
            'provider_template_id' => [$req, 'integer', 'exists:provider_templates,id'],
            'provider_node_id' => ['nullable', 'integer', 'exists:provider_nodes,id'],
            'status' => ['nullable', Rule::in(['Active', 'Inactive', 'Disabled'])],
        ]);
    }
}
