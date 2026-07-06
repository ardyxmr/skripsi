import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../lib/api';
import { makeCrud } from '../lib/crud';
import { isAuthed } from '../lib/auth';
import { LIVE_CACHE_EVENT } from '../lib/liveCache';

const CatalogContext = createContext();
const RESOURCE = '/catalogs';

// Warm the browser cache for catalog icons as soon as the list is fetched (app-level,
// at startup / on login) so the Catalog page shows them instantly instead of fetching
// each <img> only after navigation. References are retained so the decoded bitmaps
// aren't garbage-collected between visits.
const preloadedImages = new Map();
function preloadCatalogImages(rows = []) {
  for (const row of rows) {
    const url = row?.catalogImage;
    if (url && !preloadedImages.has(url)) {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      preloadedImages.set(url, img);
    }
  }
}

// Alias API fields → the names the catalog table renders, with safe defaults
// (prevents `undefined.toLowerCase()` crashes on real data).
export function normalizeCatalog(row = {}) {
  return {
    ...row,
    name: row.catalogName ?? row.name ?? '',
    description: row.catalogDescription ?? row.description ?? '',
    provider: row.providerName ?? row.provider ?? '',
    node: row.nodeName ?? row.node ?? '',
    template: row.providerTemplateName ?? row.templateName ?? row.template ?? '',
    status: row.status ?? '',
    environments: row.environments ?? [],
    tiers: row.tiers ?? [],
    activeVMs: row.activeVms ?? row.activeVMs ?? 0,
    catalogImage: row.catalogImage ?? null,
    lastUpdated: row.updatedAt ?? row.lastUpdated ?? '',
  };
}

export function CatalogProvider({ children }) {
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // silent:true skips the loading/error UI churn — used by background live refreshes (e.g. Usage
  // count following an inventory change) so the table data updates without flashing the skeleton.
  const refetch = useCallback(async ({ silent = false } = {}) => {
    if (!silent) { setLoading(true); setError(null); }
    try {
      const rows = (await api.get(RESOURCE) || []).map(normalizeCatalog);
      setCatalogs(rows);
      preloadCatalogImages(rows); // warm icon cache ahead of the Catalog page
    } catch (e) {
      if (!silent) setError(e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthed()) refetch(); // wait for auth — DataBootstrap re-fetches on login
  }, [refetch]);

  // Keep the published-catalog view live: piggy-back on the app-wide poll (LiveDataPoller fires
  // LIVE_CACHE_EVENT ~every 10s). A catalog's status is derived from its provider/node health, so
  // when a provider goes offline the main Catalog grid + counts drop it without a manual refresh.
  // Gated on '/inventory' so the two events per poll cycle collapse into one refetch.
  useEffect(() => {
    const onLive = (e) => { if (e?.detail?.path === '/inventory' && isAuthed()) refetch({ silent: true }); };
    window.addEventListener(LIVE_CACHE_EVENT, onLive);
    return () => window.removeEventListener(LIVE_CACHE_EVENT, onLive);
  }, [refetch]);

  const { create, update, remove } = makeCrud(RESOURCE, setCatalogs, refetch, normalizeCatalog);

  return (
    <CatalogContext.Provider
      value={{ catalogs, setCatalogs, loading, error, refetch, create, update, remove }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalogContext() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalogContext must be used within a CatalogProvider');
  }
  return context;
}
