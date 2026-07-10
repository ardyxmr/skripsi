<?php

namespace Tests\Feature\Environment;

use App\Models\Environment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\BuildsInfra;
use Tests\TestCase;

/**
 * Environment::effectiveStatus() derives the list/pill status from the health of every allowed
 * provider + node. An environment is a MANY-to-many allow-list, so it degrades gradually:
 * Active → Degraded (some path down, still usable) → Provider/Node Offline (no usable path) → Inactive.
 */
class EnvironmentEffectiveStatusTest extends TestCase
{
    use BuildsInfra, RefreshDatabase;

    private function reload(Environment $env): Environment
    {
        return Environment::with(Environment::HEALTH_RELATIONS)->find($env->id);
    }

    public function test_all_healthy_is_active(): void
    {
        $provider = $this->provider(); // Connected
        $pnode = $this->providerNode($provider); // online + Active
        $node = $this->node($provider, $pnode);

        $env = $this->environment();
        $env->providers()->attach($provider);
        $env->nodes()->attach($node);

        $this->assertSame('Active', $this->reload($env)->effectiveStatus());
    }

    public function test_partial_provider_outage_is_degraded(): void
    {
        $up = $this->provider(); // Connected
        $down = $this->provider(['status' => 'Disconnected']);

        $env = $this->environment();
        $env->providers()->attach([$up->id, $down->id]);

        // One provider still Connected → a usable path remains → amber Degraded, not red.
        $this->assertSame('Degraded', $this->reload($env)->effectiveStatus());
    }

    public function test_all_providers_disconnected_is_provider_offline(): void
    {
        $down = $this->provider(['status' => 'Disconnected']);

        $env = $this->environment();
        $env->providers()->attach($down);

        $this->assertSame('Provider Offline', $this->reload($env)->effectiveStatus());
    }

    public function test_connected_provider_but_all_nodes_down_is_node_offline(): void
    {
        $provider = $this->provider(); // Connected
        $pnode = $this->providerNode($provider, ['status' => 'offline']); // Proxmox reports node down
        $node = $this->node($provider, $pnode);

        $env = $this->environment();
        $env->providers()->attach($provider);
        $env->nodes()->attach($node);

        $this->assertSame('Node Offline', $this->reload($env)->effectiveStatus());
    }

    public function test_one_of_two_nodes_down_is_degraded(): void
    {
        $provider = $this->provider(); // Connected
        $upNode = $this->node($provider, $this->providerNode($provider)); // online + Active
        $downNode = $this->node($provider, $this->providerNode($provider, ['discovered_status' => 'Missing']));

        $env = $this->environment();
        $env->providers()->attach($provider);
        $env->nodes()->attach([$upNode->id, $downNode->id]);

        $this->assertSame('Degraded', $this->reload($env)->effectiveStatus());
    }

    public function test_admin_inactive_wins_over_health(): void
    {
        $provider = $this->provider(); // Connected + healthy
        $env = $this->environment(['status' => 'Inactive']);
        $env->providers()->attach($provider);

        $this->assertSame('Inactive', $this->reload($env)->effectiveStatus());
    }
}
