<?php

namespace App\Services\Discovery;

use App\Models\Provider;
use RuntimeException;

class ProviderFactory
{
    public static function make(Provider $provider): ProviderDriver
    {
        return match ($provider->provider_type) {
            'proxmox' => new ProxmoxProvider($provider),
            default => throw new RuntimeException("Unsupported provider type: {$provider->provider_type}"),
        };
    }
}
