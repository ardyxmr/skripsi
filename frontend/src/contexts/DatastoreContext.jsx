import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../lib/api';
import { makeCrud } from '../lib/crud';
import { isAuthed } from '../lib/auth';
import { LIVE_CACHE_EVENT } from '../lib/liveCache';

const DatastoreContext = createContext();
const RESOURCE = '/datastores';

const toGb = (b) => (b == null ? null : `${Math.round(b / 1024 / 1024 / 1024)} GB`);

export function normalizeDatastore(row = {}) {
  const total = row.totalSpace;
  const avail = row.availableSpace;
  const used = total != null && avail != null ? total - avail : null;
  const pct = total ? Math.round(((total - (avail ?? 0)) / total) * 100) : 0;
  return {
    ...row,
    name: row.datastoreName ?? row.name ?? '',
    description: row.description ?? '',
    provider: row.providerName ?? row.provider ?? '',
    node: row.nodeName ?? row.node ?? '',
    providerDatastore: row.providerDatastoreName ?? row.providerDatastore ?? '',
    type: row.datastoreType ?? row.type ?? '',
    status: row.status ?? '',
    environment: row.environment ?? [],
    tiers: row.tiers ?? [],
    activeVMs: row.activeVms ?? row.activeVMs ?? 0,
    capacity: row.capacity ?? {
      total: toGb(total) ?? '—',
      used: toGb(used) ?? '—',
      available: toGb(avail) ?? '—',
      percentage: pct,
    },
    lastUpdated: row.updatedAt ?? row.lastUpdated ?? '',
  };
}

export function DatastoreProvider({ children }) {
  const [datastores, setDatastores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // silent:true skips the loading/error UI churn — used by background live refreshes (the Usage
  // column following an inventory change) so the data updates without flashing the skeleton.
  const refetch = useCallback(async ({ silent = false } = {}) => {
    if (!silent) { setLoading(true); setError(null); }
    try {
      const rows = await api.get(RESOURCE);
      setDatastores((rows || []).map(normalizeDatastore));
    } catch (e) {
      if (!silent) setError(e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthed()) refetch(); // wait for auth — DataBootstrap re-fetches on login
  }, [refetch]);

  // Keep the status live app-wide (not just while the Settings tab is mounted): a datastore's status
  // is derived from its provider/node health, so when a provider goes offline the list flips to
  // "Provider Offline" on its own. Rides the LiveDataPoller heartbeat (~10s), gated on '/inventory'.
  useEffect(() => {
    const onLive = (e) => { if (e?.detail?.path === '/inventory' && isAuthed()) refetch({ silent: true }); };
    window.addEventListener(LIVE_CACHE_EVENT, onLive);
    return () => window.removeEventListener(LIVE_CACHE_EVENT, onLive);
  }, [refetch]);

  const { create, update, remove } = makeCrud(RESOURCE, setDatastores, refetch, normalizeDatastore);

  return (
    <DatastoreContext.Provider
      value={{ datastores, setDatastores, loading, error, refetch, create, update, remove }}
    >
      {children}
    </DatastoreContext.Provider>
  );
}

export function useDatastoreContext() {
  const context = useContext(DatastoreContext);
  if (!context) {
    throw new Error('useDatastoreContext must be used within a DatastoreProvider');
  }
  return context;
}
