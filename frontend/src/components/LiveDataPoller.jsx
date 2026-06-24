import { useEffect, useRef } from 'react';
import api from '../lib/api';
import { isAuthed } from '../lib/auth';
import { getCached, setCached } from '../lib/liveCache';
import { useUserContext } from '../contexts/UserContext';
import { isAdmin, isManager } from '../lib/rbac';
import { connectEcho, disconnectEcho } from '../lib/echo';

/**
 * The single, app-wide live-data driver (Phase 5 / 1c). It is the ONLY thing that fetches the live
 * endpoints; Inventory, Approvals and the NotificationCenter bell are passive consumers of
 * LIVE_CACHE_EVENT (fired by setCached). Two trigger sources funnel into ONE debounced refetch, so
 * they never compete:
 *
 *   1. WebSocket (Reverb) — subscribes to the user's role-scoped channels; any vm.state /
 *      approval.changed event triggers an immediate (debounced) refetch. This is the real-time path.
 *   2. Poll — DEMOTES to a slow heartbeat (HEARTBEAT_MS) while the socket is connected (safety net
 *      for missed frames + out-of-band Proxmox changes), and AUTOMATICALLY reverts to the adaptive
 *      1.5s/5s cadence if the socket drops — so a Reverb outage degrades gracefully to the Phase-2
 *      behaviour, never an outage.
 *
 * On (re)connect it refetches immediately (events missed during the gap are reconciled), with
 * jitter to avoid a thundering herd when Reverb restarts.
 */
const TRANSITIONAL = new Set(['Provisioning', 'Updating', 'Deleting']);
const FAST_MS = 1500;     // adaptive: a VM is mid-transition and the socket is down
const IDLE_MS = 5000;     // adaptive idle (socket down)
const HEARTBEAT_MS = 10000; // socket up → poll is just a safety net (Reverb pushes changes instantly)
const DEBOUNCE_MS = 200;
const PATHS = ['/inventory', '/approvals'];

export default function LiveDataPoller() {
  const { currentUser } = useUserContext();
  const wsConnectedRef = useRef(false);

  useEffect(() => {
    if (!currentUser) return undefined;
    let stopped = false;
    let pollTimer = null;
    let debounceTimer = null;

    // --- the one refetch everything funnels into ---
    const doFetch = async () => {
      if (document.hidden || !isAuthed()) return;
      const rows = await Promise.all(PATHS.map((p) => api.get(p).catch(() => null)));
      if (stopped) return;
      // setCached fires LIVE_CACHE_EVENT → pages + bell update in the same tick.
      PATHS.forEach((p, i) => { if (Array.isArray(rows[i])) setCached(p, rows[i]); });
    };

    // Debounced — a burst of socket events (e.g. a batch op) collapses into one refetch.
    const refreshNow = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => { if (!stopped) doFetch(); }, DEBOUNCE_MS);
    };

    // --- adaptive / heartbeat poll loop ---
    const nextDelay = () => {
      if (document.hidden) return IDLE_MS;
      const inv = getCached('/inventory') || [];
      // Hardening doesn't change the VM `status` and emits no broadcast, so poll fast (even under WS)
      // while any VM is hardening, so the in-progress indicator clears promptly when it finishes.
      if (inv.some((v) => v.hardeningStatus === 'Running')) return FAST_MS;
      if (wsConnectedRef.current) return HEARTBEAT_MS;
      return inv.some((v) => TRANSITIONAL.has(v.status)) ? FAST_MS : IDLE_MS;
    };
    const tick = async () => {
      if (stopped) return;
      await doFetch();
      if (!stopped) pollTimer = setTimeout(tick, nextDelay());
    };

    // --- WebSocket wiring ---
    const echo = connectEcho();
    const conn = echo.connector?.pusher?.connection;
    const onConnState = () => {
      const wasConnected = wsConnectedRef.current;
      wsConnectedRef.current = conn?.state === 'connected';
      // Reconcile on (re)connect — we may have missed events while disconnected. Jitter avoids a
      // synchronized stampede if Reverb restarts and every client reconnects at once.
      if (!wasConnected && wsConnectedRef.current) {
        setTimeout(refreshNow, Math.random() * 1500);
      }
    };
    conn?.bind('state_change', onConnState);
    onConnState();

    const left = [];
    const sub = (channel, events) => {
      events.forEach((ev) => channel.listen(ev, refreshNow));
      return channel;
    };

    // Own channel: own VM + approval events (and, for a manager, group members' VM events).
    sub(echo.private(`user.${currentUser.id}`), ['.vm.state', '.approval.changed']);
    left.push(`user.${currentUser.id}`);

    // Privileged (Manager + Admin): every approval event.
    if (isManager(currentUser)) {
      sub(echo.private('role.privileged'), ['.approval.changed']);
      left.push('role.privileged');
    }

    // Admin: every VM event, over a presence channel that also yields a "who's online" roster.
    if (isAdmin(currentUser)) {
      const adminCh = echo.join('role.admin');
      sub(adminCh, ['.vm.state']);
      adminCh
        .here((members) => console.debug('[reverb] admins online:', members?.length ?? 0))
        .joining((m) => console.debug('[reverb] admin joined:', m?.name))
        .leaving((m) => console.debug('[reverb] admin left:', m?.name));
      left.push('role.admin');
    }

    tick(); // initial fetch + start the poll loop

    return () => {
      stopped = true;
      if (pollTimer) clearTimeout(pollTimer);
      if (debounceTimer) clearTimeout(debounceTimer);
      conn?.unbind('state_change', onConnState);
      left.forEach((name) => echo.leave(name));
      disconnectEcho();
    };
  }, [currentUser]);

  return null;
}
