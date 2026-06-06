import React, { createContext, useContext, useState } from 'react';
import { initialUsers, initialRoles, initialGroups } from '../modules/settings/user/userData';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [users, setUsers] = useState(initialUsers);
  const [roles, setRoles] = useState(initialRoles);
  const [groups, setGroups] = useState(initialGroups);

  return (
    <UserContext.Provider value={{ users, setUsers, roles, setRoles, groups, setGroups }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}
