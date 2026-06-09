<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;

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
}
