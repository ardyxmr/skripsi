<?php

namespace App\Jobs;

use App\Models\CatalogHardeningVersion;
use App\Models\Inventory;
use App\Models\User;
use App\Services\AuditService;
use App\Services\Provisioning\AnsibleRunner;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\Storage;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

/**
 * Runs the VM's catalog hardening playbook over SSH (key-based, ADR-14) in an ISOLATED, RETAINED
 * per-run workspace (audit trail, like the Terraform per-VM workspace, ADR-08). A failure leaves the
 * VM Active (never destructive). The DB audit row references the workspace log path (ADR-12).
 */
class HardenVmJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 1800;

    public function __construct(public int $inventoryId, public ?int $actorId = null, public ?int $versionId = null) {}

    public function handle(AnsibleRunner $ansible, AuditService $audit): void
    {
        $vm = Inventory::with('catalog')->find($this->inventoryId);
        if (! $vm) {
            return;
        }

        // Resolve the SELECTED version (must belong to this VM's catalog + be active); fall back to the
        // latest active version if none was passed.
        $version = CatalogHardeningVersion::where('catalog_id', $vm->catalog_id)->where('is_active', true)->find($this->versionId)
            ?? $vm->catalog?->activeHardeningVersions()->first();
        if (! $version || ! $vm->ip_address) {
            $vm->update(['hardening_status' => 'Failed', 'error_message' => 'Hardening: no selected version or no VM IP.']);

            return;
        }

        // 1. Isolated, retained workspace (audit) — VM-centric so a VM's history is contiguous.
        $ws = storage_path(sprintf('app/ansible-workspaces/%d/%s_%s',
            $vm->id, now()->format('Ymd_His'), $this->actorId ?? 'sys'));
        @mkdir($ws, 0750, true);

        try {
            // 2. Materialize the catalog artifact into the workspace; resolve the entrypoint playbook.
            // (Resolve via the disk — the 'local' disk root is storage/app/private in Laravel 11+.)
            $playbook = $this->materialize(Storage::disk('local')->path($version->playbook_path), $ws);

            // 3. Dynamic inventory — automation private key referenced by PATH, never copied in.
            $inv = "{$ws}/inventory.ini";
            file_put_contents($inv, sprintf(
                "[target]\n%s ansible_user=%s ansible_ssh_private_key_file=%s ansible_python_interpreter=auto_silent\n",
                $vm->ip_address,
                config('provisioning.ansible_ssh_user', 'sysuser'),
                config('provisioning.ansible_private_key_path'),
            ));
            @chmod($inv, 0600);

            // 4. Run.
            $res = $ansible->run($ws, $inv, $playbook);
        } catch (\Throwable $e) {
            $res = ['ok' => false, 'output' => $e->getMessage()];
            @file_put_contents("{$ws}/ansible-execution.log", $e->getMessage());
        }

        // 5. run.json audit metadata alongside the full log.
        @file_put_contents("{$ws}/run.json", json_encode([
            'inventory_id' => $vm->id,
            'vm_name' => $vm->vm_name,
            'ip' => $vm->ip_address,
            'actor_id' => $this->actorId,
            'version_id' => $version->id,
            'version_name' => $version->name,
            'version' => $version->version,
            'playbook' => $version->playbook_filename,
            'playbook_checksum' => $version->checksum,
            'result' => $res['ok'] ? 'Success' : 'Failed',
            'finished_at' => now()->toIso8601String(),
        ], JSON_PRETTY_PRINT));

        // 6. Status — VM stays Active on failure (ADR-14).
        $vm->update($res['ok']
            ? ['hardening_status' => 'Success', 'last_hardened_at' => now(),
                'hardened_version_id' => $version->id, 'hardened_playbook_checksum' => $version->checksum, 'error_message' => null]
            : ['hardening_status' => 'Failed', 'error_message' => Str::limit($res['output'], 1000)]);

        $audit->log(
            $this->actorId ? User::find($this->actorId) : null,
            'HARDEN_VM',
            sprintf('Hardening %s for %s (log: %s)', $res['ok'] ? 'succeeded' : 'FAILED', $vm->vm_name, $ws),
            null,
            $vm->auditMeta([
                'result' => $res['ok'] ? 'success' : 'failed',
                'version_id' => $version->id,
                'version' => $version->version,
            ]),
        );
    }

    /** Single .yml → copy; archive → guarded extract + entrypoint resolution. Returns the abs path. */
    private function materialize(string $src, string $ws): string
    {
        if (preg_match('/\.ya?ml$/i', $src)) {
            copy($src, "{$ws}/playbook.yml");

            return "{$ws}/playbook.yml";
        }

        $play = "{$ws}/play";
        @mkdir($play, 0750, true);

        if (preg_match('/\.zip$/i', $src)) {
            $z = new \ZipArchive;
            if ($z->open($src) !== true) {
                throw new \RuntimeException('Cannot open hardening .zip bundle.');
            }
            for ($i = 0; $i < $z->numFiles; $i++) {
                $n = (string) $z->getNameIndex($i);
                if (str_starts_with($n, '/') || str_contains($n, '..')) {
                    $z->close();
                    throw new \RuntimeException('Unsafe path in hardening bundle.');
                }
            }
            $z->extractTo($play);
            $z->close();
        } else { // .tar.gz
            $list = (string) shell_exec('tar -tzf '.escapeshellarg($src).' 2>/dev/null');
            if ($list === '' || preg_match('#(^|\n)(/|.*\.\./)#', $list)) {
                throw new \RuntimeException('Unsafe or unreadable hardening bundle.');
            }
            shell_exec('tar -xzf '.escapeshellarg($src).' -C '.escapeshellarg($play));
        }

        foreach (['site.yml', 'playbook.yml', 'main.yml', 'site.yaml', 'playbook.yaml', 'main.yaml'] as $f) {
            if (is_file("{$play}/{$f}")) {
                return "{$play}/{$f}";
            }
        }
        throw new \RuntimeException('No entrypoint (site.yml/playbook.yml/main.yml) in the hardening bundle.');
    }
}
