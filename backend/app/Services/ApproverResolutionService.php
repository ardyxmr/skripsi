<?php

namespace App\Services;

use App\Models\User;

/**
 * Resolves the approver for a request: requester → group → group manager
 * (04-backend-services.md §4.4). Returns null when the requester has no group
 * or the group has no manager — the request still routes; any Manager/Admin can act.
 */
class ApproverResolutionService
{
    public function resolve(User $requester): ?User
    {
        return $requester->group?->manager;
    }
}
