import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../lib/api';
import { makeCrud } from '../lib/crud';
import { getToken } from '../lib/auth';

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

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await api.get(RESOURCE);
      setNetworks((rows || []).map(normalizeNetwork));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getToken()) refetch(); // wait for auth — DataBootstrap re-fetches on login
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
