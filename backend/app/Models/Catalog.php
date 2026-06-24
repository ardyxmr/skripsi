<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'catalog_name', 'catalog_description', 'provider_id', 'provider_node_id',
    'provider_template_id', 'status', 'catalog_image', 'created_by',
])]
class Catalog extends Model
{
    /** VMs provisioned from this catalog (for the Usage count + delete-guard). */
    public function inventories(): HasMany
    {
        return $this->hasMany(Inventory::class, 'catalog_id');
    }

    /** All hardening playbook versions for this catalog (Stage 8 + versioning). */
    public function hardeningVersions(): HasMany
    {
        return $this->hasMany(CatalogHardeningVersion::class);
    }

    /** Active (non-retired) versions, newest first — what users may select. */
    public function activeHardeningVersions(): HasMany
    {
        return $this->hardeningVersions()->where('is_active', true)->latest('id');
    }

    /** True when this catalog has at least one active hardening playbook version. */
    public function hasHardening(): bool
    {
        return $this->activeHardeningVersions()->exists();
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }

    public function providerTemplate(): BelongsTo
    {
        return $this->belongsTo(ProviderTemplate::class);
    }

    public function providerNode(): BelongsTo
    {
        return $this->belongsTo(ProviderNode::class);
    }

    /**
     * Effective status derived from the linked provider/template health
     * (§3.2): Template Missing | Provider Offline | else admin status.
     */
    public function effectiveStatus(): string
    {
        if ($this->providerTemplate && $this->providerTemplate->discovered_status === 'Missing') {
            return 'Template Missing';
        }
        // Health follows the bound node (etc.txt / ADR-17): a node going down
        // takes its catalogs/networks/datastores offline even if the cluster/provider stays Connected.
        if ($this->providerNode && $this->providerNode->discovered_status === 'Missing') {
            return 'Missing';
        }
        if ($this->providerNode && $this->providerNode->status === 'offline') {
            return 'Node Offline';
        }
        if ($this->provider && $this->provider->status !== 'Connected') {
            return 'Provider Offline';
        }

        return $this->status; // Active | Inactive
    }
}
