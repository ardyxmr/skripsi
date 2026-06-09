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
    public function log(?object $user, string $actionType, string $description, ?Request $request = null): void
    {
        AuditLog::create([
            'user_id' => $user?->id,
            'user_name' => $user?->name ?? 'system',   // snapshot
            'action_type' => $actionType,
            'description' => $description,
            'ip_address' => $request?->ip() ?? request()?->ip(),
        ]);
    }
}
