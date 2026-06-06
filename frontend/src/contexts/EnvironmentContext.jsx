import React, { createContext, useContext, useState } from 'react';
import { initialEnvironments } from '../modules/settings/environment/environmentData';

const EnvironmentContext = createContext();

export function EnvironmentProvider({ children }) {
  const [environments, setEnvironments] = useState(initialEnvironments);

  return (
    <EnvironmentContext.Provider value={{ environments, setEnvironments }}>
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
