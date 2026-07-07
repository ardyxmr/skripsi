<?php

namespace Tests\Feature\Node;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsInfra;
use Tests\TestCase;

/**
 * Node capacity hard-block toggle (admin) — the flag lives on provider_nodes and is set through the
 * node Add/Edit form (full payload). Covers persistence + audit + the partial-update regression.
 */
class NodeHardBlockTest extends TestCase
{
    use BuildsInfra, RefreshDatabase;

    /** @return array{0: \App\Models\Node, 1: \App\Models\ProviderNode} */
    private function publishedNode(): array
    {
        $provider = $this->provider();
        $pnode = $this->providerNode($provider);

        return [$this->node($provider, $pnode), $pnode];
    }

    public function test_admin_enables_hardblock_through_the_node_form(): void
    {
        [$node, $pnode] = $this->publishedNode();
        Sanctum::actingAs($this->admin());

        $this->putJson("/api/nodes/{$node->id}", [
            'node_name' => $node->node_name,
            'provider_id' => $node->provider_id,
            'provider_node_id' => $node->provider_node_id,
            'status' => 'Active',
            'block_on_critical' => true,
        ])->assertOk()->assertJson(['block_on_critical' => true]);

        $this->assertDatabaseHas('provider_nodes', ['id' => $pnode->id, 'block_on_critical' => true]);
        $this->assertDatabaseHas('audit_logs', ['action_type' => 'NODE_HARDBLOCK_ENABLED']);
    }

    public function test_admin_disables_hardblock_through_the_node_form(): void
    {
        [$node, $pnode] = $this->publishedNode();
        $pnode->update(['block_on_critical' => true]);
        Sanctum::actingAs($this->admin());

        $this->putJson("/api/nodes/{$node->id}", [
            'node_name' => $node->node_name,
            'provider_id' => $node->provider_id,
            'provider_node_id' => $node->provider_node_id,
            'status' => 'Active',
            'block_on_critical' => false,
        ])->assertOk()->assertJson(['block_on_critical' => false]);

        $this->assertDatabaseHas('provider_nodes', ['id' => $pnode->id, 'block_on_critical' => false]);
        $this->assertDatabaseHas('audit_logs', ['action_type' => 'NODE_HARDBLOCK_DISABLED']);
    }

    public function test_partial_update_is_not_rejected_for_a_missing_node_name(): void
    {
        // Regression: node_name was unconditionally required on update, so a partial PUT (the old
        // bare toggle, or the unpublish {status} flow) got 422'd. It must now succeed.
        [$node, $pnode] = $this->publishedNode();
        Sanctum::actingAs($this->admin());

        $this->putJson("/api/nodes/{$node->id}", ['block_on_critical' => true])->assertOk();
        $this->assertDatabaseHas('provider_nodes', ['id' => $pnode->id, 'block_on_critical' => true]);
    }
}
