import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../lib/api';
import { makeCrud } from '../lib/crud';
import { isAuthed } from '../lib/auth';

const NetworkContext = createContext();
const RESOURCE = '/networks';

export function normalizeNetwork(row = {}) {
  return {
    ...row,
    name: row.networkName ?? row.name ?? '',
    description: row.description ?? '',
    provider: row.providerName ?? row.provider ?? '',
    node: row.nodeName ?? row.node ?? '',
    providerNetwork: row.providerNetworkName ?? row.providerNetwork ?? '',
    cidr: row.cidr ?? '',
    status: row.status ?? '',
    environment: row.environment ?? [],
    tiers: row.tiers ?? [],
    activeVMs: row.activeVms ?? row.activeVMs ?? 0,
    lastUpdated: row.updatedAt ?? row.lastUpdated ?? '',
  };
}

export function NetworkProvider({ children }) {
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // silent:true skips the loading/error UI churn — used by background live refreshes (the Usage
  // column following an inventory change) so the data updates without flashing the skeleton.
  const refetch = useCallback(async ({ silent = false } = {}) => {
    if (!silent) { setLoading(true); setError(null); }
    try {
      const rows = await api.get(RESOURCE);
      setNetworks((rows || []).map(normalizeNetwork));
    } catch (e) {
      if (!silent) setError(e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthed()) refetch(); // wait for auth — DataBootstrap re-fetches on login
  }, [refetch]);

  const { create, update, remove } = makeCrud(RESOURCE, setNetworks, refetch, normalizeNetwork);

  return (
    <NetworkContext.Provider
      value={{ networks, setNetworks, loading, error, refetch, create, update, remove }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetworkContext() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetworkContext must be used within a NetworkProvider');
  }
  return context;
}
