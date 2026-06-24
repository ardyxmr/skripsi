<?php

namespace App\Services\Discovery;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Phase 3 sync hardening. Two cheap, cache-backed guards that protect the Proxmox API from the
 * automated sync paths:
 *
 *  1. CIRCUIT BREAKER (per provider) — after N consecutive live-API failures, the breaker "opens"
 *     for a cooldown; while open, automated callers (scheduled discovery:refresh, SyncVmFactsJob)
 *     skip live calls and let the last-known DB facts stand, instead of hammering a down host.
 *     After the cooldown it goes "half-open" (one probe allowed); a success closes it, a failure
 *     re-opens it. DiscoveryService records every attempt's outcome, so a MANUAL Discover/sync —
 *     which never checks availability — still probes and can close the breaker.
 *
 *  2. TARGETED-SYNC THROTTLE (per provider+vmid) — collapses duplicate SyncVmFactsJob triggers for
 *     the same VM that land within a short window into a single live call (so near-simultaneous
 *     mutations don't each fire their own sync). Atomic via Cache::add.
 *
 * State lives in the cache (CACHE_STORE=database here), so it survives across queue workers and
 * web requests without a schema change.
 */
class ProviderSyncGuard
{
    private function threshold(): int
    {
        return max(1, (int) config('provisioning.circuit_failure_threshold', 3));
    }

    private function cooldown(): int
    {
        return max(1, (int) config('provisioning.circuit_cooldown_seconds', 60));
    }

    private function throttleTtl(): int
    {
        return max(1, (int) config('provisioning.sync_throttle_seconds', 3));
    }

    private function key(int $providerId, string $suffix): string
    {
        return "provider_sync:{$providerId}:{$suffix}";
    }

    /** Is the provider's breaker closed (or half-open)? Automated callers gate on this. */
    public function providerAvailable(int $providerId): bool
    {
        return (int) Cache::get($this->key($providerId, 'open_until'), 0) <= now()->getTimestamp();
    }

    /** A live call succeeded → reset the failure count and close the breaker. */
    public function recordProviderSuccess(int $providerId): void
    {
        $wasOpen = ! $this->providerAvailable($providerId);
        Cache::forget($this->key($providerId, 'fails'));
        Cache::forget($this->key($providerId, 'open_until'));
        if ($wasOpen) {
            Log::info("ProviderSyncGuard: circuit CLOSED for provider {$providerId} (probe succeeded).");
        }
    }

    /** A live call failed → bump the count; open the breaker once it crosses the threshold. */
    public function recordProviderFailure(int $providerId): void
    {
        // Keep the counter alive a few cooldowns so a half-open probe failure re-opens immediately.
        $fails = (int) Cache::get($this->key($providerId, 'fails'), 0) + 1;
        Cache::put($this->key($providerId, 'fails'), $fails, now()->addSeconds($this->cooldown() * 4));

        if ($fails >= $this->threshold()) {
            $cooldown = $this->cooldown();
            Cache::put($this->key($providerId, 'open_until'), now()->addSeconds($cooldown)->getTimestamp(), now()->addSeconds($cooldown + 60));
            Log::warning("ProviderSyncGuard: circuit OPEN for provider {$providerId} after {$fails} failures; cooling down {$cooldown}s.");
        }
    }

    /** Breaker snapshot (for logging / a future admin surface). */
    public function providerState(int $providerId): array
    {
        $openUntil = (int) Cache::get($this->key($providerId, 'open_until'), 0);

        return [
            'open' => $openUntil > now()->getTimestamp(),
            'fails' => (int) Cache::get($this->key($providerId, 'fails'), 0),
            'open_until' => $openUntil ?: null,
        ];
    }

    /**
     * Atomically reserve a live sync for this VM. Returns true only if no sync has run for it within
     * the throttle window — so duplicate triggers collapse into one active sync chain per VM.
     */
    public function shouldSyncVm(int $providerId, string $vmid): bool
    {
        return Cache::add($this->key($providerId, "vm:{$vmid}"), 1, now()->addSeconds($this->throttleTtl()));
    }
}
