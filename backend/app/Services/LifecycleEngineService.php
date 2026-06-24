<?php

namespace App\Services;

use App\Jobs\DestroyVmJob;
use App\Models\Environment;
use App\Models\Inventory;
use Illuminate\Support\Carbon;

/**
 * Scheduled expiry engine (04-backend-services.md §6.4 / 08 B.4):
 *   Active + past expiry_date (not permanent)  → Expired, opens a grace window
 *   Expired + past grace_period_until          → auto-destroy (DestroyVmJob) → Deleted
 * Run every minute via `vms:lifecycle` (routes/console.php). Renew/Permanent (Stage 7)
 * push expiry out / clear it, so they naturally drop out of these queries.
 */
class LifecycleEngineService
{
    public function __construct(private AuditService $audit) {}

    /** @return array{expired:int, destroyed:int} */
    public function run(?int $graceMinutes = null): array
    {
        $now = Carbon::now();

        // 1. Expire: Active VMs past their expiry → Expired + grace window (per-environment).
        //    A passed $graceMinutes (e.g. `--grace` for testing) force-overrides all envs.
        $expired = 0;
        Inventory::with('environment')->where('status', 'Active')->where('is_permanent', false)
            ->whereNotNull('expiry_date')->where('expiry_date', '<=', $now)->get()
            ->each(function (Inventory $vm) use (&$expired, $graceMinutes, $now) {
                $grace = $graceMinutes ?? $this->envGraceMinutes($vm->environment) ?? (int) config('provisioning.grace_minutes');
                $graceUntil = $now->copy()->addMinutes($grace);
                $vm->update(['status' => 'Expired', 'grace_period_until' => $graceUntil]);

                // Per-VM trail (actor=system): the expiry transition + the scheduled destroy time.
                $this->audit->log(null, 'VM_EXPIRED',
                    "Virtual machine '{$vm->vm_name}' (vmid: {$this->vmid($vm)}) has expired. Moving to a {$grace}-minute grace period window.",
                    null, $vm->auditMeta(['grace_minutes' => $grace, 'grace_period_until' => $graceUntil->toIso8601String()]));

                $this->audit->log(null, 'VM_GRACE_PERIOD',
                    "Virtual machine '{$vm->vm_name}' (vmid: {$this->vmid($vm)}) is currently in grace period. Auto-destroy scheduled at {$this->wib($graceUntil)}.",
                    null, $vm->auditMeta(['grace_period_until' => $graceUntil->toIso8601String()]));

                $expired++;
            });

        // 2. Auto-destroy: Expired VMs past their grace window. Null the grace marker on
        //    dispatch so the engine doesn't re-queue while the job runs (it sets Deleted).
        $destroyed = 0;
        Inventory::with('environment')->where('status', 'Expired')->whereNotNull('grace_period_until')
            ->where('grace_period_until', '<=', $now)->get()
            ->each(function (Inventory $vm) use (&$destroyed) {
                $vm->update(['grace_period_until' => null]);
                DestroyVmJob::dispatch($vm->id);

                $envName = $vm->environment?->environment_name ?? 'unknown';
                $this->audit->log(null, 'VM_AUTO_DESTROYED',
                    "Grace period elapsed. Automated Terraform destroy dispatched for virtual machine '{$vm->vm_name}' (vmid: {$this->vmid($vm)}) in '{$envName}' environment.",
                    null, $vm->auditMeta(['environment_name' => $envName]));

                $destroyed++;
            });

        return ['expired' => $expired, 'destroyed' => $destroyed];
    }

    /** Human-readable vmid for descriptions (Provisioning rows may not have one yet). */
    private function vmid(Inventory $vm): string
    {
        return $vm->external_vmid ? (string) $vm->external_vmid : 'n/a';
    }

    /** Format an instant in the app timezone (Asia/Jakarta) with a WIB label for the trail. */
    private function wib(Carbon $t): string
    {
        return $t->copy()->timezone(config('app.timezone'))->format('Y-m-d H:i:s').' WIB';
    }

    /** Convert an environment's grace policy (type+value) to minutes; null if unset. */
    private function envGraceMinutes(?Environment $env): ?int
    {
        if (! $env || ! $env->grace_period_value) {
            return null;
        }
        $v = (int) $env->grace_period_value;

        return match ($env->grace_period_type) {
            'minutes' => $v,
            'hours' => $v * 60,
            default => $v * 1440, // days
        };
    }
}

