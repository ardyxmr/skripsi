<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// One named/versioned Ansible hardening playbook belonging to a catalog (immutable; retired via
// is_active). The file lives on the private disk at catalog-hardening/{catalog_id}/{id}/.
#[Fillable([
    'catalog_id', 'name', 'version', 'playbook_path', 'playbook_filename',
    'checksum', 'is_active', 'uploaded_by',
])]
class CatalogHardeningVersion extends Model
{
    protected $casts = ['is_active' => 'boolean'];

    public function catalog(): BelongsTo
    {
        return $this->belongsTo(Catalog::class);
    }
}
