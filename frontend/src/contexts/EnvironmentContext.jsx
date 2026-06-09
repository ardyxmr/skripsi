import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../lib/api';
import { makeCrud } from '../lib/crud';

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
    approvalRequired: row.approvalRequired ?? false,
    allowDataDisk: row.allowDataDisk ?? false,
    status: row.status ?? '',
    type: row.type ?? 'Custom',
    lastUpdated: row.updatedAt ?? row.lastUpdated ?? '',
  };
}

export function EnvironmentProvider({ children }) {
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await api.get(RESOURCE);
      setEnvironments((rows || []).map(normalizeEnvironment));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
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
