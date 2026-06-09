<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'catalog_name', 'catalog_description', 'provider_id', 'provider_node_id',
    'provider_template_id', 'status', 'catalog_image', 'created_by',
])]
class Catalog extends Model
{
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
        if ($this->provider && $this->provider->status !== 'Connected') {
            return 'Provider Offline';
        }

        return $this->status; // Active | Inactive
    }
}
