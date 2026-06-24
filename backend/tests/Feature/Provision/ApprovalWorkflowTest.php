<?php

namespace Tests\Feature\Provision;

use App\Jobs\ProvisionVmJob;
use App\Models\ApprovalRequest;
use App\Models\ProvisionRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsInfra;
use Tests\TestCase;

/**
 * Module 09 — approve / reject / revert (mandatory reason) + revert→resubmit-in-place.
 * Bus::fake() so approving never runs real Terraform; we assert ProvisionVmJob dispatch.
 */
class ApprovalWorkflowTest extends TestCase
{
    use BuildsInfra, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Bus::fake();
    }

    /** Submit as a regular user into an approval-required env and return the Pending approval. */
    private function pendingApproval(array $s, ?User $requester = null): ApprovalRequest
    {
        $requester ??= $this->regularUser();
        Sanctum::actingAs($requester);
        $id = $this->postJson('/api/provision-requests', $this->provisionPayload($s))
            ->assertCreated()->json('id');

        return ApprovalRequest::where('request_type', 'PROVISION')->where('reference_id', $id)->sole();
    }

    // ---- RBAC on approval actions ---------------------------------------

    public function test_regular_user_cannot_approve(): void
    {
        $s = $this->seedScenario();
        $approval = $this->pendingApproval($s);

        Sanctum::actingAs($this->regularUser());
        $this->postJson("/api/approvals/{$approval->id}/approve", ['action_reason' => 'ok'])
            ->assertForbidden();
        Bus::assertNotDispatched(ProvisionVmJob::class);
    }

    public function test_anonymous_cannot_approve(): void
    {
        // Build the approval directly so no actingAs() auth lingers into the request under test.
        $approval = ApprovalRequest::create([
            'request_type' => 'PROVISION',
            'reference_id' => 1,
            'requester_id' => $this->regularUser()->id,
            'status' => 'Pending',
        ]);

        $this->postJson("/api/approvals/{$approval->id}/approve", ['action_reason' => 'ok'])
            ->assertUnauthorized();
    }

    // ---- Approve / Reject / Revert --------------------------------------

    public function test_manager_approve_marks_approved_and_dispatches(): void
    {
        $s = $this->seedScenario();
        $approval = $this->pendingApproval($s);

        Sanctum::actingAs($this->manager());
        $this->postJson("/api/approvals/{$approval->id}/approve", ['action_reason' => 'looks good'])
            ->assertOk()
            ->assertJson(['status' => 'Approved', 'action_type' => 'Approve', 'action_reason' => 'looks good']);

        $this->assertSame('Approved', $approval->fresh()->status);
        Bus::assertDispatched(ProvisionVmJob::class, 1);
    }

    public function test_reject_marks_rejected_and_does_not_dispatch(): void
    {
        $s = $this->seedScenario();
        $approval = $this->pendingApproval($s);

        Sanctum::actingAs($this->manager());
        $this->postJson("/api/approvals/{$approval->id}/reject", ['action_reason' => 'no budget'])
            ->assertOk()->assertJson(['status' => 'Rejected']);

        Bus::assertNotDispatched(ProvisionVmJob::class);
    }

    public function test_revert_marks_reverted_and_does_not_dispatch(): void
    {
        $s = $this->seedScenario();
        $approval = $this->pendingApproval($s);

        Sanctum::actingAs($this->manager());
        $this->postJson("/api/approvals/{$approval->id}/revert", ['action_reason' => 'fix the name'])
            ->assertOk()->assertJson(['status' => 'Reverted']);

        Bus::assertNotDispatched(ProvisionVmJob::class);
    }

    public function test_reason_is_mandatory_for_every_action(): void
    {
        $s = $this->seedScenario();
        $approval = $this->pendingApproval($s);

        Sanctum::actingAs($this->manager());
        foreach (['approve', 'reject', 'revert'] as $action) {
            $this->postJson("/api/approvals/{$approval->id}/{$action}", [])
                ->assertStatus(422)->assertJsonStructure(['error' => ['details' => ['action_reason']]]);
        }
        $this->assertSame('Pending', $approval->fresh()->status);
    }

    public function test_cannot_action_an_already_actioned_request(): void
    {
        $s = $this->seedScenario();
        $approval = $this->pendingApproval($s);

        Sanctum::actingAs($this->manager());
        $this->postJson("/api/approvals/{$approval->id}/approve", ['action_reason' => 'first'])->assertOk();
        // Second action on the same request is rejected by the workflow guard.
        $this->postJson("/api/approvals/{$approval->id}/reject", ['action_reason' => 'second'])
            ->assertStatus(422);

        Bus::assertDispatched(ProvisionVmJob::class, 1); // only the approve dispatched
    }

    public function test_revert_is_rejected_for_a_lifecycle_request_type(): void
    {
        // Revert is PROVISION-only; a live-VM change (e.g. RESIZE) must use Reject.
        $approval = ApprovalRequest::create([
            'request_type' => 'RESIZE',
            'reference_id' => 999,
            'requester_id' => $this->regularUser()->id,
            'status' => 'Pending',
        ]);

        Sanctum::actingAs($this->manager());
        $this->postJson("/api/approvals/{$approval->id}/revert", ['action_reason' => 'nope'])
            ->assertStatus(422);
        $this->assertSame('Pending', $approval->fresh()->status);
    }

    // ---- Index scoping ---------------------------------------------------

    public function test_index_is_scoped_for_regular_users_but_full_for_managers(): void
    {
        $s = $this->seedScenario();
        $mine = $this->regularUser();
        $other = $this->regularUser();
        $this->pendingApproval($s, $mine);
        $this->pendingApproval($s, $other);

        Sanctum::actingAs($mine);
        $this->getJson('/api/approvals')->assertOk()->assertJsonCount(1);

        Sanctum::actingAs($this->manager());
        $this->getJson('/api/approvals')->assertOk()->assertJsonCount(2);
    }

    // ---- Revert → edit → resubmit-in-place ------------------------------

    public function test_reverted_request_can_be_resubmitted_in_place_reopening_the_same_approval(): void
    {
        $s = $this->seedScenario();
        $requester = $this->regularUser();
        $approval = $this->pendingApproval($s, $requester);

        // Manager reverts it.
        Sanctum::actingAs($this->manager());
        $this->postJson("/api/approvals/{$approval->id}/revert", ['action_reason' => 'rename it'])->assertOk();

        // Requester edits + resubmits — same request row, same approval row, back to Pending.
        $pr = ProvisionRequest::sole();
        Sanctum::actingAs($requester);
        $this->putJson("/api/provision-requests/{$pr->id}", $this->provisionPayload($s, ['vm_name' => 'renamed-vm']))
            ->assertOk()
            ->assertJson(['id' => $pr->id, 'resubmitted' => true, 'status' => 'pending_approval']);

        $this->assertDatabaseCount('approval_requests', 1);
        $this->assertSame('Pending', $approval->fresh()->status);
        $this->assertSame('renamed-vm', $pr->fresh()->vm_name);
        Bus::assertNotDispatched(ProvisionVmJob::class);
    }

    public function test_only_reverted_requests_can_be_resubmitted(): void
    {
        $s = $this->seedScenario();
        $requester = $this->regularUser();
        $this->pendingApproval($s, $requester); // still Pending, not Reverted

        $pr = ProvisionRequest::sole();
        Sanctum::actingAs($requester);
        $this->putJson("/api/provision-requests/{$pr->id}", $this->provisionPayload($s))
            ->assertStatus(422);
    }

    public function test_another_user_cannot_resubmit_someone_elses_request(): void
    {
        $s = $this->seedScenario();
        $owner = $this->regularUser();
        $approval = $this->pendingApproval($s, $owner);
        Sanctum::actingAs($this->manager());
        $this->postJson("/api/approvals/{$approval->id}/revert", ['action_reason' => 'edit'])->assertOk();

        $pr = ProvisionRequest::sole();
        Sanctum::actingAs($this->regularUser()); // a different regular user
        $this->putJson("/api/provision-requests/{$pr->id}", $this->provisionPayload($s))
            ->assertForbidden();
    }
}
