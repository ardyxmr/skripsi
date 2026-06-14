<?php

namespace App\Services\Provisioning;

use App\Models\ProvisionRequest;
use Illuminate\Support\Str;

/**
 * Builds the per-VM Terraform workspace (ADR-08, per-VM):
 *   storage/app/provisioning/{username}/date_pr{ddmmYYYY_His}/{vm_name}/
 * The request folder is derived from the request's created_at so every parallel job in
 * a batch lands under the SAME request folder, each in its own {vm_name} subdir.
 */
class WorkspaceService
{
    // Stub variants by config (ADR-18 §4). 'structured' = non-deprecated Telmate `disks` block;
    // 'legacy' = the deprecated indexable `disk` list. Existing VMs keep their copied stub.
    private const STUB_DIRS = [
        'structured' => 'master-provisioning/terraform-structured',
        'legacy' => 'master-provisioning/terraform',
    ];

    public function __construct(private TerraformRenderer $renderer) {}

    /** The stub directory new provisions copy from, chosen by config('provisioning.stub_variant'). */
    private function stubDir(): string
    {
        $variant = config('provisioning.stub_variant', 'structured');

        return self::STUB_DIRS[$variant] ?? self::STUB_DIRS['structured'];
    }

    /** @return array{path:string, statePath:string} */
    public function prepare(ProvisionRequest $pr, string $vmName, array $resolved): array
    {
        $user = Str::slug($pr->requester?->name ?? '') ?: ('user'.$pr->requester_id);
        $stamp = ($pr->created_at ?? now())->format('dmY_His');
        $rel = "provisioning/{$user}/date_pr{$stamp}/{$vmName}";
        $path = storage_path("app/{$rel}");

        if (! is_dir($path)) {
            mkdir($path, 0755, recursive: true);
        }
        @mkdir("{$path}/logs", 0755, recursive: true);

        // Copy the variable-driven stubs verbatim (from the configured variant).
        $variant = config('provisioning.stub_variant', 'structured');
        $stub = storage_path('app/'.$this->stubDir());
        foreach (['main.tf', 'variables.tf'] as $f) {
            copy("{$stub}/{$f}", "{$path}/{$f}");
        }

        // Render the workspace-specific files.
        file_put_contents("{$path}/provider.tf", $this->renderer->providerTf($pr->provider));
        file_put_contents("{$path}/terraform.tfvars", $this->renderer->tfvars($resolved));
        file_put_contents("{$path}/deployment.json", json_encode([
            'provision_request_id' => $pr->id,
            'vm_name' => $vmName,
            'requester' => $pr->requester?->email,
            'environment_id' => $pr->environment_id,
            'stub_variant' => $variant,
            'created_at' => now()->toIso8601String(),
            'resolved' => $resolved,
        ], JSON_PRETTY_PRINT));

        return ['path' => $path, 'statePath' => "{$path}/terraform.tfstate"];
    }

    /** Re-write ONLY terraform.tfvars in an existing workspace (Stage 7 resize). main.tf is untouched. */
    public function rerenderTfvars(string $workspacePath, array $resolved): void
    {
        file_put_contents("{$workspacePath}/terraform.tfvars", $this->renderer->tfvars($resolved));
    }

    /** Read back the resolved values stored in a workspace's deployment.json. */
    public function readResolved(string $workspacePath): array
    {
        $file = "{$workspacePath}/deployment.json";
        if (! is_file($file)) {
            return [];
        }

        return json_decode(file_get_contents($file), true)['resolved'] ?? [];
    }

    /** Persist updated resolved values back into deployment.json (Stage 7 add-disk) so a later
     *  resize re-render keeps the data disks. Other keys in the file are preserved. */
    public function writeResolved(string $workspacePath, array $resolved): void
    {
        $file = "{$workspacePath}/deployment.json";
        $data = is_file($file) ? (json_decode(file_get_contents($file), true) ?: []) : [];
        $data['resolved'] = $resolved;
        file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
    }
}
