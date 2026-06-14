<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'provider_name', 'provider_type', 'endpoint', 'description',
    'discovery_username', 'discovery_token_id', 'discovery_token_secret',
    'provision_username', 'provision_token_id', 'provision_token_secret',
    'terraform_provider_source', 'terraform_provider_version',
    'auto_discovery_enabled', 'discovery_interval',
])]
// Secrets are write-only: never serialized into any response (07-api-contract §13).
#[Hidden(['discovery_token_secret', 'provision_token_secret'])]
class Provider extends Model
{
    // Surface the computed schedule so the UI can show "Next Discovery" instead of "Manual Only".
    protected $appends = ['next_discovery_at'];

    protected function casts(): array
    {
        return [
            'discovery_token_secret' => 'encrypted',  // auto encrypt on write / decrypt on read
            'provision_token_secret' => 'encrypted',
            'auto_discovery_enabled' => 'boolean',
            'last_tested_at' => 'datetime',
            'last_discovery_at' => 'datetime',
            'last_sync_at' => 'datetime',
        ];
    }

    /** Background sync cadence in seconds for a stored interval label ('30s' | '1m' | '2m'). */
    public static function intervalSeconds(?string $interval): int
    {
        return match ($interval) {
            '30s' => 30,
            '1m' => 60,
            '2m' => 120,
            // tolerate legacy labels so an un-migrated row still behaves sanely
            '15m' => 900, '30m' => 1800, '1h' => 3600, '6h' => 21600, '12h' => 43200, '24h' => 86400,
            default => 120,
        };
    }

    /** When the scheduler will next auto-discover this provider — null if auto-discovery is off. */
    public function getNextDiscoveryAtAttribute(): ?string
    {
        if (! $this->auto_discovery_enabled || ! $this->last_discovery_at) {
            return null;
        }

        return $this->last_discovery_at->copy()->addSeconds(self::intervalSeconds($this->discovery_interval))->toIso8601String();
    }

    public function nodes(): HasMany
    {
        return $this->hasMany(ProviderNode::class);
    }

    public function templates(): HasMany
    {
        return $this->hasMany(ProviderTemplate::class);
    }

    public function networks(): HasMany
    {
        return $this->hasMany(ProviderNetwork::class);
    }

    public function datastores(): HasMany
    {
        return $this->hasMany(ProviderDatastore::class);
    }

    public function vms(): HasMany
    {
        return $this->hasMany(ProviderVm::class);
    }
}
