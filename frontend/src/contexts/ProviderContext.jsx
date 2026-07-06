import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../lib/api';
import { isAuthed } from '../lib/auth';
import { LIVE_CACHE_EVENT } from '../lib/liveCache';

const ProviderContext = createContext();
const RESOURCE = '/providers';

export function ProviderProvider({ children }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // silent:true skips the loading/error churn — used by the background live refresh so the
  // connection state updates in place without flashing a spinner.
  const refetch = useCallback(async ({ silent = false } = {}) => {
    if (!silent) { setLoading(true); setError(null); }
    try {
      setProviders(await api.get(RESOURCE));
    } catch (e) {
      if (!silent) setError(e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthed()) refetch(); // wait for auth — DataBootstrap re-fetches on login
  }, [refetch]);

  // Keep the connection status live: piggy-back on the app-wide poll (LiveDataPoller fires
  // LIVE_CACHE_EVENT ~every 10s). This mirrors the freshly auto-synced provider.status into every
  // consumer (Catalog page provider count, wizard) without anyone pressing Test/Refresh. Gated on the
  // '/inventory' path so the two events per poll cycle collapse into one refetch.
  useEffect(() => {
    const onLive = (e) => { if (e?.detail?.path === '/inventory' && isAuthed()) refetch({ silent: true }); };
    window.addEventListener(LIVE_CACHE_EVENT, onLive);
    return () => window.removeEventListener(LIVE_CACHE_EVENT, onLive);
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
