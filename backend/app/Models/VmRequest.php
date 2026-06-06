<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VmRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'group_id',
        'catalog_id',
        'tier_id',
        'vm_name',
        'status',
        'approval_status',
        'requested_at',
        'approved_at'
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function catalog()
    {
        return $this->belongsTo(Catalog::class);
    }

    public function tier()
    {
        return $this->belongsTo(Tier::class);
    }
}
