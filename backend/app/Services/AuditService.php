<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;

/**
 * Append-only business audit trail. Called by every state-changing action.
 * Never stores credentials or terraform/system output (04-backend-services.md §7.2).
 */
class AuditService
{
    /**
     * @param  array<string,mixed>|null  $metadata  Structured payload (e.g. vmid, vm_name,
     *                                               environment_id) for exact per-resource filtering.
     */
    public function log(?object $user, string $actionType, string $description, ?Request $request = null, ?array $metadata = null): void
    {
        AuditLog::create([
            'user_id' => $user?->id,
            'user_name' => $user?->name ?? 'system',   // snapshot
            'action_type' => $actionType,
            'description' => $description,
            'ip_address' => $request?->ip() ?? request()?->ip(),
            'metadata' => $metadata,
            // Set explicitly in the app timezone (Asia/Jakarta) so the trail matches every other
            // table. Without this the column falls back to the migration's ->useCurrent() default,
            // which Postgres fills from CURRENT_TIMESTAMP (UTC) — the lone UTC value in the app.
            'created_at' => now(),
        ]);
    }
}
