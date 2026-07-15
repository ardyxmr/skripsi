<?php

namespace Tests\Feature\Audit;

use App\Jobs\DestroyVmJob;
use App\Models\ApprovalRequest;
use App\Models\AuditLog;
use App\Services\AuditSeverity;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Bus;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsInfra;
use Tests\TestCase;

/**
 * #10 — the append-only audit trail (AuditService) + its read endpoint. Covers the
 * security-relevant entries not already asserted in AuthTest (which owns LOGIN_FAILED +
 * throttle): successful login/logout, inactive-account, password change, credential
 * reveal (no secret leak), provision/approval/lifecycle entries + structured metadata,
 * and the Administrator-only audit-log API. Bus::fake() so lifecycle jobs don't run.
 */
class AuditTrailTest extends TestCase
{
    use BuildsInfra, RefreshDatabase;

    /** The cookie/CSRF SPA login needs a stateful origin (mirrors the browser). */
    private array $statefulOrigin = ['Origin' => 'http://localhost:5173', 'Referer' => 'http://localhost:5173/'];

    protected function setUp(): void
    {
        parent::setUp();
        Bus::fake();
    }

    private function attemptLogin(string $email, string $password)
    {
        return $this->withHeaders($this->statefulOrigin)
            ->postJson('/api/auth/login', ['email' => $email, 'password' => $password]);
    }

    // ---- Authentication trail -------------------------------------------

    public function test_successful_login_is_audited_and_resets_the_failure_counter(): void
    {
        $this->admin(['email' => 'admin@test.local']);

        // 4 failures (under the limit), then a success that must clear the counter.
        for ($i = 0; $i < 4; $i++) {
            $this->attemptLogin('admin@test.local', 'nope')->assertStatus(401);
        }
        $this->attemptLogin('admin@test.local', 'password')->assertOk();

        $this->assertDatabaseHas('audit_logs', ['action_type' => 'LOGIN']);

        // Counter was reset: 4 more failures stay at 401 (no 429 lockout).
        for ($i = 0; $i < 4; $i++) {
            $this->attemptLogin('admin@test.local', 'nope')->assertStatus(401);
        }
    }

    public function test_logout_is_audited(): void
    {
        // Real login first so the request carries a session (logout invalidates it) — actingAs alone
        // has no session store, which is exactly what logout() needs.
        $admin = $this->admin(['email' => 'logout@test.local']);
        $this->attemptLogin('logout@test.local', 'password')->assertOk();

        $this->withHeaders($this->statefulOrigin)->postJson('/api/auth/logout')->assertNoContent();

        $this->assertDatabaseHas('audit_logs', ['action_type' => 'LOGOUT', 'user_id' => $admin->id]);
    }

    public function test_inactive_account_login_is_rejected_and_audited(): void
    {
        $this->admin(['email' => 'frozen@test.local', 'status' => 'Inactive']);

        $this->attemptLogin('frozen@test.local', 'password')->assertStatus(403);

        $this->assertDatabaseHas('audit_logs', ['action_type' => 'LOGIN_FAILED']);
    }

    public function test_password_change_success_and_failure_are_audited(): void
    {
        $user = $this->regularUser(['email' => 'pw@test.local']);
        Sanctum::actingAs($user);

        // Wrong current password → failure audited, no change.
        $this->postJson('/api/auth/change-password', [
            'email' => 'pw@test.local', 'current_password' => 'WRONG',
            'password' => 'newpass123', 'password_confirmation' => 'newpass123',
        ])->assertStatus(422);
        $this->assertDatabaseHas('audit_logs', ['action_type' => 'PASSWORD_CHANGE_FAILED', 'user_id' => $user->id]);

        // Correct current password → success audited.
        $this->postJson('/api/auth/change-password', [
            'email' => 'pw@test.local', 'current_password' => 'password',
            'password' => 'newpass123', 'password_confirmation' => 'newpass123',
        ])->assertOk();
        $this->assertDatabaseHas('audit_logs', ['action_type' => 'PASSWORD_CHANGED', 'user_id' => $user->id]);
    }

    // ---- Credential reveal (must be audited, must not leak the secret) ---

    public function test_credential_reveal_is_audited_without_leaking_the_password(): void
    {
        $s = $this->seedScenario();
        $owner = $this->regularUser();
        $secret = 'Sup3rS3cret!';
        $vm = $this->inventoryVm($owner, $s, ['login_username' => 'opsadmin', 'login_password' => $secret]);

        Sanctum::actingAs($owner);
        $this->getJson("/api/inventory/{$vm->id}/credentials")
            ->assertOk()
            ->assertJson(['username' => 'opsadmin', 'password' => $secret]);

        $row = AuditLog::where('action_type', 'VIEW_CREDENTIALS')->sole();
        $this->assertSame($owner->id, $row->user_id);
        $this->assertStringNotContainsString($secret, $row->description, 'the audit trail must never store the password');
    }

