<?php

namespace Tests\Feature\Provision;

use App\Jobs\ProvisionVmJob;
use App\Models\ApprovalRequest;
use App\Models\ProvisionRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsInfra;
use Tests\TestCase;

/**
 * Stage 5 — provision request capture + approval routing + node-centric policy.
 * Bus::fake() so no ProvisionVmJob ever touches Terraform; we assert on dispatch instead.
 */
class ProvisionRequestTest extends TestCase
{
    use BuildsInfra, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Bus::fake();
    }

    // ---- Approval routing ------------------------------------------------

    public function test_regular_user_in_approval_env_opens_pending_approval_and_does_not_dispatch(): void
    {
        $s = $this->seedScenario(['approval_required' => true]);
        Sanctum::actingAs($this->regularUser());

        $this->postJson('/api/provision-requests', $this->provisionPayload($s))
            ->assertCreated()
            ->assertJson(['approval_required' => true, 'status' => 'pending_approval', 'bypassed' => false]);

        $this->assertDatabaseHas('approval_requests', [
            'request_type' => 'PROVISION',
            'reference_id' => ProvisionRequest::sole()->id,
            'status' => 'Pending',
        ]);
        Bus::assertNotDispatched(ProvisionVmJob::class);
    }

    public function test_regular_user_in_no_approval_env_dispatches_immediately(): void
    {
        $s = $this->seedScenario(['approval_required' => false]);
        Sanctum::actingAs($this->regularUser());

        $this->postJson('/api/provision-requests', $this->provisionPayload($s))
            ->assertCreated()
            ->assertJson(['approval_required' => false, 'status' => 'dispatched', 'bypassed' => false]);

        $this->assertDatabaseCount('approval_requests', 0);
        Bus::assertDispatched(ProvisionVmJob::class, 1);
    }

    public function test_privileged_actor_bypasses_approval_even_when_env_requires_it(): void
    {
        $s = $this->seedScenario(['approval_required' => true]);
        Sanctum::actingAs($this->admin());

        $this->postJson('/api/provision-requests', $this->provisionPayload($s))
            ->assertCreated()
            ->assertJson(['approval_required' => true, 'status' => 'dispatched', 'bypassed' => true]);

        $this->assertDatabaseCount('approval_requests', 0);
        Bus::assertDispatched(ProvisionVmJob::class, 1);
    }

    public function test_manager_also_bypasses_approval(): void
    {
        $s = $this->seedScenario(['approval_required' => true]);
        Sanctum::actingAs($this->manager());

        $this->postJson('/api/provision-requests', $this->provisionPayload($s))
            ->assertCreated()
            ->assertJson(['bypassed' => true, 'status' => 'dispatched']);
    }

    public function test_batch_request_fans_out_one_job_per_instance_with_suffixed_names(): void
    {
        $s = $this->seedScenario(['approval_required' => false]);
        Sanctum::actingAs($this->regularUser());

        $this->postJson('/api/provision-requests', $this->provisionPayload($s, [
            'vm_name' => 'web', 'instance_count' => 3,
        ]))->assertCreated();

        Bus::assertDispatched(ProvisionVmJob::class, 3);
        foreach (['web-01', 'web-02', 'web-03'] as $name) {
            Bus::assertDispatched(ProvisionVmJob::class, fn (ProvisionVmJob $j) => $j->vmName === $name);
        }
    }

    // ---- Auth ------------------------------------------------------------

    public function test_anonymous_cannot_submit(): void
    {
        $s = $this->seedScenario();
        $this->postJson('/api/provision-requests', $this->provisionPayload($s))->assertUnauthorized();
        Bus::assertNotDispatched(ProvisionVmJob::class);
    }

    // ---- Field validation ------------------------------------------------

    public function test_vm_name_rejects_path_traversal_and_interpolation(): void
    {
        $s = $this->seedScenario();
        Sanctum::actingAs($this->regularUser());

        foreach (['../etc', 'a/b', 'bad name', '${secret}', '-leading', 'trailing-'] as $bad) {
            $this->postJson('/api/provision-requests', $this->provisionPayload($s, ['vm_name' => $bad]))
                ->assertStatus(422)
                ->assertJsonStructure(['error' => ['details' => ['vm_name']]]);
        }
        Bus::assertNotDispatched(ProvisionVmJob::class);
    }

    public function test_missing_required_fields_are_rejected(): void
    {
        Sanctum::actingAs($this->regularUser());
        $this->postJson('/api/provision-requests', [])
            ->assertStatus(422)
            ->assertJsonStructure(['error' => ['details' => [
                'vm_name', 'environment_id', 'provider_id', 'node_id', 'catalog_id', 'tier_id', 'network_id', 'datastore_id',
            ]]]);
    }

    // ---- Node-centric policy (422 from the service) ----------------------

    public function test_provider_not_allowlisted_in_environment_is_rejected(): void
    {
        $s = $this->seedScenario();
        $other = $this->provider(); // connected, but not attached to the env
        Sanctum::actingAs($this->regularUser());

        $this->postJson('/api/provision-requests', $this->provisionPayload($s, ['provider_id' => $other->id]))
            ->assertStatus(422)
            ->assertJsonStructure(['error' => ['details' => ['provider_id']]]);
        Bus::assertNotDispatched(ProvisionVmJob::class);
    }

    public function test_disconnected_provider_is_rejected(): void
    {
        $s = $this->seedScenario();
        $s['provider']->forceFill(['status' => 'Disconnected'])->save();
        Sanctum::actingAs($this->regularUser());

        $this->postJson('/api/provision-requests', $this->provisionPayload($s))
            ->assertStatus(422)
            ->assertJsonStructure(['error' => ['details' => ['provider_id']]]);
    }

    public function test_inactive_environment_is_rejected(): void
    {
        $s = $this->seedScenario(['status' => 'Inactive']);
        Sanctum::actingAs($this->regularUser());

        $this->postJson('/api/provision-requests', $this->provisionPayload($s))
            ->assertStatus(422)
            ->assertJsonStructure(['error' => ['details' => ['environment_id']]]);
    }

    public function test_node_from_a_different_provider_is_rejected(): void
    {
        $s = $this->seedScenario();
        // A second connected provider with its own node, also allow-listed in the env,
        // so the node passes the allow-list check but fails the provider-ownership check.
        $other = $this->provider();
        $opnode = $this->providerNode($other);
        $onode = $this->node($other, $opnode);
        $s['environment']->nodes()->attach($onode);
        Sanctum::actingAs($this->regularUser());

        $this->postJson('/api/provision-requests', $this->provisionPayload($s, ['node_id' => $onode->id]))
            ->assertStatus(422)
            ->assertJsonStructure(['error' => ['details' => ['node_id']]]);
    }

    public function test_catalog_on_a_different_node_is_rejected(): void
    {
        $s = $this->seedScenario();
        // Same provider, but a second discovered node — the catalog lives there, not on $s['node'].
        $pnode2 = $this->providerNode($s['provider']);
        $offNode = $this->catalog($s['provider'], $pnode2);
        Sanctum::actingAs($this->regularUser());

        $this->postJson('/api/provision-requests', $this->provisionPayload($s, ['catalog_id' => $offNode->id]))
            ->assertStatus(422)
            ->assertJsonStructure(['error' => ['details' => ['catalog_id']]]);
    }

    public function test_inactive_tier_is_rejected(): void
    {
        $s = $this->seedScenario();
        $s['tier']->update(['status' => 'Inactive']);
        Sanctum::actingAs($this->regularUser());

        $this->postJson('/api/provision-requests', $this->provisionPayload($s))
            ->assertStatus(422)
            ->assertJsonStructure(['error' => ['details' => ['tier_id']]]);
    }

    // ---- Node capacity hard-block (admin opt-in) -------------------------

    public function test_provisioning_onto_a_blocked_critical_node_is_rejected(): void
    {
        $s = $this->seedScenario();
        // Push the node's snapshot over the critical line (default 95%) and arm the admin hard-block.
        $s['providerNode']->forceFill(['cpu_utilization' => 99, 'block_on_critical' => true])->save();
        Sanctum::actingAs($this->regularUser());

        $this->postJson('/api/provision-requests', $this->provisionPayload($s))
            ->assertStatus(422)
            ->assertJsonStructure(['error' => ['details' => ['node_id']]]);
        Bus::assertNotDispatched(ProvisionVmJob::class);
        // The refused attempt is recorded in the audit trail.
        $this->assertDatabaseHas('audit_logs', ['action_type' => 'PROVISION_BLOCKED']);
    }

    public function test_critical_node_without_the_block_toggle_still_provisions(): void
    {
        $s = $this->seedScenario(['approval_required' => false]);
        // Critical capacity, but the admin has NOT enabled the hard-block → warn only, not blocked.
        $s['providerNode']->forceFill(['cpu_utilization' => 99, 'block_on_critical' => false])->save();
        Sanctum::actingAs($this->regularUser());

        $this->postJson('/api/provision-requests', $this->provisionPayload($s))
            ->assertCreated()
            ->assertJson(['status' => 'dispatched']);
        Bus::assertDispatched(ProvisionVmJob::class, 1);
    }
}
