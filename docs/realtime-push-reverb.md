# Phase 4 (future) — Real-time push with Laravel Reverb

> Status: **DESIGN ONLY — not implemented.** The system is poll-based today (a single adaptive
> frontend poller + the two-tier backend sync). This document describes the drop-in upgrade to
> WebSocket push when/if sub-second, zero-poll freshness is wanted. It is deliberately scoped so
> that adopting it touches very few files, because the seams already exist.

## Why this is cheap to add later

Two seams were built ahead of time specifically so push can be bolted on without re-architecting:

1. **Backend:** `App\Events\VmStateChanged` is already dispatched on *every* inventory status
   transition (via `InventoryObserver`, hung off Eloquent model events). Nothing else needs to
   learn "when did state change" — it's one event, emitted everywhere.
2. **Frontend:** every live surface (Inventory, Approvals, the NotificationCenter bell) is already
   a passive consumer of `LIVE_CACHE_EVENT` fired by `setCached()` in `liveCache.js`. They do not
   poll themselves — the single `LiveDataPoller` does. Swap the poller's *source* from "fetch on a
   timer" to "fetch when the server says so," and every surface updates in lockstep, unchanged.

So push is: **make the event broadcast, subscribe on the client, and refresh-on-signal.**

## What Proxmox can and cannot do

Proxmox VE has **no usable outbound webhooks for VM lifecycle** (its 8.x notification system is for
alerts, not granular per-VM API events). So we do **not** try to get push *from* the provider. The
push boundary we control is **our own job queue / state machine** — exactly where `VmStateChanged`
already fires. The periodic reconciliation sweep still exists to catch out-of-band changes (someone
stops a VM in the Proxmox console); push only accelerates changes *we* initiate.

## Backend changes

### 1. Install Reverb (first-party WebSocket server)

```bash
composer require laravel/reverb
php artisan reverb:install        # writes config/reverb.php, sets BROADCAST_CONNECTION=reverb
```

`.env` (dev):

```
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=...        REVERB_APP_KEY=...        REVERB_APP_SECRET=...
REVERB_HOST=127.0.0.1    REVERB_PORT=8080          REVERB_SCHEME=http
```

Run it alongside the existing stack: `php artisan reverb:start` (add to the process list next to
`serve` / `queue:work` / `schedule:work`).

### 2. Make the existing event broadcast (the ONLY backend code change)

`App\Events\VmStateChanged` — add the interface + channel + payload. No call sites change because the
observer already dispatches it:

```php
class VmStateChanged implements ShouldBroadcast   // was: (nothing)
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    // ...existing constructor (Inventory $inventory, ?string $previousStatus, string $currentStatus)...

    public function broadcastOn(): array
    {
        // Per-owner private channel so a user only hears about VMs they can see.
        // (Managers/Admins: either broadcast on a shared "fleet" channel or fan out per owner.)
        return [new PrivateChannel('user.'.$this->inventory->owner_user_id)];
    }

    public function broadcastAs(): string
    {
        return 'vm.state';
    }

    public function broadcastWith(): array
    {
        // Keep it a NOTIFY, not the source of truth — the client still refetches the row(s).
        return [
            'id' => $this->inventory->id,
            'status' => $this->currentStatus,
            'previous' => $this->previousStatus,
        ];
    }
}
```

`routes/channels.php` — authorize the private channel:

```php
Broadcast::channel('user.{id}', fn ($user, $id) => (int) $user->id === (int) $id);
```

Because the queue workers run `VmStateChanged::dispatch(...)` already, every provision/resize/
edit/add-disk/delete transition will now also hit the websocket. (Approvals don't have an Eloquent
status event yet; if push is wanted for new approval rows too, add an `ApprovalRequest` observer that
broadcasts an analogous `ApprovalChanged` event.)

## Frontend changes

### 1. Echo client

```bash
npm i laravel-echo pusher-js
```

`src/lib/echo.js` (new):

```js
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
window.Pusher = Pusher;
export const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: import.meta.env.VITE_REVERB_PORT,
  forceTLS: false,
  enabledTransports: ['ws', 'wss'],
  authEndpoint: '/api/broadcasting/auth',  // Sanctum-guarded
});
```

> **As shipped (ADR-24):** channel auth rides the **cookie session**, not a bearer token. The client uses a
> custom `authorizer` that POSTs to `/api/broadcasting/auth` with `withCredentials: true` + `withXSRFToken: true`
> (raw axios, so humps doesn't rewrite Reverb's `auth`/`channel_data`). `wsHost`/`wsPort` default to the page
> origin (the nginx/Vite `/app` proxy), so no token and no extra port are needed.

### 2. Turn the poller into a push listener (the only behavioural change)

In `LiveDataPoller.jsx`, keep the existing adaptive poll as a **fallback heartbeat** (e.g. relax it
to 20–30s), and add a subscription that triggers an immediate refresh when the server signals:

```js
echo.private(`user.${currentUser.id}`)
    .listen('.vm.state', () => { /* refetch /inventory (+ /approvals) → setCached → LIVE_CACHE_EVENT */ });
```

Everything downstream (`LIVE_CACHE_EVENT` → Inventory/Approvals/bell re-render) is **unchanged**. The
poll becomes a safety net for missed frames / out-of-band changes; the websocket carries the common
case with sub-second latency and near-zero idle DB load.

> Optional optimisation: `broadcastWith` already carries `{id, status}`, so a transition could be
> applied optimistically to the cached row before the refetch confirms it — but refetch-on-signal is
> simpler and keeps the DB the single source of truth.

## What this buys, and the cost

| | Poll-based (today) | Push (Phase 4) |
|---|---|---|
| On-page freshness | 1.5s during transitions / 5s idle | sub-second on transition |
| Idle DB load | one query per 5s per active client | ~zero (heartbeat only) |
| Cross-user (approver sees new request) | ≤ poll interval | sub-second |
| Infra | none beyond PHP/PG | + a Reverb process + WS port |
| Code touched | — | 1 backend class + channels route + 1 frontend file |

## Recommendation

Stay poll-based until either (a) concurrent client count makes the idle poll load matter, or (b) a
demo needs the "instant" feel. The seams above make the switch a contained, low-risk change rather
than a rewrite — which is the whole point of having built `VmStateChanged` and the single
`LIVE_CACHE_EVENT`-driven poller now.
