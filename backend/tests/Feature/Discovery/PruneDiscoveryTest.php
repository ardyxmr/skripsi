<?php

namespace Tests\Feature\Discovery;

use App\Models\ProviderTemplate;
use App\Models\ProviderVm;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\BuildsInfra;
use Tests\TestCase;

/**
 * discovery:prune deletes discovered rows that have been Missing longer than the stale window
 * (default 5 min) so a VM deleted straight in Proxmox stops lingering as "Missing" in the
 * Discovery/Node Explorer — while Active rows and published-referenced resources are never touched.
 */
class PruneDiscoveryTest extends TestCase
{
    use BuildsInfra, RefreshDatabase;

    private function providerVm(int $providerId, array $attrs = []): ProviderVm
    {
        return ProviderVm::create(array_merge([
            'provider_id' => $providerId,
            'external_vmid' => (string) random_int(100, 9999),
            'vm_name' => $this->rand('vm'),
            'discovered_status' => 'Missing',
            'last_sync_at' => now()->subMinutes(10),
        ], $attrs));
    }

    public function test_it_deletes_a_missing_vm_past_the_stale_window(): void
    {
        $provider = $this->provider();
        $stale = $this->providerVm($provider->id, ['last_sync_at' => now()->subMinutes(10)]);

        $this->artisan('discovery:prune')->assertSuccessful();

        $this->assertDatabaseMissing('provider_vms', ['id' => $stale->id]);
    }

    public function test_it_keeps_a_missing_vm_still_inside_the_window(): void
    {
        $provider = $this->provider();
        // Gone for only 2 min — under the 5-min default, so still shown as drift.
        $fresh = $this->providerVm($provider->id, ['last_sync_at' => now()->subMinutes(2)]);

        $this->artisan('discovery:prune')->assertSuccessful();

        $this->assertDatabaseHas('provider_vms', ['id' => $fresh->id]);
    }

    public function test_it_never_deletes_an_active_vm(): void
    {
        $provider = $this->provider();
        // Active but with an old last_sync_at — the status guard, not the timestamp, protects it.
        $active = $this->providerVm($provider->id, [
            'discovered_status' => 'Active',
            'last_sync_at' => now()->subHours(3),
        ]);

        $this->artisan('discovery:prune')->assertSuccessful();

        $this->assertDatabaseHas('provider_vms', ['id' => $active->id]);
    }

    public function test_it_keeps_a_missing_template_that_is_still_published(): void
    {
        $provider = $this->provider();
        $pnode = $this->providerNode($provider);

        $tpl = ProviderTemplate::create([
            'provider_id' => $provider->id,
            'external_template_id' => '9000',
            'template_name' => $this->rand('tpl'),
            'discovered_status' => 'Missing',
            'last_sync_at' => now()->subHours(1),
        ]);
        // A published catalog still points at this template → keep it (drift is shown, not deleted).
        $this->catalog($provider, $pnode, ['provider_template_id' => $tpl->id]);

        $this->artisan('discovery:prune')->assertSuccessful();

        $this->assertDatabaseHas('provider_templates', ['id' => $tpl->id]);
    }

    public function test_it_respects_a_custom_minutes_window(): void
    {
        $provider = $this->provider();
        $vm = $this->providerVm($provider->id, ['last_sync_at' => now()->subMinutes(10)]);

        // Widen the window past the row's age → nothing pruned.
        $this->artisan('discovery:prune', ['--minutes' => 30])->assertSuccessful();
        $this->assertDatabaseHas('provider_vms', ['id' => $vm->id]);

        // Narrow it below the row's age → pruned.
        $this->artisan('discovery:prune', ['--minutes' => 1])->assertSuccessful();
        $this->assertDatabaseMissing('provider_vms', ['id' => $vm->id]);
    }
}
