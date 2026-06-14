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
                $vm->update(['status' => 'Expired', 'grace_period_until' => $now->copy()->addMinutes($grace)]);
                $expired++;
            });

        // 2. Auto-destroy: Expired VMs past their grace window. Null the grace marker on
        //    dispatch so the engine doesn't re-queue while the job runs (it sets Deleted).
        $destroyed = 0;
        Inventory::where('status', 'Expired')->whereNotNull('grace_period_until')
            ->where('grace_period_until', '<=', $now)->get()
            ->each(function (Inventory $vm) use (&$destroyed) {
                $vm->update(['grace_period_until' => null]);
                DestroyVmJob::dispatch($vm->id);
                $destroyed++;
            });

        if ($expired || $destroyed) {
            $this->audit->log(null, 'LIFECYCLE_ENGINE', "Expired {$expired}, auto-destroyed {$destroyed}");
        }

        return ['expired' => $expired, 'destroyed' => $destroyed];
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

