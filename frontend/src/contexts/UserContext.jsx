import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../lib/api';
import { isAuthed, setAuthed } from '../lib/auth';
import { AUTH_BYPASS, getBypassUser } from '../lib/devAuth';
import { makeCrud } from '../lib/crud';

const UserContext = createContext();

// Alias API fields onto the names the User/Role/Group tables render.
export const normalizeUser = (row = {}) => ({
  ...row,
  name: row.name ?? '',
  email: row.email ?? '',
  roleId: row.roleId ?? null,
  groupId: row.groupId ?? null,
  status: row.status ?? '',
  createdAt: row.createdAt ?? '',
  lastLogin: row.lastLogin ?? '-',
});

export const normalizeRole = (row = {}) => ({
  ...row,
  name: row.roleName ?? row.name ?? '',
  description: row.description ?? '',
  permissions: row.permissions ?? [],
  userCount: row.userCount ?? 0,
  status: row.status ?? 'Active',
  createdAt: row.createdAt ?? '',
});

export const normalizeGroup = (row = {}) => ({
  ...row,
  name: row.groupName ?? row.name ?? '',
  room: row.roomFloor ?? row.room ?? '',
  managerId: row.managerUserId ?? row.managerId ?? null,
  description: row.description ?? '',
  memberCount: row.memberCount ?? 0,
  createdAt: row.createdAt ?? '',
});

export function UserProvider({ children }) {
  // Authenticated current user (separate from the admin-managed lists below).
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Admin-managed lists.
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // On boot: if a token exists but no user is loaded, resolve the session.
  useEffect(() => {
    let active = true;
    (async () => {
      // DEV-ONLY bypass: restore the local admin without hitting the backend.
      if (AUTH_BYPASS) {
        const u = getBypassUser();
        if (active && u) { setAuthed(true); setCurrentUser(u); }
      } else {
        // Cookie auth: always probe /auth/me on boot. A 200 means a valid session cookie exists
        // (rehydrate); a 401 means logged out (expected on the login screen — swallowed here).
        try {
          const me = await api.get('/auth/me');
          if (active) { setAuthed(true); setCurrentUser(me); }
        } catch {
          if (active) setAuthed(false);
        }
      }
      if (active) setAuthLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const fetchAdminLists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, r, g] = await Promise.all([
        api.get('/users'),
        api.get('/roles'),
        api.get('/groups'),
      ]);
      setUsers((u || []).map(normalizeUser));
      setRoles((r || []).map(normalizeRole));
      setGroups((g || []).map(normalizeGroup));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthed()) fetchAdminLists(); // wait for auth — DataBootstrap re-fetches on login
  }, [fetchAdminLists]);

  const userCrud = makeCrud('/users', setUsers, fetchAdminLists, normalizeUser);
  const roleCrud = makeCrud('/roles', setRoles, fetchAdminLists, normalizeRole);
  const groupCrud = makeCrud('/groups', setGroups, fetchAdminLists, normalizeGroup);

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        authLoading,
        users,
        roles,
        groups,
        setUsers,
        setRoles,
        setGroups,
        loading,
        error,
        fetchAdminLists,
        createUser: userCrud.create,
        updateUser: userCrud.update,
        deleteUser: userCrud.remove,
        createRole: roleCrud.create,
        updateRole: roleCrud.update,
        deleteRole: roleCrud.remove,
        createGroup: groupCrud.create,
        updateGroup: groupCrud.update,
        deleteGroup: groupCrud.remove,
      }}
    >
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

export const useCurrentUser = () => useUserContext().currentUser;
