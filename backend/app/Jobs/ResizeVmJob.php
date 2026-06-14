<?php

namespace App\Jobs;

use App\Models\Inventory;
use App\Services\AuditService;
use App\Services\Provisioning\TerraformRunner;
use App\Services\Provisioning\WorkspaceService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

/**
 * Resizes a VM's CPU/RAM (Stage 7, auto-applied on approval). Re-renders ONLY the VM's
 * terraform.tfvars with the new cores/memory and `terraform apply`s in its own workspace —
 * main.tf never changes, siblings are untouched (ADR-08 per-VM). tries=1.
 */
class ResizeVmJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 1800;

    public function __construct(public int $inventoryId, public ?int $cpu = null, public ?int $ramMb = null) {}

    public function handle(WorkspaceService $workspaces, TerraformRunner $terraform, AuditService $audit): void
    {
        $vm = Inventory::with('provider')->find($this->inventoryId);
        if (! $vm) {
            return;
        }
        if (! $vm->provider || ! $vm->workspace_path || ! is_dir($vm->workspace_path)) {
            $vm->update(['status' => 'Active']); // un-stick the transitional state
            return;
        }

        $resolved = $workspaces->readResolved($vm->workspace_path);
        if (! $resolved) {
            $vm->update(['status' => 'Active']);
            return;
        }
        if ($this->cpu !== null) {
            // Change ONLINE vCPUs only (hot-plug); keep the fixed max `cores` topology so no reboot.
            $resolved['vcpus'] = min($this->cpu, (int) ($resolved['cores'] ?? $this->cpu));
        }
        if ($this->ramMb !== null) {
            $resolved['memory'] = $this->ramMb;
        }

        $workspaces->rerenderTfvars($vm->workspace_path, $resolved);
        $result = $terraform->apply($vm->workspace_path, $vm->provider);

        if (! $result['ok']) {
            $vm->update(['status' => 'Active', 'error_message' => Str::limit("[resize/{$result['step']}] ".$result['output'], 2000)]);
            $audit->log($vm->owner, 'RESIZE_VM', "Resize FAILED {$vm->vm_name} (step {$result['step']})");

            return;
        }

        $onlineVcpu = $resolved['vcpus'] ?? ($resolved['cores'] * ($resolved['sockets'] ?? 1));
        $vm->update([
            'status' => 'Active',
            'vcpu' => $onlineVcpu,
            'ram_mb' => $resolved['memory'],
            'error_message' => null,
        ]);
        $audit->log($vm->owner, 'RESIZE_VM', "Resized {$vm->vm_name} → {$onlineVcpu} vCPU / {$resolved['memory']} MB");

        // Event-driven freshness: refresh live runtime facts now (don't wait for the 30s sweep).
        SyncVmFactsJob::dispatch($vm->id);
    }
}
