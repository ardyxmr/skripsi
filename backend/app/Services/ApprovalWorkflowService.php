<?php

namespace App\Services;

use App\Models\ApprovalRequest;
use App\Models\User;
use Illuminate\Validation\ValidationException;

/**
 * The approval engine, decoupled from request type (04-backend-services.md §4.3 / ADR-06).
 * Approve / Reject / Revert with a mandatory reason. Revert ("send back to draft for editing")
 * applies ONLY to PROVISION — the cold-deploy wizard is its editor (revert-resubmit-in-place).
 * Lifecycle changes against a LIVE asset (RESIZE/ADD_DISK/RENEWAL/PERMANENT/DESTROY) have no draft
 * and no wizard editor, so they are Approve/Reject only — Reject leaves the VM in its clean
 * pre-request Active state (the change is simply never applied).
 */
class ApprovalWorkflowService
{
    private const OUTCOME = ['Approve' => 'Approved', 'Reject' => 'Rejected', 'Revert' => 'Reverted'];

    public function __construct(private AuditService $audit) {}

    public function act(ApprovalRequest $approval, User $actor, string $action, ?string $reason): ApprovalRequest
    {
        $reason = trim((string) $reason);
        if ($reason === '') {
            throw ValidationException::withMessages(['action_reason' => 'A reason is required.']);
        }
        if (! isset(self::OUTCOME[$action])) {
            throw ValidationException::withMessages(['action' => 'Invalid action.']);
        }
        if ($approval->status !== 'Pending') {
            throw ValidationException::withMessages(['status' => 'This request has already been actioned.']);
        }
        if ($action === 'Revert' && $approval->request_type !== 'PROVISION') {
            throw ValidationException::withMessages(['action' => 'Revert applies to new-VM (PROVISION) requests only; use Reject for changes to a live VM.']);
        }

        $approval->update([
            'status' => self::OUTCOME[$action],
            'action_type' => $action,
            'action_reason' => $reason,
            'action_date' => now(),
            'approver_id' => $actor->id,
        ]);

        $this->audit->log($actor, strtoupper($action).'_REQUEST', "{$action} {$approval->request_type} #{$approval->reference_id}: {$reason}");

        return $approval;
    }
}
