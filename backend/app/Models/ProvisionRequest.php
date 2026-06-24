<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'requester_id', 'vm_name', 'environment_id', 'provider_id', 'node_id', 'catalog_id',
    'tier_id', 'network_id', 'datastore_id', 'instance_count', 'security_hardening',
    'boot_disk_gb', 'requested_expiry', 'description',
])]
class ProvisionRequest extends Model
{
    protected $casts = [
        'security_hardening' => 'boolean',
        'requested_expiry' => 'datetime',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function environment(): BelongsTo
    {
        return $this->belongsTo(Environment::class);
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }

    public function node(): BelongsTo
    {
        return $this->belongsTo(Node::class);
    }

    public function catalog(): BelongsTo
    {
        return $this->belongsTo(Catalog::class);
    }

    public function tier(): BelongsTo
    {
        return $this->belongsTo(Tier::class);
    }

    public function network(): BelongsTo
    {
        return $this->belongsTo(Network::class);
    }

    public function datastore(): BelongsTo
    {
        return $this->belongsTo(Datastore::class);
    }
}
