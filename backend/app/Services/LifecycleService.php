<?php

namespace App\Services;

use App\Jobs\AddDiskJob;
use App\Jobs\DestroyVmJob;
use App\Jobs\EditResourcesVmJob;
use App\Jobs\HardenVmJob;
use App\Jobs\ResizeVmJob;
use App\Models\ApprovalRequest;
use App\Models\Environment;
use App\Models\Inventory;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

/**
 * Day-2 lifecycle for inventory VMs (Stage 7). Mutating actions respect the VM
 * environment's `approval_required` flag (default true = always approval; toggleable
 * per env): when set, a Pending approval_requests row is opened carrying the change in
 * `payload`; otherwise the change is applied immediately. The approval engine calls
 * applyApproved() when a Manager/Admin approves.
 */
class LifecycleService
{
    public function __construct(
        private AuditService $audit,
        private ApproverResolutionService $approverResolution,
    ) {}

    /**
     * @return array{approval_id?:int, queued?:bool}
     */
    public function request(Inventory $vm, string $type, array $payload, string $reason, User $actor): array
    {
        // Expiry is capped to the environment window (now + policy): a renewal tops up toward the
        // cap but can never push past it. If the VM is already at the cap there's no headroom, so
        // reject the extend and steer the user to Permanent. (See cappedRenewal/envExpiryCap.)
        if ($type === 'RENEWAL' && $this->cappedRenewal($vm, $payload['extension_period'] ?? '7 Days') === null) {
            throw ValidationException::withMessages([
                'extension_period' => 'This VM is already at the maximum expiry for its environment. Request Permanent instead.',
            ]);
        }

        // Admins/Managers act without approval; regular users go through it when the env requires it.
        if ($vm->environment?->approval_required && ! $actor->isPrivileged()) {
            $owner = $vm->owner;
            $a = ApprovalRequest::create([
                'request_type' => $type,
                'reference_id' => $vm->id,
                'requester_id' => $actor->id,
                'approver_id' => $owner ? $this->approverResolution->resolve($owner)?->id : null,
                'group_id' => $owner?->group_id,
                'payload' => $payload,
                'status' => 'Pending',
            ]);
            $this->audit->log($actor, "REQUEST_{$type}", "Requested {$type} for {$vm->vm_name}: {$reason}");

            return ['approval_id' => $a->id];
        }

        // No approval gate for this environment → apply now.
        $this->applyChange($vm, $type, $payload, $actor);

        return ['queued' => true];
    }

    /** Called by the approval engine when a lifecycle approval is Approved. */
    public function applyApproved(ApprovalRequest $a): void
    {
        $vm = Inventory::find($a->reference_id);
        if ($vm) {
            // The execution is attributed to the REQUESTER, matching ProvisionVmJob (which logs
            // CREATE_VM against $pr->requester). Crediting the approver here would have the same
            // event attributed to opposite people depending on the path, and would read as "the
            // manager destroyed a VM they never asked for". The approver's role is already recorded
            // in full by the APPROVE_REQUEST entry, so nothing is lost.
            $this->applyChange($vm, $a->request_type, $a->payload ?? [], $a->requester);
        }
    }

