<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    // Append-only: only created_at (set by DB default), no updated_at.
    public $timestamps = false;

    protected $fillable = [
        'user_id', 'user_name', 'action_type', 'description', 'ip_address',
    ];
}
