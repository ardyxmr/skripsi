import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../lib/api';

const ProviderContext = createContext();
const RESOURCE = '/providers';

export function ProviderProvider({ children }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProviders(await api.get(RESOURCE));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = async (data) => {
    const created = await api.post(RESOURCE, data);
    await refetch();
    return created;
  };
  const update = async (id, data) => {
    const updated = await api.put(`${RESOURCE}/${id}`, data);
    await refetch();
    return updated;
  };
  const remove = async (id) => {
    await api.del(`${RESOURCE}/${id}`);
    await refetch();
  };

  return (
    <ProviderContext.Provider
      value={{ providers, setProviders, loading, error, refetch, create, update, remove }}
    >
      {children}
    </ProviderContext.Provider>
  );
}

export function useProviderContext() {
  const context = useContext(ProviderContext);
  if (!context) {
    throw new Error('useProviderContext must be used within a ProviderProvider');
  }
  return context;
}
