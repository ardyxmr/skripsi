<?php

namespace App\Models;

use App\Observers\InventoryObserver;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// Provisioned VM (06-database-schema.md §6). One row per VM (per-VM workspace, ADR-08).
#[ObservedBy([InventoryObserver::class])]
#[Fillable([
    'provision_request_id',
    'vm_name', 'owner_user_id', 'environment_id', 'provider_id', 'node_id', 'catalog_id',
    'tier_id', 'network_id', 'datastore_id', 'ip_address', 'external_vmid', 'status',
    'observed_power_state', 'vcpu', 'ram_mb', 'disk_allocated_gb', 'cpu_utilization',
    'ram_usage_mb', 'security_hardening', 'hardening_status', 'expiry_date',
    'grace_period_until', 'is_permanent', 'workspace_path', 'terraform_state_path',
    'error_message', 'last_sync_at', 'destroyed_at',
])]
class Inventory extends Model
{
    protected $table = 'inventory';

    protected $casts = [
        'security_hardening' => 'boolean',
        'is_permanent' => 'boolean',
        'expiry_date' => 'datetime',
        'grace_period_until' => 'datetime',
        'last_sync_at' => 'datetime',
        'destroyed_at' => 'datetime',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
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

    public function disks(): HasMany
    {
        return $this->hasMany(InventoryDisk::class);
    }

    // Pending lifecycle approvals against THIS VM (approval_requests.reference_id = inventory id for
    // lifecycle types). Filtered to lifecycle types + Pending so it never matches PROVISION rows.
    public function pendingApprovals(): HasMany
    {
        return $this->hasMany(ApprovalRequest::class, 'reference_id')
            ->whereIn('request_type', ['RESIZE', 'RENEWAL', 'PERMANENT', 'ADD_DISK', 'DESTROY', 'EDIT_RESOURCES'])
            ->where('status', 'Pending');
    }
}
