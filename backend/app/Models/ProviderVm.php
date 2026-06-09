<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProviderVm extends Model
{
    protected $guarded = [];

    protected $casts = [
        'disks_json' => 'array',
        'cpu_utilization' => 'float',
        'last_sync_at' => 'datetime',
    ];
}
