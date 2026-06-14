import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../lib/api';
import { makeCrud } from '../lib/crud';
import { getToken } from '../lib/auth';

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

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await api.get(RESOURCE);
      setDatastores((rows || []).map(normalizeDatastore));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getToken()) refetch(); // wait for auth — DataBootstrap re-fetches on login
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
