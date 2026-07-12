<?php

namespace Tests\Feature\Lifecycle;

use App\Jobs\AddDiskJob;
use App\Jobs\DestroyVmJob;
use App\Jobs\ProvisionVmJob;
use App\Jobs\ResizeVmJob;
use App\Models\ApprovalRequest;
use App\Models\Group;
use App\Models\Inventory;
use App\Models\ProviderVm;
use App\Models\ProvisionRequest;
use App\Services\VmFactSyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsInfra;
use Tests\TestCase;

/**
 * Stage 7 — day-2 lifecycle (renew / permanent / resize / add-disk / delete / retry) +
 * regression guards locking previously-fixed invariants. Bus::fake() so no lifecycle job
 * ever runs Terraform; dispatch is asserted instead.
 *
 * NOTE: the original "6 fixed bugs" list lived in a lost TaskList. The guards below pin the
 * invariants the production code comments explicitly call out as bug fixes (phantom grace
 * countdown, expiry-cap headroom, deleted-row retention, in-flight disk-cap counting,
 * privileged bypass, destructive-action name confirmation).
 */
class LifecycleTest extends TestCase
{
    use BuildsInfra, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Bus::fake();
    }

    private function confirm(Inventory $vm, array $extra = []): array
    {
        return array_merge(['vm_name_confirmation' => $vm->vm_name], $extra);
    }

    // ---- Approval routing for lifecycle ---------------------------------

    public function test_regular_user_resize_in_approval_env_opens_pending_and_does_not_dispatch(): void
    {
        $s = $this->seedScenario(['approval_required' => true]);
        $owner = $this->regularUser();
        $vm = $this->inventoryVm($owner, $s);

        Sanctum::actingAs($owner);
        $this->postJson("/api/inventory/{$vm->id}/resize", $this->confirm($vm, ['cpu' => 4]))
            ->assertStatus(202)->assertJsonStructure(['approval_id']);

        $this->assertDatabaseHas('approval_requests', [
            'request_type' => 'RESIZE', 'reference_id' => $vm->id, 'status' => 'Pending',
        ]);
        $this->assertSame('Active', $vm->fresh()->status); // not yet Updating — waiting on approval
        Bus::assertNotDispatched(ResizeVmJob::class);
    }

    public function test_approving_a_resize_dispatches_the_job_and_marks_updating(): void
    {
        $s = $this->seedScenario(['approval_required' => true]);
        $owner = $this->regularUser();
        $vm = $this->inventoryVm($owner, $s);

        Sanctum::actingAs($owner);
        $this->postJson("/api/inventory/{$vm->id}/resize", $this->confirm($vm, ['cpu' => 8]))->assertStatus(202);
        $approval = ApprovalRequest::where('request_type', 'RESIZE')->where('reference_id', $vm->id)->sole();

        Sanctum::actingAs($this->manager());
        $this->postJson("/api/approvals/{$approval->id}/approve", ['action_reason' => 'ok'])->assertOk();

        $this->assertSame('Updating', $vm->fresh()->status);
        Bus::assertDispatched(ResizeVmJob::class, fn (ResizeVmJob $j) => $j->inventoryId === $vm->id && $j->cpu === 8);
    }

    public function test_privileged_resize_applies_immediately_without_approval(): void
    {
        $s = $this->seedScenario(['approval_required' => true]);
        $vm = $this->inventoryVm($this->regularUser(), $s);

        Sanctum::actingAs($this->admin());
        $this->postJson("/api/inventory/{$vm->id}/resize", $this->confirm($vm, ['ram_mb' => 4096]))
            ->assertStatus(202)->assertJson(['queued' => true]);

        $this->assertDatabaseCount('approval_requests', 0);
        $this->assertSame('Updating', $vm->fresh()->status);
        Bus::assertDispatched(ResizeVmJob::class, 1);
    }

    // ---- PERMANENT -------------------------------------------------------

    public function test_permanent_clears_expiry_and_sets_flag(): void
    {
        $s = $this->seedScenario(['approval_required' => false]);
        $owner = $this->regularUser();
        $vm = $this->inventoryVm($owner, $s, ['expiry_date' => now()->addDays(5), 'is_permanent' => false]);

        Sanctum::actingAs($owner);
        $this->postJson("/api/inventory/{$vm->id}/permanent", [])->assertStatus(202);

        $vm->refresh();
        $this->assertTrue((bool) $vm->is_permanent);
        $this->assertNull($vm->expiry_date);
    }

    // ---- DESTROY ---------------------------------------------------------

    public function test_destroy_marks_deleting_and_dispatches(): void
    {
        $s = $this->seedScenario(['approval_required' => false]);
        $owner = $this->regularUser();
        $vm = $this->inventoryVm($owner, $s);

        Sanctum::actingAs($owner);
        $this->postJson("/api/inventory/{$vm->id}/delete", $this->confirm($vm))->assertStatus(202);

        $this->assertSame('Deleting', $vm->fresh()->status);
        Bus::assertDispatched(DestroyVmJob::class, fn (DestroyVmJob $j) => $j->inventoryId === $vm->id);
    }

    // ---- Missing VM (gone from the hypervisor) — hard-purge + non-blocking (#5) ----

    public function test_deleting_a_missing_vm_purges_row_and_explorer_entry_without_approval(): void
    {
        $s = $this->seedScenario(['approval_required' => false]);
        $vm = $this->inventoryVm($this->regularUser(), $s, ['status' => 'Missing']);
        // The stale discovered row that the Discovery/Node Explorer shows as "Missing".
        ProviderVm::create([
            'provider_id' => $s['provider']->id,
            'provider_node_id' => $s['providerNode']->id,
            'external_vmid' => $vm->external_vmid,
            'discovered_status' => 'Missing',
        ]);

        Sanctum::actingAs($this->admin());
        // No name confirmation needed — a Missing VM is hard-removed directly, not routed to Terraform.
        $this->postJson("/api/inventory/{$vm->id}/delete")->assertOk()->assertJson(['purged' => true]);

        $this->assertDatabaseMissing('inventory', ['id' => $vm->id]);
        $this->assertDatabaseMissing('provider_vms', ['provider_id' => $s['provider']->id, 'external_vmid' => $vm->external_vmid]);
        Bus::assertNotDispatched(DestroyVmJob::class);
        $this->assertSame(0, ApprovalRequest::where('reference_id', $vm->id)->where('request_type', 'DESTROY')->count());
    }

    public function test_missing_vm_does_not_block_resource_deletion_and_is_auto_purged(): void
    {
        $s = $this->seedScenario();
        $vm = $this->inventoryVm($this->regularUser(), $s, ['status' => 'Missing']);
        ProviderVm::create([
            'provider_id' => $s['provider']->id,
            'provider_node_id' => $s['providerNode']->id,
            'external_vmid' => $vm->external_vmid,
            'discovered_status' => 'Missing',
        ]);

        Sanctum::actingAs($this->admin());
        $this->deleteJson("/api/catalogs/{$s['catalog']->id}")->assertNoContent();

        $this->assertDatabaseMissing('catalogs', ['id' => $s['catalog']->id]);
        $this->assertDatabaseMissing('inventory', ['id' => $vm->id]);   // Missing VM auto-purged
        $this->assertDatabaseMissing('provider_vms', ['provider_id' => $s['provider']->id, 'external_vmid' => $vm->external_vmid]);
    }

    public function test_active_vm_still_blocks_resource_deletion(): void
    {
        $s = $this->seedScenario();
        $this->inventoryVm($this->regularUser(), $s, ['status' => 'Active']);

        Sanctum::actingAs($this->admin());
        $this->deleteJson("/api/catalogs/{$s['catalog']->id}")->assertStatus(409);
    }

    public function test_sync_flags_active_vm_missing_when_discovery_marks_its_provider_vm_missing(): void
    {
        $s = $this->seedScenario();   // provider defaults to Connected
        $vm = $this->inventoryVm($this->regularUser(), $s, ['status' => 'Active']);

        // Discovery KEEPS the provider_vms row but flags it Missing when the VM is gone from Proxmox
        // (e.g. deleted directly in the hypervisor). The sync must treat that like an absent row.
        ProviderVm::create([
            'provider_id' => $s['provider']->id,
            'provider_node_id' => $s['providerNode']->id,
            'external_vmid' => $vm->external_vmid,
            'discovered_status' => 'Missing',
        ]);

        app(VmFactSyncService::class)->sync($vm->fresh());

        $this->assertSame('Missing', $vm->fresh()->status);
    }

    public function test_sync_restores_a_missing_vm_when_its_provider_vm_reappears(): void
    {
        $s = $this->seedScenario();
        $vm = $this->inventoryVm($this->regularUser(), $s, ['status' => 'Missing']);
        ProviderVm::create([
            'provider_id' => $s['provider']->id,
            'provider_node_id' => $s['providerNode']->id,
            'external_vmid' => $vm->external_vmid,
            'discovered_status' => 'Active',
            'power_state' => 'running',
        ]);

        app(VmFactSyncService::class)->sync($vm->fresh());

        $this->assertSame('Active', $vm->fresh()->status);
    }

    // ---- retry -----------------------------------------------------------

    public function test_retry_redispatches_provision_job_reusing_the_row(): void
    {
        $s = $this->seedScenario(['approval_required' => false]);
        $owner = $this->regularUser();
        $pr = ProvisionRequest::create($this->provisionPayload($s) + ['requester_id' => $owner->id]);
        $vm = $this->inventoryVm($owner, $s, ['status' => 'Failed', 'provision_request_id' => $pr->id]);

        Sanctum::actingAs($owner);
        $this->postJson("/api/inventory/{$vm->id}/retry")->assertOk()->assertJson(['queued' => true]);

        Bus::assertDispatched(ProvisionVmJob::class, fn (ProvisionVmJob $j) => $j->provisionRequestId === $pr->id
            && $j->vmName === $vm->vm_name
            && $j->inventoryId === $vm->id);
    }

    public function test_retry_rejects_a_non_failed_vm(): void
    {
        $s = $this->seedScenario(['approval_required' => false]);
        $owner = $this->regularUser();
        $vm = $this->inventoryVm($owner, $s, ['status' => 'Active']);

        Sanctum::actingAs($owner);
        $this->postJson("/api/inventory/{$vm->id}/retry")->assertStatus(422);
        Bus::assertNotDispatched(ProvisionVmJob::class);
    }

    public function test_retry_flips_status_to_provisioning_and_blocks_a_second_click(): void
    {
        $s = $this->seedScenario(['approval_required' => false]);
        $owner = $this->regularUser();
        $pr = ProvisionRequest::create($this->provisionPayload($s) + ['requester_id' => $owner->id]);
        $vm = $this->inventoryVm($owner, $s, ['status' => 'Failed', 'error_message' => 'boom', 'provision_request_id' => $pr->id]);

        Sanctum::actingAs($owner);

        // First retry: dispatches AND immediately flips the row to Provisioning (instant UI feedback,
        // error cleared) — no longer left showing Failed while the job waits in the queue.
        $this->postJson("/api/inventory/{$vm->id}/retry")->assertOk();
        $fresh = $vm->fresh();
        $this->assertSame('Provisioning', $fresh->status);
        $this->assertNull($fresh->error_message);
        Bus::assertDispatched(ProvisionVmJob::class, 1);

        // Second click while it's still queued: status is no longer Failed → rejected, no double-dispatch
        // onto the same reused Terraform workspace/tfstate.
        $this->postJson("/api/inventory/{$vm->id}/retry")->assertStatus(422);
        Bus::assertDispatched(ProvisionVmJob::class, 1);   // still exactly one
    }

    // ====================================================================
    // Regression guards
    // ====================================================================

    /** Guard: renewing an Expired VM clears the stale grace window (no phantom grace countdown) and reactivates it. */
    public function test_regression_renewal_clears_stale_grace_and_reactivates_expired(): void
    {
        $s = $this->seedScenario(['approval_required' => false, 'expiry_type' => 'days', 'expiry_value' => 30]);
        $owner = $this->regularUser();
        $vm = $this->inventoryVm($owner, $s, [
            'status' => 'Expired',
            'expiry_date' => now()->subDay(),
            'grace_period_until' => now()->addDay(),
        ]);

        Sanctum::actingAs($owner);
        $this->postJson("/api/inventory/{$vm->id}/renew", ['extension_period' => '7 Days'])->assertStatus(202);

        $vm->refresh();
        $this->assertNull($vm->grace_period_until, 'stale grace window must be cleared on renewal');
        $this->assertSame('Active', $vm->status, 'an Expired VM is reactivated on renewal');
        $this->assertTrue($vm->expiry_date->isFuture());
    }

    /** Guard: a renewal can never push expiry past (now + env window); at the cap it is rejected toward Permanent. */
    public function test_regression_renewal_at_env_cap_is_rejected_with_steer_to_permanent(): void
    {
        $s = $this->seedScenario(['expiry_type' => 'days', 'expiry_value' => 30]);
        $owner = $this->regularUser();
        // Already well beyond the 30-day cap → no headroom to extend.
        $vm = $this->inventoryVm($owner, $s, ['expiry_date' => now()->addDays(60)]);

        Sanctum::actingAs($owner);
        $this->postJson("/api/inventory/{$vm->id}/renew", ['extension_period' => '7 Days'])
            ->assertStatus(422)
            ->assertJsonStructure(['error' => ['details' => ['extension_period']]]);
    }

    /** Guard: the data-disk cap counts in-flight Pending approvals, so two requests can't both slip under the limit. */
    public function test_regression_add_disk_cap_counts_in_flight_pending_approvals(): void
    {
        $s = $this->seedScenario(['approval_required' => true, 'allow_data_disk' => true, 'max_data_disks' => 1]);
        $owner = $this->regularUser();
        $vm = $this->inventoryVm($owner, $s);

        Sanctum::actingAs($owner);
        // First add-disk opens a Pending ADD_DISK approval (0 used → allowed).
        $this->postJson("/api/inventory/{$vm->id}/add-disk", $this->confirm($vm, ['size_gb' => 10]))
            ->assertStatus(202);
        // Second is blocked: the in-flight Pending approval already consumes the single slot.
        $this->postJson("/api/inventory/{$vm->id}/add-disk", $this->confirm($vm, ['size_gb' => 10]))
            ->assertStatus(422);

        $this->assertSame(1, ApprovalRequest::where('request_type', 'ADD_DISK')->where('reference_id', $vm->id)->count());
    }

    /** Guard: add-disk is refused outright when the environment forbids data disks. */
    public function test_regression_add_disk_blocked_when_environment_forbids_data_disks(): void
    {
        $s = $this->seedScenario(['allow_data_disk' => false]);
        $owner = $this->regularUser();
        $vm = $this->inventoryVm($owner, $s);

        Sanctum::actingAs($owner);
        $this->postJson("/api/inventory/{$vm->id}/add-disk", $this->confirm($vm, ['size_gb' => 10]))
            ->assertStatus(403);
        Bus::assertNotDispatched(AddDiskJob::class);
    }

    /** Guard: destructive actions require an exact vm_name confirmation (typo-safety). */
    public function test_regression_destructive_actions_require_name_confirmation(): void
    {
        $s = $this->seedScenario(['approval_required' => false]);
        $owner = $this->regularUser();
        $vm = $this->inventoryVm($owner, $s);

        Sanctum::actingAs($owner);
        $this->postJson("/api/inventory/{$vm->id}/delete", ['vm_name_confirmation' => 'wrong-name'])
            ->assertStatus(422);
        $this->postJson("/api/inventory/{$vm->id}/resize", ['cpu' => 4, 'vm_name_confirmation' => 'wrong-name'])
            ->assertStatus(422);

        $this->assertSame('Active', $vm->fresh()->status);
        Bus::assertNotDispatched(DestroyVmJob::class);
        Bus::assertNotDispatched(ResizeVmJob::class);
    }

    /** Guard: a Deleted row stays visible during the retention window, then drops off the listing. */
    public function test_regression_deleted_vms_respect_retention_window_in_listing(): void
    {
        $s = $this->seedScenario();
        $owner = $this->regularUser();
        $this->inventoryVm($owner, $s, ['status' => 'Active']);
        $this->inventoryVm($owner, $s, ['status' => 'Deleted', 'destroyed_at' => now()]);               // recent → shown
        $this->inventoryVm($owner, $s, ['status' => 'Deleted', 'destroyed_at' => now()->subMinutes(30)]); // old → hidden

        Sanctum::actingAs($owner);
        $this->getJson('/api/inventory')->assertOk()->assertJsonCount(2);
    }

    // ---- RBAC scoping ----------------------------------------------------

    public function test_a_user_cannot_act_on_another_users_vm(): void
    {
        $s = $this->seedScenario(['approval_required' => false]);
        $vm = $this->inventoryVm($this->regularUser(), $s);

        Sanctum::actingAs($this->regularUser()); // a different user
        $this->postJson("/api/inventory/{$vm->id}/renew", ['extension_period' => '7 Days'])
            ->assertNotFound();
    }

    public function test_manager_sees_vms_of_members_in_groups_they_manage_but_not_outsiders(): void
    {
        $s = $this->seedScenario();
        $manager = $this->manager();
        $group = Group::create(['group_name' => $this->rand('grp'), 'manager_user_id' => $manager->id]);
        $member = $this->regularUser(['group_id' => $group->id]);
        $memberVm = $this->inventoryVm($member, $s);
        // Outsider lives in a different, unmanaged group so the manager genuinely cannot see it.
        $outsider = $this->regularUser(['group_id' => Group::create(['group_name' => $this->rand('grp')])->id]);
        $outsiderVm = $this->inventoryVm($outsider, $s);

        Sanctum::actingAs($manager);
        $this->getJson("/api/inventory/{$memberVm->id}")->assertOk();
        $this->getJson("/api/inventory/{$outsiderVm->id}")->assertNotFound();
    }
}
