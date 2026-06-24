import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { MonitorPlay, Lock, Mail, Loader2 } from 'lucide-react';
import api, { ensureCsrf } from '../lib/api';
import { setAuthed } from '../lib/auth';
import { AUTH_BYPASS, makeBypassUser, setBypassUser } from '../lib/devAuth';
import { useUserContext } from '../contexts/UserContext';
import { useUI } from '../stores/uiStore';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, setCurrentUser } = useUserContext();
  const pushToast = useUI((s) => s.pushToast);
  const [authError, setAuthError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  // Already authenticated (e.g. landed here via the browser Back button while a
  // session is active) → bounce into the app instead of showing the form again.
  // Placed after all hook calls so hook order stays stable across renders.
  if (currentUser) {
    const next = searchParams.get('next');
    return <Navigate to={next ? decodeURIComponent(next) : '/catalog'} replace />;
  }

  const onSubmit = async (values) => {
    setAuthError('');

    // DEV-ONLY bypass: skip the backend and sign in as a local admin.
    if (AUTH_BYPASS) {
      const user = makeBypassUser(values.email);
      setAuthed(true);
      setBypassUser(user);
      setCurrentUser(user);
      const next = searchParams.get('next');
      navigate(next ? decodeURIComponent(next) : '/catalog', { replace: true });
      return;
    }

    try {
      // Prime the XSRF-TOKEN + session cookies, then log in (sets the HttpOnly session cookie).
      await ensureCsrf();
      const me = await api.post('/auth/login', values); // returns the user payload directly
      setAuthed(true);
      setCurrentUser(me);
      const next = searchParams.get('next');
      navigate(next ? decodeURIComponent(next) : '/catalog', { replace: true });
    } catch (e) {
      setAuthed(false);
      if (e.status === 401) {
        setAuthError('Invalid email or password');
      } else if (e.status === 429) {
        setAuthError(e.message || 'Too many login attempts. Please try again later.');
      } else {
        pushToast({ kind: 'error', message: e.message || 'Login failed. Please try again.' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-page text-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-brand-500 rounded-xl flex items-center justify-center text-white font-bold shadow-xl shadow-brand-500/30">
            <MonitorPlay size={40} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Welcome to InfraProv
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Proxmox Self-Service Provisioning Portal
        </p>
        {AUTH_BYPASS && (
          <p className="mt-3 text-center text-[12px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-md py-1.5 px-3">
            Dev login bypass active — any email/password signs you in as admin (no backend).
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
        <div className="bg-card py-8 px-4 shadow-modal sm:rounded-2xl sm:px-10 border border-gray-100 dark:border-theme">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-surface dark:text-white rounded-lg p-2.5 transition-colors"
                  placeholder="admin@infraprov.local"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-[12px] text-rose-600 dark:text-rose-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-surface dark:text-white rounded-lg p-2.5 transition-colors"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-[12px] text-rose-600 dark:text-rose-400">{errors.password.message}</p>
              )}
              {authError && (
                <p className="mt-1 text-[12px] text-rose-600 dark:text-rose-400">{authError}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-lg shadow-brand-500/30 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
