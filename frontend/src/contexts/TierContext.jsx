import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../lib/api';
import { makeCrud } from '../lib/crud';

const TierContext = createContext();
const RESOURCE = '/tiers';

// API stores RAM in MB; the table/form display GB. Keep both available.
export function normalizeTier(row = {}) {
  const ramMb = row.ramMb ?? (row.ram != null ? row.ram * 1024 : null);
  return {
    ...row,
    name: row.tierName ?? row.name ?? '',
    description: row.description ?? '',
    cpu: row.cpu ?? 0,
    ram: ramMb != null ? Math.round(ramMb / 1024) : 0,
    ramMb,
    disk: row.diskGb ?? row.disk ?? 0,
    status: row.status ?? '',
    type: row.type ?? 'Custom',
    createdDate: row.createdAt ?? row.createdDate ?? '',
  };
}

export function TierProvider({ children }) {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await api.get(RESOURCE);
      setTiers((rows || []).map(normalizeTier));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const { create, update, remove } = makeCrud(RESOURCE, setTiers, refetch, normalizeTier);

  return (
    <TierContext.Provider
      value={{ tiers, setTiers, loading, error, refetch, create, update, remove }}
    >
      {children}
    </TierContext.Provider>
  );
}

export function useTierContext() {
  return useContext(TierContext);
}