    public function test_credential_reveal_is_rbac_scoped(): void
    {
        $s = $this->seedScenario();
        $vm = $this->inventoryVm($this->regularUser(), $s, ['login_password' => 'x']);

        Sanctum::actingAs($this->regularUser()); // a different user
        $this->getJson("/api/inventory/{$vm->id}/credentials")->assertNotFound();
        $this->assertDatabaseMissing('audit_logs', ['action_type' => 'VIEW_CREDENTIALS']);
    }

    // ---- Provision / approval / lifecycle entries -----------------------

    public function test_provision_create_is_audited(): void
    {
        $s = $this->seedScenario(['approval_required' => true]);
        Sanctum::actingAs($this->regularUser());

        $this->postJson('/api/provision-requests', $this->provisionPayload($s))->assertCreated();

        $this->assertDatabaseHas('audit_logs', ['action_type' => 'CREATE_PROVISION_REQUEST']);
    }

    public function test_approval_actions_are_audited_with_their_reason(): void
    {
        $s = $this->seedScenario(['approval_required' => true]);
        Sanctum::actingAs($this->regularUser());
        $id = $this->postJson('/api/provision-requests', $this->provisionPayload($s))->json('id');
        $approval = ApprovalRequest::where('reference_id', $id)->where('request_type', 'PROVISION')->sole();

        Sanctum::actingAs($this->manager());
        $this->postJson("/api/approvals/{$approval->id}/approve", ['action_reason' => 'capacity confirmed'])->assertOk();

        $row = AuditLog::where('action_type', 'APPROVE_REQUEST')->sole();
        $this->assertStringContainsString('capacity confirmed', $row->description);

        // The line must name its subject: "PROVISION #16" alone forces the reader into another table.
        $this->assertStringContainsString('test-vm', $row->description);
        $this->assertStringContainsString("#{$id}", $row->description);

        // Metadata keys mirror the ones AuditController filters on, so approvals are reachable by the
        // same per-environment/per-resource filters as every other action.
        $this->assertSame('test-vm', $row->metadata['vm_name']);
        $this->assertSame($s['environment']->id, $row->metadata['environment_id']);
        $this->assertSame('PROVISION', $row->metadata['request_type']);
        $this->assertSame($id, $row->metadata['reference_id']);
        $this->assertSame('Approve', $row->metadata['action']);
        $this->assertSame('Approved', $row->metadata['outcome']);
    }

    /**
     * The same naming applies to a live-asset request (RESIZE/DESTROY/RENEWAL/PERMANENT/ADD_DISK),
     * where the subject comes from Inventory rather than ProvisionRequest.
     */
    public function test_lifecycle_approval_names_the_vm_and_carries_inventory_metadata(): void
    {
        $s = $this->seedScenario(['approval_required' => true]);
        $owner = $this->regularUser();
        $vm = $this->inventoryVm($owner, $s);

        Sanctum::actingAs($owner);
        $this->postJson("/api/inventory/{$vm->id}/resize", ['vm_name_confirmation' => $vm->vm_name, 'cpu' => 4])->assertStatus(202);
        $approval = ApprovalRequest::where('request_type', 'RESIZE')->where('reference_id', $vm->id)->sole();

        Sanctum::actingAs($this->manager());
        $this->postJson("/api/approvals/{$approval->id}/approve", ['action_reason' => 'kapasitas cukup'])->assertOk();

        $row = AuditLog::where('action_type', 'APPROVE_REQUEST')->sole();
        $this->assertStringContainsString($vm->vm_name, $row->description);
        $this->assertSame($vm->vm_name, $row->metadata['vm_name']);
        $this->assertSame($vm->id, $row->metadata['inventory_id']);
        $this->assertSame('RESIZE', $row->metadata['request_type']);
    }

    /**
     * Provisioning is the reference: CREATE_VM is logged against $pr->requester. A lifecycle
     * execution must follow it, or the same event lands on opposite people depending on the path.
     */
    public function test_approved_lifecycle_execution_is_attributed_to_the_requester_not_the_approver(): void
    {
        $s = $this->seedScenario(['approval_required' => true]);
        $owner = $this->regularUser();
        $vm = $this->inventoryVm($owner, $s);

        Sanctum::actingAs($owner);
        $this->postJson("/api/inventory/{$vm->id}/delete", ['vm_name_confirmation' => $vm->vm_name])->assertStatus(202);
        $approval = ApprovalRequest::where('request_type', 'DESTROY')->where('reference_id', $vm->id)->sole();

        $manager = $this->manager();
        Sanctum::actingAs($manager);
        $this->postJson("/api/approvals/{$approval->id}/approve", ['action_reason' => 'go'])->assertOk();

        // The approver owns the decision entry...
        $this->assertSame($manager->id, AuditLog::where('action_type', 'APPROVE_REQUEST')->sole()->user_id);
        // ...but the destroy job must carry the requester.
        Bus::assertDispatched(DestroyVmJob::class, fn ($job) => $job->actorId === $owner->id);
    }

