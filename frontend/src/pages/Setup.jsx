import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Loader2 } from 'lucide-react';
import api, { ensureCsrf } from '../lib/api';
import { useUserContext } from '../contexts/UserContext';
import { useUI } from '../stores/uiStore';

// First-run installer form. Only reachable while the database has no users (see SetupGate in App.jsx).
// Roles/group/tiers are created server-side — the operator only supplies the first administrator.
const schema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255),
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Za-z]/, 'Include a letter')
      .regex(/[0-9]/, 'Include a number'),
    passwordConfirmation: z.string().min(1, 'Please confirm your password'),
  })
  .refine((v) => v.password === v.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'Passwords do not match',
  });

export default function Setup() {
  const navigate = useNavigate();
  const { setNeedsSetup } = useUserContext();
  const pushToast = useUI((s) => s.pushToast);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', passwordConfirmation: '' },
  });

  const onSubmit = async (values) => {
    setSubmitError('');
    try {
      // Prime the CSRF cookie (this is a state-changing POST), then create the first admin.
      await ensureCsrf();
      await api.post('/setup', values); // { name, email, password, passwordConfirmation → password_confirmation }
      setNeedsSetup(false); // clear the gate so /login is reachable
      pushToast({ kind: 'success', message: 'Administrator created. Please sign in.' });
      navigate('/login', { replace: true });
    } catch (e) {
      if (e.status === 409) {
        // Already installed (e.g. a second tab finished setup first) — send them to login.
        setNeedsSetup(false);
        navigate('/login', { replace: true });
      } else {
        setSubmitError(e.message || 'Setup failed. Please try again.');
      }
    }
  };

  const field =
    'focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-surface dark:text-white rounded-lg p-2.5 transition-colors';

  return (
    <div className="min-h-screen bg-page text-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-center">
          <img src="/exovirt-icon.png" alt="ExoVirt" className="h-24 w-auto" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Welcome to ExoVirt
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          First-time setup — create the administrator account to get started.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
        <div className="bg-card py-8 px-4 shadow-modal sm:rounded-2xl sm:px-10 border border-gray-100 dark:border-theme">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input id="name" type="text" autoComplete="name" {...register('name')} className={field} placeholder="Jane Admin" />
              </div>
              {errors.name && <p className="mt-1 text-[12px] text-rose-600 dark:text-rose-400">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input id="email" type="email" autoComplete="email" {...register('email')} className={field} placeholder="admin@company.com" />
              </div>
              {errors.email && <p className="mt-1 text-[12px] text-rose-600 dark:text-rose-400">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input id="password" type="password" autoComplete="new-password" {...register('password')} className={field} placeholder="At least 8 chars, 1 letter + 1 number" />
              </div>
              {errors.password && <p className="mt-1 text-[12px] text-rose-600 dark:text-rose-400">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input id="passwordConfirmation" type="password" autoComplete="new-password" {...register('passwordConfirmation')} className={field} placeholder="••••••••" />
              </div>
              {errors.passwordConfirmation && (
                <p className="mt-1 text-[12px] text-rose-600 dark:text-rose-400">{errors.passwordConfirmation.message}</p>
              )}
              {submitError && <p className="mt-1 text-[12px] text-rose-600 dark:text-rose-400">{submitError}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-lg shadow-brand-500/30 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Creating account…' : 'Create administrator'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
