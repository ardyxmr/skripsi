import React, { createContext, useContext, useState } from 'react';
import { initialNetworks } from '../modules/settings/network/networkData';

const NetworkContext = createContext();

export function NetworkProvider({ children }) {
  const [networks, setNetworks] = useState(initialNetworks);

  return (
    <NetworkContext.Provider value={{ networks, setNetworks }}>
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
