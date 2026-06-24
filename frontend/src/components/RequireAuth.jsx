import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useUserContext } from '../contexts/UserContext';

export default function RequireAuth() {
  const { currentUser, authLoading } = useUserContext();
  const location = useLocation();

  // Still resolving the boot /auth/me session probe.
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-teal-600 dark:text-teal-400">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <Outlet />;
}
