import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../lib/api';
import { makeCrud } from '../lib/crud';
import { isAuthed } from '../lib/auth';
import { LIVE_CACHE_EVENT } from '../lib/liveCache';

const EnvironmentContext = createContext();
const RESOURCE = '/environments';

export function normalizeEnvironment(row = {}) {
  return {
    ...row,
    name: row.environmentName ?? row.name ?? '',
    environmentName: row.environmentName ?? row.name ?? '',
    description: row.description ?? '',
    expiryType: row.expiryType ?? 'days',
    expiryValue: row.expiryValue ?? null,
    gracePeriodType: row.gracePeriodType ?? 'days',
    gracePeriodValue: row.gracePeriodValue ?? 7,
    approvalRequired: row.approvalRequired ?? false,
    allowDataDisk: row.allowDataDisk ?? false,
    maxDataDisks: row.maxDataDisks ?? 6,
    // status = health-derived (Active | Degraded | Provider/Node Offline | Inactive);
    // adminStatus = the raw governance flag the Enable/Disable toggle must act on.
    status: row.status ?? '',
    adminStatus: row.adminStatus ?? row.status ?? '',
    type: row.type ?? 'Custom',
    lastUpdated: row.updatedAt ?? row.lastUpdated ?? '',
  };
}

export function EnvironmentProvider({ children }) {
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // silent:true skips the loading/error UI churn — used by background live refreshes so the
  // status updates without flashing the skeleton.
  const refetch = useCallback(async ({ silent = false } = {}) => {
    if (!silent) { setLoading(true); setError(null); }
    try {
      const rows = await api.get(RESOURCE);
      setEnvironments((rows || []).map(normalizeEnvironment));
    } catch (e) {
      if (!silent) setError(e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthed()) refetch(); // wait for auth — DataBootstrap re-fetches on login
  }, [refetch]);

  // Keep the status live app-wide (not just while the Settings tab is mounted): an environment's
  // status is derived from its allowed providers/nodes health, so when a provider goes offline the
  // list flips to Degraded/Offline on its own. Rides the LiveDataPoller heartbeat (~10s).
  useEffect(() => {
    const onLive = (e) => { if (e?.detail?.path === '/inventory' && isAuthed()) refetch({ silent: true }); };
    window.addEventListener(LIVE_CACHE_EVENT, onLive);
    return () => window.removeEventListener(LIVE_CACHE_EVENT, onLive);
  }, [refetch]);

  const { create, update, remove } = makeCrud(RESOURCE, setEnvironments, refetch, normalizeEnvironment);

  // Wizard Step 1 -> Step 2 resource filtering.
  const allowedResources = async (id) => api.get(`${RESOURCE}/${id}/allowed-resources`);

  return (
    <EnvironmentContext.Provider
      value={{ environments, setEnvironments, loading, error, refetch, create, update, remove, allowedResources }}
    >
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironmentContext() {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error('useEnvironmentContext must be used within an EnvironmentProvider');
  }
  return context;
}
