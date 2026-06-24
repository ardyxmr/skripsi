import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Clock } from 'lucide-react';
import ConfirmModal from './common/ConfirmModal';
import api from '../lib/api';

// Idle auto-logout. After IDLE_MS of no user input the session is ended; a warning modal with a live
// countdown appears WARN_MS before that. Cross-tab coordinated via a shared localStorage timestamp so
// activity in any tab keeps every tab alive (a single shared session cookie backs them all).
const IDLE_MS = (Number(import.meta.env.VITE_IDLE_TIMEOUT_MIN) || 60) * 60_000;
const WARN_MS = (Number(import.meta.env.VITE_IDLE_WARN_MIN) || 5) * 60_000;
const ACTIVITY_KEY = 'infraprov.lastActivity';
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'wheel'];

const fmt = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export default function IdleTimeout({ onLogout }) {
  const [warning, setWarning] = useState(false);
  const [remaining, setRemaining] = useState(WARN_MS);

  const lastActivityRef = useRef(Date.now());
  const lastWriteRef = useRef(0);
  const warningRef = useRef(false);
  const loggedOutRef = useRef(false);
  const onLogoutRef = useRef(onLogout);
  onLogoutRef.current = onLogout;

  const hideWarning = useCallback(() => {
    if (warningRef.current) {
      warningRef.current = false;
      setWarning(false);
    }
  }, []);

  // Record activity locally and (throttled) to localStorage so other tabs reset too.
  const markActivity = useCallback((ts = Date.now(), broadcast = true) => {
    lastActivityRef.current = ts;
    if (broadcast && ts - lastWriteRef.current > 5000) {
      lastWriteRef.current = ts;
      try { localStorage.setItem(ACTIVITY_KEY, String(ts)); } catch { /* quota/ignore */ }
    }
    hideWarning();
  }, [hideWarning]);

  const doLogout = useCallback(() => {
    if (loggedOutRef.current) return;
    loggedOutRef.current = true;
    warningRef.current = false;
    setWarning(false);
    onLogoutRef.current?.();
  }, []);

  // Explicit "Stay logged in" — counts as activity + pings /auth/me to refresh the server session.
  const stay = useCallback(() => {
    markActivity(Date.now(), true);
    api.get('/auth/me').catch(() => { /* a 401 is handled globally by the api interceptor */ });
  }, [markActivity]);

  useEffect(() => {
    // Seed from a timestamp another tab recorded — but ONLY if it's still within the idle window.
    // A stale value left in localStorage from a previous session (or before a fresh service boot)
    // is older than IDLE_MS; adopting it would auto-logout a fresh login on the very next tick
    // (the bug: login succeeds, then ~1s later a forced logout, repeating until activity rewrites
    // the shared timestamp). In that case start a fresh clock and re-sync the shared timestamp so
    // every tab agrees. A recent value (mid-session refresh) is still honoured so the idle countdown
    // survives a reload.
    try {
      const stored = Number(localStorage.getItem(ACTIVITY_KEY));
      if (stored && !Number.isNaN(stored) && Date.now() - stored < IDLE_MS) {
        lastActivityRef.current = stored;
      } else {
        markActivity(Date.now(), true);
      }
    } catch { /* ignore */ }

    const onActivity = () => markActivity();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    // Returning to a backgrounded tab counts as activity.
    const onVisible = () => { if (!document.hidden) markActivity(); };
    document.addEventListener('visibilitychange', onVisible);

    // Another tab recorded activity → reset our clock + dismiss any warning here.
    const onStorage = (ev) => {
      if (ev.key === ACTIVITY_KEY && ev.newValue) {
        const ts = Number(ev.newValue);
        if (ts && !Number.isNaN(ts)) { lastActivityRef.current = Math.max(lastActivityRef.current, ts); hideWarning(); }
      }
    };
    window.addEventListener('storage', onStorage);

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= IDLE_MS) {
        doLogout();
      } else if (elapsed >= IDLE_MS - WARN_MS) {
        if (!warningRef.current) { warningRef.current = true; setWarning(true); }
        setRemaining(IDLE_MS - elapsed);
      } else {
        hideWarning();
      }
    }, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('storage', onStorage);
      clearInterval(interval);
    };
  }, [markActivity, hideWarning, doLogout]);

  return (
    <ConfirmModal
      isOpen={warning}
      title="Session expiring"
      confirmLabel="Stay logged in"
      cancelLabel="Log out now"
      onConfirm={stay}
      onClose={doLogout}
      message={(
        <div className="flex items-start gap-3">
          <Clock size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[13px] text-slate-700 dark:text-zinc-300">
            You&apos;ve been inactive. For your security you&apos;ll be logged out in{' '}
            <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">{fmt(remaining)}</span>.
            <div className="mt-1 text-slate-500 dark:text-zinc-400">Move the mouse or choose “Stay logged in” to continue.</div>
          </div>
        </div>
      )}
    />
  );
}
