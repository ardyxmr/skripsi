<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProviderNode extends Model
{
    protected $guarded = [];

    protected $casts = ['last_sync_at' => 'datetime'];

    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }
}