    private function applyChange(Inventory $vm, string $type, array $payload, ?User $actor): void
    {
        switch ($type) {
            case 'RENEWAL':
                // Cap the extension to (now + env window); no-op if already at the cap (safety net).
                $newExpiry = $this->cappedRenewal($vm, $payload['extension_period'] ?? '7 Days');
                if ($newExpiry) {
                    // Clear any grace window — a renewed VM is back in good standing, so a stale
                    // grace_period_until must not linger (would show a phantom grace countdown in the UI).
                    $vm->update([
                        'expiry_date' => $newExpiry,
                        'grace_period_until' => null,
                        'status' => $vm->status === 'Expired' ? 'Active' : $vm->status,
                    ]);

                    // Specific, per-VM renewal entry (replaces the generic APPLY_RENEWAL below).
                    $vmid = $vm->external_vmid ?: 'n/a';
                    $this->audit->log($actor, 'VM_RENEWED',
                        "Virtual machine '{$vm->vm_name}' (vmid: {$vmid}) successfully renewed. Stale grace period cleared, new expiry set to {$newExpiry->format('Y-m-d')} (capped at env window).",
                        null,
                        $vm->auditMeta(['new_expiry' => $newExpiry->toIso8601String()])
                    );
                }
                break;

            case 'PERMANENT':
                $vm->update(['is_permanent' => true, 'expiry_date' => null]);
                // Synchronous (no job) → log its single entry here.
                $this->audit->log($actor, 'MAKE_PERMANENT',
                    "Virtual machine '{$vm->vm_name}' (vmid: ".($vm->external_vmid ?: 'n/a').") made permanent — expiry removed.",
                    null, $vm->auditMeta(['result' => 'success']));
                break;

            // Spec-changing mutations: mark Updating up front (transitional state) so the UI
            // shows an in-progress state and the frontend's adaptive poll accelerates; the job
            // flips it back to Active and refreshes runtime facts on completion.
            case 'RESIZE':
                $vm->update(['status' => 'Updating']);
                ResizeVmJob::dispatch($vm->id, $payload['cpu'] ?? null, $payload['ram_mb'] ?? null, $actor?->id);
                break;

            case 'EDIT_RESOURCES': // unified CPU/RAM + data-disk bundle → one apply
                $vm->update(['status' => 'Updating']);
                EditResourcesVmJob::dispatch($vm->id, $payload['cpu'] ?? null, $payload['ram_mb'] ?? null, $payload['disks'] ?? [], $actor?->id);
                break;

            case 'ADD_DISK':
                $vm->update(['status' => 'Updating']);
                AddDiskJob::dispatch($vm->id, (int) ($payload['size_gb'] ?? 0), $payload['setup_description'] ?? null, $actor?->id);
                break;

            case 'DESTROY':
                // Mark Deleting up front so the UI shows a (red) in-progress state while
                // terraform destroy runs; the job flips it to Deleted on success.
                $vm->update(['status' => 'Deleting']);
                DestroyVmJob::dispatch($vm->id, $actor?->id);
                break;

            case 'HARDEN':
                // Hardening is config-only (ADR-14): mark hardening_status Running (not the VM status —
                // the VM stays Active throughout); the job runs the SELECTED version's playbook and
                // flips it Success/Failed. version_id is carried from the request/approval payload.
                $vm->update(['hardening_status' => 'Running']);
                HardenVmJob::dispatch($vm->id, $actor?->id, $payload['version_id'] ?? null);
                break;
        }

        // No generic "APPLY_*" dispatch entry. Each ASYNC lifecycle action is recorded ONCE, at
        // completion, by its own job (RESIZE_VM / ADD_DISK / EDIT_RESOURCES / HARDEN_VM / DELETE_VM)
        // with the real success/failure result + the actual change. The SYNCHRONOUS cases
        // (RENEWAL → VM_RENEWED, PERMANENT → MAKE_PERMANENT) log themselves above. This keeps the
        // audit to one clear "action taken" row per action instead of a dispatch+completion pair.
    }

    /**
     * The renewed expiry for $vm given a requested extension, capped to (now + env window).
     * Returns null when there's no headroom (VM already at/over the cap) → caller blocks the extend.
     */
    private function cappedRenewal(Inventory $vm, string $period): ?Carbon
    {
        $base = $vm->expiry_date && $vm->expiry_date->isFuture() ? $vm->expiry_date : Carbon::now();
        $requested = $this->addPeriod($base, $period);
        $cap = $this->envExpiryCap($vm->environment);
        $newExpiry = $cap ? $requested->min($cap) : $requested;

        return $newExpiry->greaterThan($base) ? $newExpiry : null;
    }

    /** The maximum allowed expiry instant for a VM in this environment: now + policy window (null = no cap). */
    private function envExpiryCap(?Environment $env): ?Carbon
    {
        if (! $env) {
            return null;
        }

        return match ($env->expiry_type) {
            'minutes' => Carbon::now()->addMinutes((int) $env->expiry_value),
            'hours' => Carbon::now()->addHours((int) $env->expiry_value),
            'days', 'custom' => Carbon::now()->addDays((int) $env->expiry_value),
            'lifetime', 'permanent' => null, // no cap (VM would be permanent anyway)
            default => Carbon::now()->addDays((int) ($env->expiry_value ?? 30)),
        };
    }

    /** Parse a "N Unit" string (e.g. "7 Days", "12 Hours") and add it to $base. */
    private function addPeriod(Carbon $base, string $period): Carbon
    {
        [$n, $unit] = array_pad(preg_split('/\s+/', trim($period)), 2, 'days');
        $n = max(1, (int) $n);
        $unit = strtolower(rtrim($unit, 's'));
        $b = $base->copy();

        return match ($unit) {
            'hour' => $b->addHours($n),
            'minute' => $b->addMinutes($n),
            'month' => $b->addMonths($n),
            'week' => $b->addWeeks($n),
            default => $b->addDays($n),
        };
    }
}
