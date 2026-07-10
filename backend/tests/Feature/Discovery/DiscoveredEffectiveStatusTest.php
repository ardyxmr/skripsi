<?php

namespace Tests\Feature\Discovery;

use App\Models\ProviderTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsInfra;
use Tests\TestCase;

/**
 * Discovered child rows (template/network/datastore/vm) and the provider_node itself expose an
 * effectiveStatus() that overlays LIVE provider/node health onto the last-scanned value — so a
 * disconnected provider (or a downed node) takes its Explorer items offline instead of leaving them
 * "Active". A disconnected provider leaves the node's own status stale ('online'), so the provider
 * verdict must win: that ordering is the point of these tests.
 */
class DiscoveredEffectiveStatusTest extends TestCase
{
    use BuildsInfra, RefreshDatabase;

    private function template(int $providerId, ?int $nodeId, array $attrs = []): ProviderTemplate
    {
        return ProviderTemplate::create(array_merge([
            'provider_id' => $providerId,
            'provider_node_id' => $nodeId,
            'external_template_id' => (string) random_int(1000, 9999),
            'template_name' => $this->rand('tpl'),
            'discovered_status' => 'Active',
            'last_sync_at' => now(),
        ], $attrs));
    }

    public function test_disconnected_provider_makes_children_provider_offline(): void
    {
        $provider = $this->provider(['status' => 'Disconnected']);
        $pnode = $this->providerNode($provider); // status still 'online' (stale from last good scan)
        $tpl = $this->template($provider->id, $pnode->id);

        $this->assertSame('Provider Offline', $tpl->fresh()->effectiveStatus());
    }

    public function test_offline_node_makes_only_its_children_node_offline(): void
    {
        $provider = $this->provider(); // Connected
        $down = $this->providerNode($provider, ['status' => 'offline']);
        $up = $this->providerNode($provider); // online
        $onDown = $this->template($provider->id, $down->id);
        $onUp = $this->template($provider->id, $up->id);

        $this->assertSame('Node Offline', $onDown->fresh()->effectiveStatus());
        $this->assertSame('Active', $onUp->fresh()->effectiveStatus());
    }

    public function test_pruned_row_is_missing(): void
    {
        $provider = $this->provider();
        $pnode = $this->providerNode($provider);
        $tpl = $this->template($provider->id, $pnode->id, ['discovered_status' => 'Missing']);

        $this->assertSame('Missing', $tpl->fresh()->effectiveStatus());
    }

    public function test_provider_node_row_derivation(): void
    {
        $dc = $this->provider(['status' => 'Disconnected']);
        $this->assertSame('Provider Offline', $this->providerNode($dc)->fresh()->effectiveStatus());

        $up = $this->provider();
        $this->assertSame('Node Offline', $this->providerNode($up, ['status' => 'offline'])->fresh()->effectiveStatus());
        $this->assertSame('Active', $this->providerNode($up)->fresh()->effectiveStatus());
    }

    public function test_explorer_endpoint_exposes_effective_status(): void
    {
        Sanctum::actingAs($this->admin());
        $provider = $this->provider(['status' => 'Disconnected']);
        $pnode = $this->providerNode($provider);
        $this->template($provider->id, $pnode->id);

        // The endpoint returns snake_case; the frontend api client camelizes to `effectiveStatus`.
        $this->getJson("/api/providers/{$provider->id}/explorer")
            ->assertOk()
            ->assertJsonPath('templates.0.effective_status', 'Provider Offline');
    }
}
