import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useUserContext } from '../contexts/UserContext';
import { getToken } from '../lib/auth';

export default function RequireAuth() {
  const { currentUser, authLoading } = useUserContext();
  const location = useLocation();

  // Still resolving GET /auth/me from a stored token.
  if (authLoading && getToken()) {
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
