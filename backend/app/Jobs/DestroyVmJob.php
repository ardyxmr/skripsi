<?php

namespace App\Jobs;

use App\Models\Inventory;
use App\Models\User;
use App\Services\AuditService;
use App\Services\Provisioning\TerraformRunner;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

/**
 * Destroys a VM (Stage 7 delete): `terraform destroy` in the VM's own workspace, then
 * status → Deleted. The row + workspace are RETAINED for audit (ADR-08). tries=1.
 */
class DestroyVmJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 1800;

    public function __construct(public int $inventoryId, public ?int $actorId = null) {}

    public function handle(TerraformRunner $terraform, AuditService $audit): void
    {
        $vm = Inventory::with('provider')->find($this->inventoryId);
        $actor = $this->actorId ? User::find($this->actorId) : null;   // user-initiated → actor; engine auto-destroy → null ('system')
        if (! $vm || ! $vm->provider) {
            return;
        }

        if ($vm->workspace_path && is_dir($vm->workspace_path)) {
            $result = $terraform->destroy($vm->workspace_path, $vm->provider);
            if (! $result['ok']) {
                // Roll the optimistic 'Deleting' status back so the row isn't stuck mid-delete.
                $vm->update([
                    'status' => 'Active',
                    'error_message' => Str::limit('[destroy] '.$result['output'], 2000),
                ]);
                $audit->log($actor, 'DELETE_VM', "Destroy FAILED {$vm->vm_name}",
                    null, $vm->auditMeta(['result' => 'failed']));

                return;
            }
        }

        $vm->update(['status' => 'Deleted', 'observed_power_state' => null, 'destroyed_at' => now()]);
        $audit->log($actor, 'DELETE_VM', "Destroyed {$vm->vm_name} (vmid {$vm->external_vmid})",
            null, $vm->auditMeta(['result' => 'success']));
    }
}
