<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VmsInventory extends Model
{
    use HasFactory;

    protected $table = 'vms_inventory';

    protected $fillable = [
        'user_id',
        'group_id',
        'vm_name',
        'proxmox_vmid',
        'status',
        'ip_address'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }
}
