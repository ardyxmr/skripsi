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
 * Unified "Edit Resources" apply (EDIT_RESOURCES) — bundles a CPU/RAM resize AND data-disk adds into
 * ONE terraform apply. All changes are hotplug (no reboot). Reading + persisting deployment.json once
 * avoids the resize/add-disk race where a separate add-disk job would readResolved STALE cores/memory
 * (ResizeVmJob never persisted them) and revert the resize on its own apply. tries=1.
 *
 * @param  array<int,array{size_gb:int,setup_description:?string}>  $disks
 */
class EditResourcesVmJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 1800;

    public function __construct(
        public int $inventoryId,
        public ?int $cpu = null,
        public ?int $ramMb = null,
        public array $disks = [],
    ) {}

    public function handle(WorkspaceService $workspaces, TerraformRunner $terraform, AuditService $audit): void
    {
        $vm = Inventory::with(['provider', 'environment'])->find($this->inventoryId);
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

        $changes = [];

        // --- CPU / RAM: vary the ONLINE vcpus within the fixed `cores` topology; set memory ---
        if ($this->cpu !== null) {
            $resolved['vcpus'] = min($this->cpu, (int) ($resolved['cores'] ?? $this->cpu));
            $changes[] = "{$resolved['vcpus']} vCPU";
        }
        if ($this->ramMb !== null) {
            $resolved['memory'] = $this->ramMb;
            $changes[] = "{$this->ramMb} MB";
        }

        // --- Data disks: authoritative serialized cap check (the worker runs these one at a time) ---
        $limit = min((int) ($vm->environment?->max_data_disks ?? 0), (int) config('provisioning.max_data_disk_slots'));
        $existing = $vm->disks()->where('disk_index', '>', 0)->count();
        $nextIndex = (int) $vm->disks()->max('disk_index') + 1;
        $added = []; // disk_index => size_gb
        foreach ($this->disks as $d) {
            $size = (int) ($d['size_gb'] ?? 0);
            if ($size <= 0) {
                continue;
            }
            if ($existing >= $limit) {
                $audit->log($vm->owner, 'EDIT_RESOURCES', "Add-disk skipped for {$vm->vm_name}: data-disk cap reached ({$existing}/{$limit})");
                break;
            }
            $slot = 'scsi'.$nextIndex;
            $resolved['data_disks'] = array_values([
                ...($resolved['data_disks'] ?? []),
                ['slot' => $slot, 'size' => $size, 'storage' => $resolved['storage'] ?? null],
            ]);
            $added[$nextIndex] = $size;
            $changes[] = "+{$size}G disk ({$slot})";
            $nextIndex++;
            $existing++;
        }

        if (empty($changes)) {
            $vm->update(['status' => 'Active']); // nothing actionable (e.g. all disks rejected by the cap)
            return;
        }

        // Persist BOTH tfvars and deployment.json, then a SINGLE apply for the whole bundle.
        $workspaces->rerenderTfvars($vm->workspace_path, $resolved);
        $workspaces->writeResolved($vm->workspace_path, $resolved);

        $result = $terraform->apply($vm->workspace_path, $vm->provider);
        if (! $result['ok']) {
            $vm->update(['status' => 'Active', 'error_message' => Str::limit("[edit-resources/{$result['step']}] ".$result['output'], 2000)]);
            $audit->log($vm->owner, 'EDIT_RESOURCES', "Edit Resources FAILED {$vm->vm_name} (step {$result['step']})");

            return;
        }

        // Apply succeeded → reflect into inventory. New raw disks land Pending Setup (admin formats/mounts).
        foreach ($added as $idx => $size) {
            InventoryDisk::create([
                'inventory_id' => $vm->id,
                'disk_index' => $idx,
                'size_gb' => $size,
                'is_primary' => false,
                'setup_status' => 'Pending Setup',
            ]);
        }

        $update = ['status' => 'Active', 'error_message' => null];
        if ($this->cpu !== null) {
            $update['vcpu'] = $resolved['vcpus'] ?? $vm->vcpu;
        }
        if ($this->ramMb !== null) {
            $update['ram_mb'] = $resolved['memory'];
        }
        if (! empty($added)) {
            $update['disk_allocated_gb'] = (int) $vm->disks()->sum('size_gb');
        }
        $vm->update($update);

        $audit->log($vm->owner, 'EDIT_RESOURCES', "Edited {$vm->vm_name}: ".implode(', ', $changes));

        // Event-driven freshness: refresh live runtime facts now (don't wait for the 30s sweep).
        SyncVmFactsJob::dispatch($vm->id);
    }
}
