import React, { createContext, useContext, useState } from 'react';
import { initialCatalogs } from '../modules/settings/catalog/catalogData';

const CatalogContext = createContext();

export function CatalogProvider({ children }) {
  const [catalogs, setCatalogs] = useState(initialCatalogs);

  return (
    <CatalogContext.Provider value={{ catalogs, setCatalogs }}>
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