    public function test_batch_approval_states_how_many_machines_it_commits_to(): void
    {
        $s = $this->seedScenario(['approval_required' => true]);
        Sanctum::actingAs($this->regularUser());
        $id = $this->postJson('/api/provision-requests', $this->provisionPayload($s, ['instance_count' => 3]))->json('id');
        $approval = ApprovalRequest::where('reference_id', $id)->where('request_type', 'PROVISION')->sole();

        Sanctum::actingAs($this->manager());
        $this->postJson("/api/approvals/{$approval->id}/approve", ['action_reason' => 'go'])->assertOk();

        $row = AuditLog::where('action_type', 'APPROVE_REQUEST')->sole();
        $this->assertStringContainsString('3× test-vm', $row->description);
        $this->assertSame(3, $row->metadata['instance_count']);
        // vm_name stays the bare name so the metadata filters still match on it.
        $this->assertSame('test-vm', $row->metadata['vm_name']);
    }

    /**
     * Severity spans two axes: an operation is SUCCESS/FAILED, an observed health state is
     * HEALTHY/WARNING/CRITICAL. Calling a downed provider "FAILED" claims an operation broke when
     * nothing was attempted; calling a threshold "SUCCESS" hides it entirely.
     */
    public function test_severity_separates_operations_from_health_states(): void
    {
        $cases = [
            // The verb says CREATE_VM either way — only metadata knows which one failed.
            'failed provision must not read green' => ['CREATE_VM', ['result' => 'failed'], AuditSeverity::FAILED],
            'successful provision' => ['CREATE_VM', ['result' => 'success'], AuditSeverity::SUCCESS],
            'destroy failure' => ['DELETE_VM', ['result' => 'failed'], AuditSeverity::FAILED],

            // Health states, not operations.
            'disconnected provider is critical, not failed' => ['PROVIDER_DISCONNECTED', [], AuditSeverity::CRITICAL],
            'reconnected provider is healthy' => ['PROVIDER_RECONNECTED', [], AuditSeverity::HEALTHY],
            'missing vm is critical' => ['VM_MISSING', [], AuditSeverity::CRITICAL],
            'expiring vm warns' => ['VM_EXPIRED', [], AuditSeverity::WARNING],
            'grace period warns' => ['VM_GRACE_PERIOD', [], AuditSeverity::WARNING],

            // The breach already records which band it crossed — read it, don't guess.
            'capacity warning band' => ['NODE_CAPACITY_BREACH', ['band' => 'warning'], AuditSeverity::WARNING],
            'capacity critical band' => ['NODE_CAPACITY_BREACH', ['band' => 'critical'], AuditSeverity::CRITICAL],
            'capacity recovered' => ['NODE_CAPACITY_RECOVERED', ['band' => 'ok'], AuditSeverity::HEALTHY],

            // Attempted operations that did not complete.
            'login failure' => ['LOGIN_FAILED', [], AuditSeverity::FAILED],
            'blocked approve' => ['PROVISION_BLOCKED', [], AuditSeverity::FAILED],
            'discovery failure' => ['DISCOVERY_FAILED', [], AuditSeverity::FAILED],

            // Neither axis: the portal never initiated it and cannot judge it.
            'out-of-band shutdown' => ['POWER_OFF', [], AuditSeverity::UNKNOWN],

            'plain operation' => ['LOGIN', [], AuditSeverity::SUCCESS],
        ];

        foreach ($cases as $label => [$action, $metadata, $expected]) {
            $this->assertSame($expected, AuditSeverity::for($action, $metadata), $label);
        }
    }

    /**
     * Rows written before ProvisionVmJob recorded a result carry the outcome only in their prose,
     * and an append-only trail can never be corrected in place — so the description is the last
     * resort. Metadata still wins when present.
     */
    public function test_legacy_rows_without_metadata_fall_back_to_the_description(): void
    {
        $legacy = 'Provision FAILED RES-02 (step apply, workspace: /home/app/exovirt/…/RES-02)';
        $this->assertSame(AuditSeverity::FAILED, AuditSeverity::for('CREATE_VM', [], $legacy));

        // A success line must stay green even though it shares the verb.
        $this->assertSame(AuditSeverity::SUCCESS, AuditSeverity::for('CREATE_VM', [], 'Provisioned RES-01 (vmid 101)'));

        // The hyphen is a word boundary, so a case-insensitive match would flag this VM's own name.
        // Matching the caps marker the failure lines actually use keeps it green.
        $this->assertSame(AuditSeverity::SUCCESS, AuditSeverity::for('CREATE_VM', [], 'Provisioned failed-over-db (vmid 102)'));

        // Metadata outranks prose in both directions.
        $this->assertSame(AuditSeverity::SUCCESS, AuditSeverity::for('CREATE_VM', ['result' => 'success'], $legacy));
        $this->assertSame(AuditSeverity::FAILED, AuditSeverity::for('CREATE_VM', ['result' => 'failed'], 'Provisioned RES-01'));
    }

