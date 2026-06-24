import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUserContext } from '../contexts/UserContext';
import { useUI } from '../stores/uiStore';

export default function RequireRole({ roles = [] }) {
  const { currentUser } = useUserContext();
  const pushToast = useUI((s) => s.pushToast);

  const allowed = currentUser && roles.includes(currentUser.role);

  useEffect(() => {
    if (currentUser && !allowed) {
      pushToast({ kind: 'error', message: "You don't have access to that page." });
    }
  }, [currentUser, allowed, pushToast]);

  if (!allowed) return <Navigate to="/catalog" replace />;

  return <Outlet />;
}
