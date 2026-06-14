<?php

use Illuminate\Support\Facades\Broadcast;

/*
 * Broadcast channel authorization. $user is resolved by the `auth:sanctum` guard from the bearer
 * token (see bootstrap/app.php withBroadcasting) — no session cookie involved.
 *
 * PRINCIPLE: a channel's auth predicate MUST mirror the matching API read-scope, so WebSockets can
 * never be a wider data path than HTTP.
 */

// A user may subscribe only to their OWN channel. Carries their own VM + approval events, AND —
// for a Manager — the VM events of their group's members (VmStateChanged routes those to the
// manager's own user channel, so no group channels are needed).
Broadcast::channel('user.{id}', fn ($user, $id) => (int) $user->id === (int) $id);

// All privileged users (Manager + Admin) — mirrors the Approval index scope (isPrivileged → all).
// Carries every approval event.
Broadcast::channel('role.privileged', fn ($user) => $user->isPrivileged());

// Administrators — PRESENCE channel: carries all VM fleet events (mirrors the Admin "see all"
// inventory scope) and powers a "who's online" roster. Returns member data when authorized.
Broadcast::channel('role.admin', fn ($user) => $user->role?->role_name === 'Administrator'
    ? ['id' => $user->id, 'name' => $user->name ?? $user->email]
    : null);
