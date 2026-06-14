import { useEffect } from 'react';
import api from '../lib/api';
import { getToken } from '../lib/auth';
import { getCached, setCached } from '../lib/liveCache';
import { useUserContext } from '../contexts/UserContext';

/**
 * The single, app-wide live-data poller (Phase 2). Mounted once in the authed layout, it is
 * the ONLY thing that polls the live endpoints — Inventory, Approvals, and the NotificationCenter
 * bell are all passive consumers that react to LIVE_CACHE_EVENT (fired by setCached). One timer,
 * one source of truth, so every surface updates in the same tick.
 *
 * ADAPTIVE CADENCE: it accelerates to 1.5s while any visible VM is in a transitional state
 * (Provisioning / Updating / Deleting) — i.e. a job is in flight and its runtime facts are
 * changing — and relaxes to 5s when everything is settled. The transitional state IS the boost
 * signal, so it's fully self-regulating: reaching a terminal state ends the boost automatically.
 * Paused while the tab is hidden; kicks an immediate refresh when it becomes visible again.
 */
const TRANSITIONAL = new Set(['Provisioning', 'Updating', 'Deleting']);
const FAST_MS = 1500;
const IDLE_MS = 5000;
const PATHS = ['/inventory', '/approvals'];

// Boost while any cached (already RBAC-scoped) inventory row is mid-transition.
function nextDelay() {
  if (document.hidden) return IDLE_MS;
  const inv = getCached('/inventory') || [];
  return inv.some((v) => TRANSITIONAL.has(v.status)) ? FAST_MS : IDLE_MS;
}

export default function LiveDataPoller() {
  const { currentUser } = useUserContext();

  useEffect(() => {
    if (!currentUser) return undefined;
    let stopped = false;
    let timer = null;

    const schedule = (delay) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(run, delay);
    };

    const run = async () => {
      if (stopped) return;
      if (!document.hidden && getToken()) {
        const rows = await Promise.all(PATHS.map((p) => api.get(p).catch(() => null)));
        if (stopped) return;
        // setCached fires LIVE_CACHE_EVENT → pages + bell update in the same tick.
        PATHS.forEach((p, i) => { if (Array.isArray(rows[i])) setCached(p, rows[i]); });
      }
      if (!stopped) schedule(nextDelay());
    };

    const onVisible = () => { if (!document.hidden) schedule(0); };

    run(); // immediate first fetch
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [currentUser]);

  return null;
}
