<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProviderNetwork extends Model
{
    protected $guarded = [];

    protected $casts = ['last_sync_at' => 'datetime'];
}
