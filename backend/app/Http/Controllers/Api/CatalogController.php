<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\EnforcesUniqueness;
use App\Http\Controllers\Concerns\PurgesMissingVms;
use App\Http\Controllers\Controller;
use App\Models\Catalog;
use App\Models\CatalogHardeningVersion;
use App\Models\ProviderTemplate;
use App\Services\AuditService;
use App\Services\NodeCapacityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CatalogController extends Controller
{
    use EnforcesUniqueness, PurgesMissingVms;

    public function __construct(private AuditService $audit, private NodeCapacityService $capacity) {}

    public function index(): JsonResponse
    {
        $catalogs = Catalog::with(['provider', 'providerTemplate', 'providerNode.datastores'])
            ->withCount(['inventories as active_vms' => fn ($q) => $q->whereNotIn('status', ['Deleted'])])
            ->orderBy('id')->get();

        return response()->json($catalogs->map(fn (Catalog $c) => $this->transform($c)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request, creating: true, catalog: null);
        $data['provider_node_id'] ??= $this->nodeForTemplate($data['provider_template_id'] ?? null);
        $data['created_by'] = $request->user()->id;

        $catalog = Catalog::create($data);
        $this->audit->log($request->user(), 'CREATE_CATALOG', "Published catalog {$catalog->catalog_name}", $request);

        return response()->json($this->transform($catalog->fresh(['provider', 'providerTemplate', 'providerNode.datastores'])), 201);
    }

    public function update(Request $request, Catalog $catalog): JsonResponse
    {
        $data = $this->validateData($request, creating: false, catalog: $catalog);
        if (! empty($data['provider_template_id'])) {
            $data['provider_node_id'] ??= $this->nodeForTemplate($data['provider_template_id']);
        }

        $catalog->update($data);
        $this->audit->log($request->user(), 'UPDATE_CATALOG', "Updated catalog {$catalog->catalog_name}", $request);

        return response()->json($this->transform($catalog->fresh(['provider', 'providerTemplate', 'providerNode.datastores'])));
    }

    public function destroy(Request $request, Catalog $catalog): JsonResponse
    {
        // Block (409) only while a LIVE VM uses it (historical requests null out on delete). To swap
        // the image, edit the catalog (→ new template) rather than deleting, so its history stays intact.
        // Missing VMs (gone from the hypervisor) must not block deletion — purge them first, then
        // block only if a LIVE VM still references the catalog.
        $this->purgeMissingVms('catalog_id', $catalog->id);
        foreach (['inventory' => 'catalog_id'] as $table => $column) {
            if (Schema::hasTable($table)
                && DB::table($table)->where($column, $catalog->id)->exists()) {
                abort(409, 'Catalog has active VMs. To change its image, edit the catalog and select the new template, or set it inactive. Delete it only once no VMs reference it.');
            }
        }

        $name = $catalog->catalog_name;
        if ($catalog->catalog_image) {
            Storage::disk('public')->delete($catalog->catalog_image);
        }
        Storage::disk('local')->deleteDirectory("catalog-hardening/{$catalog->id}");
        $catalog->delete();
        $this->audit->log($request->user(), 'DELETE_CATALOG', "Deleted catalog {$name}", $request);

        return response()->json(null, 204);
    }

    // Multipart image upload: png/jpg/jpeg/webp, ANY size up to 8 MB. The server normalizes every
    // upload to a 512×512 PNG (fit-and-center, transparent padding — preserves the whole image, no
    // distortion or cropping), so the catalog display is always consistent regardless of source size.
    public function uploadImage(Request $request, Catalog $catalog): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'mimes:png,jpg,jpeg,webp', 'max:8192'],
        ]);

        $png = $this->normalizeToSquarePng($request->file('image'), 512);

        if ($catalog->catalog_image) {
            Storage::disk('public')->delete($catalog->catalog_image);
        }
        $path = 'catalog-images/'.Str::random(40).'.png';
        Storage::disk('public')->put($path, $png);
        $catalog->update(['catalog_image' => $path]);
        $this->audit->log($request->user(), 'UPDATE_CATALOG', "Uploaded image for {$catalog->catalog_name}", $request);

        return response()->json(['catalog_image' => $this->imageUrl($path)]);
    }

    // Resize any uploaded image into a {size}×{size} PNG: scale to FIT (the whole image stays
    // visible), center it, and pad the remainder transparently. Uses GD; never upscales beyond fit.
    private function normalizeToSquarePng($file, int $size): string
    {
        $src = @imagecreatefromstring($file->get());
        if ($src === false) {
            abort(422, 'Unsupported or corrupt image file.');
        }
        $w = imagesx($src);
        $h = imagesy($src);
        $scale = min($size / $w, $size / $h);           // FIT (contain) — no cropping
        $nw = max(1, (int) round($w * $scale));
        $nh = max(1, (int) round($h * $scale));

        $dst = imagecreatetruecolor($size, $size);
        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        imagefilledrectangle($dst, 0, 0, $size, $size, imagecolorallocatealpha($dst, 0, 0, 0, 127));
        imagecopyresampled($dst, $src, (int) (($size - $nw) / 2), (int) (($size - $nh) / 2), 0, 0, $nw, $nh, $w, $h);

        ob_start();
        imagepng($dst);
        $bin = ob_get_clean();

        imagedestroy($src);
        imagedestroy($dst);

        return $bin;
    }

    // List a catalog's hardening playbook versions (active first). Any authenticated user — the harden
    // modal reads this to let the user pick a version.
    public function listHardening(Catalog $catalog): JsonResponse
    {
        $rows = $catalog->hardeningVersions()->orderByDesc('is_active')->orderByDesc('id')->get();

        return response()->json($rows->map(fn (CatalogHardeningVersion $v) => [
            'id' => $v->id,
            'name' => $v->name,
            'version' => $v->version,
            'playbook_filename' => $v->playbook_filename,
            'checksum' => $v->checksum,
            'is_active' => $v->is_active,
            'created_at' => $v->created_at,
        ]));
    }

    // Add a NEW named/versioned hardening playbook (admin). Versions are immutable + get their own
    // dir; accepts a single .yml/.yaml OR a .tar.gz/.zip bundle, validated before commit.
    public function uploadHardening(Request $request, Catalog $catalog): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'version' => ['required', 'string', 'max:40'],
            'playbook' => ['required', 'file', 'max:2048'], // KB → 2 MB
        ]);
        $file = $request->file('playbook');
        $ext = strtolower($file->getClientOriginalExtension());          // tar.gz arrives as "gz"
        abort_unless(in_array($ext, ['yml', 'yaml', 'gz', 'zip'], true), 422, 'Unsupported file — use .yml, .yaml, .tar.gz, or .zip.');

        // Create the row first to get an id for the per-version directory.
        $ver = $catalog->hardeningVersions()->create([
            'name' => $data['name'], 'version' => $data['version'],
            'playbook_path' => '', 'playbook_filename' => $file->getClientOriginalName(),
            'checksum' => '', 'is_active' => true, 'uploaded_by' => $request->user()->id,
        ]);

        $dir = "catalog-hardening/{$catalog->id}/{$ver->id}";
        $storedName = match ($ext) {
            'gz' => 'bundle.tar.gz', 'zip' => 'bundle.zip', default => 'playbook.yml'
        };
        $path = $file->storeAs($dir, $storedName, 'local');
        $abs = Storage::disk('local')->path($path);

        if ($err = $this->validateHardeningArtifact($abs, $ext)) {
            Storage::disk('local')->deleteDirectory($dir);
            $ver->delete();
            abort(422, $err);
        }

        $ver->update(['playbook_path' => $path, 'checksum' => hash_file('sha256', $abs)]);
        $this->audit->log($request->user(), 'UPLOAD_HARDENING', "Added hardening version {$data['name']} {$data['version']} to catalog {$catalog->catalog_name}", $request);

        return $this->listHardening($catalog);
    }

    // Retire (not delete) a version — keeps the row + file so VMs that applied it keep a valid reference.
    public function retireHardening(Request $request, Catalog $catalog, CatalogHardeningVersion $version): JsonResponse
    {
        abort_unless($version->catalog_id === $catalog->id, 404);
        $version->update(['is_active' => false]);
        $this->audit->log($request->user(), 'RETIRE_HARDENING', "Retired hardening version {$version->name} {$version->version} from catalog {$catalog->catalog_name}", $request);

        return $this->listHardening($catalog);
    }

    // null if valid; otherwise an error message. Single playbook → ansible syntax-check; archive →
    // reject absolute/`..` paths (traversal) and require an entrypoint (site/playbook/main.yml).
    private function validateHardeningArtifact(string $abs, string $ext): ?string
    {
        if (in_array($ext, ['yml', 'yaml'], true)) {
            // The syntax-check runs SYNCHRONOUSLY as the web user (www-data), whose HOME (/var/www) is
            // not writable — so ansible can't create ~/.ansible/tmp and the check errors out with a
            // permission-denied that looks like a bad playbook. Point HOME and ansible's local temp at a
            // writable storage dir instead. (The real hardening run happens on the queue worker, whose
            // HOME is writable, so it's unaffected — this only bites the sync upload validation.)
            $ansibleHome = storage_path('app/ansible-tmp');
            if (! is_dir($ansibleHome)) {
                @mkdir($ansibleHome, 0775, true);
            }

            $res = Process::timeout(30)
                ->env([
                    'HOME' => $ansibleHome,
                    'ANSIBLE_LOCAL_TEMP' => $ansibleHome.'/tmp',
                    'ANSIBLE_NOCOLOR' => '1',
                ])
                ->run(['ansible-playbook', '--syntax-check', $abs]);

            return $res->successful() ? null : 'Playbook failed ansible syntax-check: '.Str::limit($res->errorOutput() ?: $res->output(), 300);
        }
        if ($ext === 'gz') {
            $list = (string) shell_exec('tar -tzf '.escapeshellarg($abs).' 2>/dev/null');
            if ($list === '') {
                return 'Could not read the .tar.gz archive.';
            }
            if (preg_match('#(^|\n)(/|.*\.\./)#', $list)) {
                return 'Archive contains unsafe (absolute or ../) paths.';
            }

            return preg_match('#(^|\n)[^\n]*(site|playbook|main)\.ya?ml#', $list) ? null : 'No entrypoint (site.yml / playbook.yml / main.yml) in the bundle.';
        }
        if (! class_exists(\ZipArchive::class)) {
            return 'ZIP support unavailable on the server.';
        }
        $z = new \ZipArchive;
        if ($z->open($abs) !== true) {
            return 'Could not read the .zip archive.';
        }
        $hasEntry = false;
        for ($i = 0; $i < $z->numFiles; $i++) {
            $n = (string) $z->getNameIndex($i);
            if (str_starts_with($n, '/') || str_contains($n, '..')) {
                $z->close();

                return 'Archive contains unsafe (absolute or ../) paths.';
            }
            if (preg_match('#(^|/)(site|playbook|main)\.ya?ml$#', $n)) {
                $hasEntry = true;
            }
        }
        $z->close();

        return $hasEntry ? null : 'No entrypoint (site.yml / playbook.yml / main.yml) in the bundle.';
    }

    private function transform(Catalog $c): array
    {
        return [
            'id' => $c->id,
            'catalog_name' => $c->catalog_name,
            'has_hardening' => $c->hasHardening(),
            'hardening_version_count' => $c->activeHardeningVersions()->count(),
            // Usage: VMs (non-Deleted) provisioned from this catalog. Set via withCount() in index();
            // store/update fall back to a direct count so the value is always present.
            'active_vms' => $c->active_vms ?? $c->inventories()->whereNotIn('status', ['Deleted'])->count(),
            'catalog_description' => $c->catalog_description,
            'provider_id' => $c->provider_id,
            'provider_node_id' => $c->provider_node_id,
            'provider_template_id' => $c->provider_template_id,
            'provider_name' => $c->provider?->provider_name,
            'node_name' => $c->providerNode?->node_name,
            'provider_template_name' => $c->providerTemplate?->template_name,
            // Capacity of the node this catalog is bound to → wizard shows a warning badge and grays
            // the catalog out when provisioning_blocked (admin toggle + critical).
            'node_capacity' => $this->capacity->snapshot($c->providerNode),
            'status' => $c->effectiveStatus(),
            'catalog_image' => $this->imageUrl($c->catalog_image),
            'updated_at' => $c->updated_at,
        ];
    }

    private function imageUrl(?string $path): ?string
    {
        // Return a RELATIVE URL so the browser fetches it same-origin (through the Vite /storage proxy
        // in dev, nginx in prod). asset() bakes in APP_URL (http://localhost:8000), which 404s from any
        // non-localhost access (VM-IP / forwarded port) and leaves the catalog icon blank.
        return $path ? '/storage/'.$path : null;
    }

    private function nodeForTemplate(?int $templateId): ?int
    {
        return $templateId ? ProviderTemplate::find($templateId)?->provider_node_id : null;
    }

    private function validateData(Request $request, bool $creating, ?Catalog $catalog): array
    {
        $req = $creating ? 'required' : 'sometimes';

        return $request->validate([
            // Catalog name is unique; a discovered template can back exactly ONE catalog.
            'catalog_name' => [$req, 'string', 'max:255', $this->uniqueNameCI('catalogs', 'catalog_name', $catalog?->id)],
            'catalog_description' => ['nullable', 'string'],
            'provider_id' => [$req, 'integer', 'exists:providers,id'],
            'provider_template_id' => [$req, 'integer', 'exists:provider_templates,id', Rule::unique('catalogs', 'provider_template_id')->ignore($catalog?->id)],
            'provider_node_id' => ['nullable', 'integer', 'exists:provider_nodes,id'],
            'status' => ['nullable', Rule::in(['Active', 'Inactive', 'Disabled'])],
        ], [
            'provider_template_id.unique' => 'This template is already published as a catalog.',
        ]);
    }
}
