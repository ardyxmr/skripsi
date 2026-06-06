import React, { createContext, useContext, useState } from 'react';
import { initialProviders } from '../modules/settings/provider/providerData';

const ProviderContext = createContext();

export function ProviderProvider({ children }) {
  const [providers, setProviders] = useState(initialProviders);

  return (
    <ProviderContext.Provider value={{ providers, setProviders }}>
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
