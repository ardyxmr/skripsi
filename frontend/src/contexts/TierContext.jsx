import React, { createContext, useContext, useState } from 'react';
import { initialTiers } from '../modules/settings/tier/tierData';

const TierContext = createContext();

export function useTierContext() {
  return useContext(TierContext);
}

export function TierProvider({ children }) {
  const [tiers, setTiers] = useState(initialTiers);

  return (
    <TierContext.Provider value={{ tiers, setTiers }}>
      {children}
    </TierContext.Provider>
  );
}
