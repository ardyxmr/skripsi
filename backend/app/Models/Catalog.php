<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Catalog extends Model
{
    use HasFactory;

    protected $fillable = [
        'os_name',
        'template_id',
        'description',
        'is_active'
    ];
}
