import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../lib/api';
import { makeCrud } from '../lib/crud';
import { getToken } from '../lib/auth';

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

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = (await api.get(RESOURCE) || []).map(normalizeCatalog);
      setCatalogs(rows);
      preloadCatalogImages(rows); // warm icon cache ahead of the Catalog page
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getToken()) refetch(); // wait for auth — DataBootstrap re-fetches on login
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
