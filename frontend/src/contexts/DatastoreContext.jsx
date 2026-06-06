import React, { createContext, useContext, useState } from 'react';
import { initialDatastores } from '../modules/settings/datastore/datastoreData';

const DatastoreContext = createContext();

export function DatastoreProvider({ children }) {
  const [datastores, setDatastores] = useState(initialDatastores);

  return (
    <DatastoreContext.Provider value={{ datastores, setDatastores }}>
      {children}
    </DatastoreContext.Provider>
  );
}

export function useDatastoreContext() {
  const context = useContext(DatastoreContext);
  if (!context) {
    throw new Error('useDatastoreContext must be used within a DatastoreProvider');
  }
  return context;
}
