<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['tier_name', 'description', 'cpu', 'ram_mb', 'disk_gb', 'status', 'created_by'])]
class Tier extends Model
{
}
