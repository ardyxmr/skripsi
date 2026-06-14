<?php

namespace App\Console\Commands;

use App\Models\Provider;
use App\Services\Discovery\DiscoveryService;
use App\Services\Discovery\ProviderSyncGuard;
use App\Services\VmFactSyncService;
use Illuminate\Console\Command;

/**
 * Per-provider discovery refresh (scheduled at the finest cadence, every 30s). Each provider with
 * auto-discovery ON is re-discovered only when its own interval has elapsed (30s / 1m / 2m), then
 * its inventory rows are mirrored from the fresh provider_vms. Manual-only providers are skipped
 * (they sync via the Discover button in Provider Management). Keeps the DB snapshot — the system's
 * source of truth — current without anyone clicking.
 */
class RefreshDiscovery extends Command
{
    protected $signature = 'discovery:refresh';

    protected $description = 'Re-discover each auto-discovery provider when its interval has elapsed, and mirror its facts into inventory.';

    public function handle(DiscoveryService $discovery, VmFactSyncService $facts, ProviderSyncGuard $guard): int
    {
        foreach (Provider::all() as $provider) {
            if (! $provider->auto_discovery_enabled) {
                continue; // manual-only — refreshed on demand from Provider Management
            }

            // Circuit breaker: while a provider is in cooldown, don't keep hammering it on the
            // automated cadence — the last-known DB facts stand until it recovers (or a manual
            // Discover probes it).
            if (! $guard->providerAvailable($provider->id)) {
                continue;
            }

            $intervalSec = Provider::intervalSeconds($provider->discovery_interval);
            $due = ! $provider->last_discovery_at
                || $provider->last_discovery_at->lte(now()->subSeconds($intervalSec));
            if (! $due) {
                continue;
            }

            try {
                $discovery->discover($provider);   // refresh provider_* (also stamps last_discovery_at)
                $facts->syncProvider($provider);   // mirror this provider's live inventory rows (DB only)
            } catch (\Throwable $e) {
                $this->warn("discover {$provider->provider_name} failed: {$e->getMessage()}");
            }
        }

        return self::SUCCESS;
    }
}
