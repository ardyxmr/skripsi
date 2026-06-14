<?php

namespace App\Jobs;

use App\Models\Inventory;
use App\Models\InventoryDisk;
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
 * Attaches one RAW data disk to a VM (Stage 7, gated ADD_DISK flow — ADR-11/16). Appends a
 * `data_disks` entry to the VM's resolved values, re-renders ONLY terraform.tfvars and applies
 * in the VM's own workspace — main.tf/siblings untouched (ADR-08). Terraform only ATTACHES the
 * disk; formatting/mounting is a deliberate manual admin step (no provisioners). The disk lands
 * as inventory_disks row `Pending Setup`; an admin marks it Ready after in-guest setup. tries=1.
 */
class AddDiskJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 1800;

    public function __construct(public int $inventoryId, public int $sizeGb, public ?string $setupDescription = null) {}

    public function handle(WorkspaceService $workspaces, TerraformRunner $terraform, AuditService $audit): void
    {
        $vm = Inventory::with(['provider', 'environment'])->find($this->inventoryId);
        if (! $vm || ! $vm->provider || ! $vm->workspace_path || ! is_dir($vm->workspace_path)) {
            return;
        }

        $resolved = $workspaces->readResolved($vm->workspace_path);
        if (! $resolved) {
            return;
        }

        // Authoritative, serialized cap check (ADR-18). The controller pre-check can race on the
        // admin-bypass path (those requests open no Pending approval to count), but the queue
        // worker runs add-disk jobs sequentially, so counting committed data disks here is exact.
        // Limit = the env policy cap, hard-bounded by the stub's physical slot ceiling.
        $existing = $vm->disks()->where('disk_index', '>', 0)->count();
        $limit = min((int) ($vm->environment?->max_data_disks ?? 0), (int) config('provisioning.max_data_disk_slots'));
        if ($existing >= $limit) {
            $audit->log($vm->owner, 'ADD_DISK', "Add-disk REJECTED {$vm->vm_name}: data-disk cap reached ({$existing}/{$limit})");

            return;
        }

        // Next free slot/index off the existing disks (boot = index 0 / scsi0).
        $newIndex = (int) $vm->disks()->max('disk_index') + 1;
        $slot = 'scsi'.$newIndex;

        $resolved['data_disks'] = array_values([
            ...($resolved['data_disks'] ?? []),
            ['slot' => $slot, 'size' => $this->sizeGb, 'storage' => $resolved['storage'] ?? null],
        ]);

        $workspaces->rerenderTfvars($vm->workspace_path, $resolved);
        $workspaces->writeResolved($vm->workspace_path, $resolved);

        $result = $terraform->apply($vm->workspace_path, $vm->provider);

        if (! $result['ok']) {
            $vm->update(['error_message' => Str::limit("[add-disk/{$result['step']}] ".$result['output'], 2000)]);
            $audit->log($vm->owner, 'ADD_DISK', "Add-disk FAILED {$vm->vm_name} ({$slot}, step {$result['step']})");

            return;
        }

        // Raw disk attached — admin formats/mounts in-guest, then marks it Ready (disks/{id}/complete).
        InventoryDisk::create([
            'inventory_id' => $vm->id,
            'disk_index' => $newIndex,
            'size_gb' => $this->sizeGb,
            'is_primary' => false,
            'setup_status' => 'Pending Setup',
        ]);

        $vm->update([
            'disk_allocated_gb' => (int) $vm->disks()->sum('size_gb'),
            'error_message' => null,
        ]);

        $audit->log($vm->owner, 'ADD_DISK', "Attached {$this->sizeGb}G raw disk ({$slot}) to {$vm->vm_name}"
            .($this->setupDescription ? " — {$this->setupDescription}" : ''));
    }
}