    public function test_severity_is_exposed_on_the_api_payload(): void
    {
        $s = $this->seedScenario(['approval_required' => false]);
        Sanctum::actingAs($this->regularUser());
        $this->postJson('/api/provision-requests', $this->provisionPayload($s))->assertCreated();

        $row = AuditLog::where('action_type', 'CREATE_PROVISION_REQUEST')->sole();
        $this->assertSame(AuditSeverity::SUCCESS, $row->toArray()['severity']);
    }

    public function test_audit_created_at_serialises_with_a_timezone_so_the_ui_can_convert(): void
    {
        $s = $this->seedScenario(['approval_required' => false]);
        Sanctum::actingAs($this->regularUser());
        $this->postJson('/api/provision-requests', $this->provisionPayload($s))->assertCreated();

        $row = AuditLog::where('action_type', 'CREATE_PROVISION_REQUEST')->sole();

        // Without the datetime cast this is a naive string and the frontend's new Date() reads it as
        // browser-local, rendering stored digits as if they were WIB (the -7h prod audit bug).
        $this->assertInstanceOf(Carbon::class, $row->created_at);
        $this->assertMatchesRegularExpression('/(Z|[+-]\d{2}:?\d{2})$/', $row->toArray()['created_at']);
    }

    public function test_renewal_writes_vm_renewed_with_inventory_metadata(): void
    {
        $s = $this->seedScenario(['approval_required' => false, 'expiry_type' => 'days', 'expiry_value' => 30]);
        $owner = $this->regularUser();
        $vm = $this->inventoryVm($owner, $s);

        Sanctum::actingAs($owner);
        $this->postJson("/api/inventory/{$vm->id}/renew", ['extension_period' => '7 Days'])->assertStatus(202);

        $row = AuditLog::where('action_type', 'VM_RENEWED')->sole();
        $this->assertSame($vm->id, $row->metadata['inventory_id']);
        $this->assertSame($s['environment']->id, $row->metadata['environment_id']);
    }

    public function test_make_permanent_is_audited(): void
    {
        $s = $this->seedScenario(['approval_required' => false]);
        $owner = $this->regularUser();
        $vm = $this->inventoryVm($owner, $s, ['expiry_date' => now()->addDays(3)]);

        Sanctum::actingAs($owner);
        $this->postJson("/api/inventory/{$vm->id}/permanent", [])->assertStatus(202);

        $row = AuditLog::where('action_type', 'MAKE_PERMANENT')->sole();
        $this->assertSame($vm->id, $row->metadata['inventory_id']);
    }

    // ---- The audit-log read API -----------------------------------------

    public function test_audit_log_endpoint_is_administrator_only(): void
    {
        AuditLog::create(['user_name' => 'system', 'action_type' => 'LOGIN', 'description' => 'x', 'created_at' => now()]);

        Sanctum::actingAs($this->regularUser());
        $this->getJson('/api/audit-logs')->assertForbidden();

        Sanctum::actingAs($this->manager());
        $this->getJson('/api/audit-logs')->assertForbidden();

        Sanctum::actingAs($this->admin());
        $this->getJson('/api/audit-logs')
            ->assertOk()
            ->assertJsonStructure(['data', 'total', 'per_page', 'current_page', 'last_page', 'action_types']);
    }

    public function test_audit_log_endpoint_filters_by_inventory_id_metadata(): void
    {
        $s = $this->seedScenario(['approval_required' => false]);
        $owner = $this->regularUser();
        $vmA = $this->inventoryVm($owner, $s);
        $vmB = $this->inventoryVm($owner, $s);

        Sanctum::actingAs($owner);
        $this->postJson("/api/inventory/{$vmA->id}/permanent", [])->assertStatus(202);
        $this->postJson("/api/inventory/{$vmB->id}/permanent", [])->assertStatus(202);

        Sanctum::actingAs($this->admin());
        $data = $this->getJson("/api/audit-logs?inventory_id={$vmA->id}")->assertOk()->json('data');

        $this->assertNotEmpty($data);
        foreach ($data as $row) {
            $this->assertSame($vmA->id, $row['metadata']['inventory_id']);
        }
    }
}
