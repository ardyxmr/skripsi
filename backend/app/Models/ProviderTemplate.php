<?php

namespace App\Models;

use App\Models\Concerns\DerivesEffectiveStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProviderTemplate extends Model
{
    use DerivesEffectiveStatus;

    protected $guarded = [];

    protected $casts = ['last_sync_at' => 'datetime'];

    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }

    public function providerNode(): BelongsTo
    {
        return $this->belongsTo(ProviderNode::class);
    }
}
