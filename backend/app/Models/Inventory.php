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
    'vm_name', 'login_username', 'login_password',
    'owner_user_id', 'environment_id', 'provider_id', 'node_id', 'catalog_id',
    'tier_id', 'network_id', 'datastore_id', 'ip_address', 'external_vmid', 'status',
    'observed_power_state', 'vcpu', 'ram_mb', 'disk_allocated_gb', 'cpu_utilization',
    'ram_usage_mb', 'security_hardening', 'hardening_status', 'last_hardened_at',
    'hardened_playbook_checksum', 'hardened_version_id', 'expiry_date',
    'grace_period_until', 'is_permanent', 'workspace_path', 'terraform_state_path',
    'error_message', 'last_sync_at', 'destroyed_at',
])]
class Inventory extends Model
{
    protected $table = 'inventory';

    protected $casts = [
        'login_password' => 'encrypted',   // per-VM password, encrypted at rest (revealed only via the audited endpoint)
        'security_hardening' => 'boolean',
        'is_permanent' => 'boolean',
        'expiry_date' => 'datetime',
        'grace_period_until' => 'datetime',
        'last_sync_at' => 'datetime',
        'last_hardened_at' => 'datetime',
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

    /** The hardening playbook version last applied to this VM (Stage 8 + versioning). */
    public function hardenedVersion(): BelongsTo
    {
        return $this->belongsTo(CatalogHardeningVersion::class, 'hardened_version_id');
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

    /**
     * Structured audit payload for this VM. inventory_id is the authoritative, never-reused key
     * (Proxmox RECYCLES vmid after a VM is deleted, so vmid/vm_name can recur across instances) —
     * filter the trail by inventory_id for exact per-instance history; vmid/vm_name are kept for
     * human/ops context. All GIN-indexed (metadata @> …) for fast lookups.
     *
     * @param  array<string,mixed>  $extra  action-specific context (e.g. new_vcpu, size_gb, version_id)
     * @return array<string,mixed>
     */
    public function auditMeta(array $extra = []): array
    {
        return array_merge([
            'inventory_id' => $this->id,        // canonical unique key — never reused
            'vmid' => $this->external_vmid,     // Proxmox vmid — recognizable but reused over time
            'vm_name' => $this->vm_name,
            'environment_id' => $this->environment_id,
        ], $extra);
    }

    // Pending lifecycle approvals against THIS VM (approval_requests.reference_id = inventory id for
    // lifecycle types). Filtered to lifecycle types + Pending so it never matches PROVISION rows.
    public function pendingApprovals(): HasMany
    {
        return $this->hasMany(ApprovalRequest::class, 'reference_id')
            ->whereIn('request_type', ['RESIZE', 'RENEWAL', 'PERMANENT', 'ADD_DISK', 'DESTROY', 'EDIT_RESOURCES', 'HARDEN'])
            ->where('status', 'Pending');
    }
}
