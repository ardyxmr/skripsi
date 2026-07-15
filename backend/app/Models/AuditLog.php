<?php

namespace App\Models;

use App\Services\AuditSeverity;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    // Append-only: only created_at (set explicitly by AuditService in app tz), no updated_at.
    public $timestamps = false;

    // Resolved on read (see AuditSeverity) rather than stored, so old rows get the right badge
    // without a backfill — which an append-only trail must never have.
    protected $appends = ['severity'];

    protected $fillable = [
        'user_id', 'user_name', 'action_type', 'description', 'ip_address', 'metadata', 'created_at',
    ];

    // created_at MUST be cast: without it the API emits a naive string ("2026-07-13 15:12:12", no Z)
    // and the frontend's new Date() reads it as browser-local, rendering the stored value's digits as
    // if they were WIB. Every other model casts its dates, which is why audit was the lone outlier.
    // The cast reads the naive column using config('app.timezone') — the same zone that wrote it — so
    // it is correct on both dev (Asia/Jakarta) and prod (UTC, no APP_TIMEZONE in .env), and fixes old
    // rows as well as new ones. Do NOT "fix" this by setting APP_TIMEZONE on prod: that reinterprets
    // every existing naive timestamp app-wide and shifts history by 7h.
    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function getSeverityAttribute(): string
    {
        return AuditSeverity::for($this->action_type, $this->metadata ?? []);
    }
}
