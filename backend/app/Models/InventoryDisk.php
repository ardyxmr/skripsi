<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'inventory_id', 'disk_index', 'size_gb', 'is_primary', 'mount_point', 'fs_type', 'setup_status',
])]
class InventoryDisk extends Model
{
    protected $casts = ['is_primary' => 'boolean'];

    public function inventory(): BelongsTo
    {
        return $this->belongsTo(Inventory::class);
    }
}
