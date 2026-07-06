import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Grid, Plus, Server, CheckSquare, Settings as SettingsIcon, LogOut, Moon, Sun, Menu, KeyRound } from 'lucide-react';

import Login from './pages/Login'; // eager — the unauthenticated entry point stays instant

// Authenticated pages are code-split: each loads its own chunk on first visit, so the initial
// bundle (and login → first paint) is far smaller. The <Suspense> around the Outlet shows a loader.
const Catalog = lazy(() => import('./pages/Catalog'));
const Inventory = lazy(() => import('./pages/Inventory'));
const VmRequest = lazy(() => import('./pages/VmRequest'));
const Settings = lazy(() => import('./pages/Settings'));
const Approvals = lazy(() => import('./pages/Approvals'));
const NotFound = lazy(() => import('./pages/NotFound'));
import NotificationCenter from './components/NotificationCenter';
import LiveDataPoller from './components/LiveDataPoller';
import IdleTimeout from './components/IdleTimeout';
import ResetPasswordModal from './components/ResetPasswordModal';
import DataBootstrap from './components/DataBootstrap';
import Toast from './components/Toast';
import RequireAuth from './components/RequireAuth';
import RequireRole from './components/RequireRole';

import { UserProvider, useUserContext } from './contexts/UserContext';
import { ProviderProvider } from './contexts/ProviderContext';
import { CatalogProvider } from './contexts/CatalogContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { DatastoreProvider } from './contexts/DatastoreContext';
import { NodeProvider } from './contexts/NodeContext';
import { TierProvider } from './contexts/TierContext';
import { EnvironmentProvider } from './contexts/EnvironmentContext';

import { useUI } from './stores/uiStore';
import { ROLES, canManageSettings } from './lib/rbac';
import api from './lib/api';
import { setAuthed } from './lib/auth';
import { prefetchLiveData, clearLiveCache } from './lib/liveCache';

// Shown while a lazy route chunk loads (sidebar/topbar stay; only the content area swaps).
function PageFallback() {
  return (
    <div className="flex items-center justify-center py-24 text-gray-400 dark:text-gray-500">
      <div className="w-6 h-6 border-2 border-gray-300 dark:border-zinc-600 border-t-teal-500 rounded-full animate-spin" />
    </div>
  );
}

function initialsOf(user) {
  if (!user?.name) return '?';
  return user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function Sidebar({ user }) {
  const isCollapsed = useUI((s) => s.sidebarCollapsed);
  const toggleSidebar = useUI((s) => s.toggleSidebar);
  const location = useLocation();

  // Same "Approval Requests" menu for everyone — the page scopes its rows by role
  // (Managers/Admins see all + can act; a user sees only their own requests).
  const links = [
    { name: 'Catalog', icon: <Grid size={15} />, path: '/catalog' },
    { name: 'Provision VM', icon: <Plus size={15} />, path: '/request-vm' },
    { name: 'Approval Requests', icon: <CheckSquare size={15} />, path: '/approvals' },
    { name: 'Inventory', icon: <Server size={15} />, path: '/inventory' },
  ];

  if (canManageSettings(user)) {
    links.push({ name: 'Settings', icon: <SettingsIcon size={15} />, path: '/settings' });
  }

  return (
    <aside className={`${isCollapsed ? 'w-[72px]' : 'w-[240px]'} shrink-0 h-full flex flex-col bg-white dark:bg-card border border-gray-200 dark:border-zinc-700/70 rounded-card shadow-card overflow-hidden transition-[width] duration-[250ms] ease-in-out relative z-40`}>
      <div className="p-4 border-b border-gray-100 dark:border-theme flex items-center justify-between min-h-[53px]">
        <h2 className={`text-[15px] font-bold text-gray-800 dark:text-gray-100 transition-all duration-[250ms] whitespace-nowrap overflow-hidden ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>Navigation</h2>
        <button
          onClick={toggleSidebar}
          className={`p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700/50 transition-colors shrink-0 ${isCollapsed ? 'mx-auto' : ''}`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <Menu size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 overflow-x-hidden custom-scrollbar">
        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = location.pathname === link.path || (link.path === '/catalog' && location.pathname === '/');
            return (
              <div key={link.name} className="relative group/nav">
                <Link
                  to={link.path}
                  className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-[14px] font-medium transition-all duration-[250ms] ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500/10 to-emerald-500/10 text-teal-700 dark:text-teal-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-zinc-700 hover:text-gray-900 dark:hover:text-gray-200 hover:translate-x-1'
                  }`}
                >
                  <span className={`${isActive ? 'text-teal-600' : 'opacity-70'} shrink-0 transition-colors`}>{link.icon}</span>
                  {!isCollapsed && (
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">{link.name}</span>
                  )}
                </Link>
                {isCollapsed && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-800 dark:bg-gray-700 text-white text-[12px] font-medium px-2.5 py-1.5 rounded shadow-lg opacity-0 pointer-events-none group-hover/nav:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                    {link.name}
                    <div className="absolute top-1/2 -translate-y-1/2 -left-1 border-[4px] border-transparent border-r-gray-800 dark:border-r-gray-700"></div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

function Topbar({ user, onLogout }) {
  const isDarkMode = useUI((s) => s.darkMode);
  const toggleDarkMode = useUI((s) => s.toggleDarkMode);
  const [profileOpen, setProfileOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileRef]);

  // Each control is a floating circle; a thin "pipe" behind them (visible in the gaps) links the three.
  const circle = 'relative z-10 w-10 h-10 rounded-full bg-white dark:bg-card border border-gray-200 dark:border-zinc-700/70 shadow-sm flex items-center justify-center transition-colors';

  return (
    <div className="relative flex items-center gap-3">
      <div className="absolute left-5 right-5 top-1/2 -translate-y-1/2 h-[7px] rounded-full bg-white dark:bg-card border border-gray-200 dark:border-zinc-700/70" aria-hidden="true"></div>

      <div className={`${circle} text-gray-500 dark:text-gray-400`}>
        <NotificationCenter />
      </div>

      <button
        onClick={toggleDarkMode}
        aria-label="Toggle dark mode"
        className={`${circle} text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700/50`}
      >
        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="relative z-10" ref={profileRef}>
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-[12px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-card focus:outline-none focus:ring-teal-500/50 transition-transform hover:scale-105"
        >
          {initialsOf(user)}
        </button>

        {profileOpen && (
          <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-card rounded-modal shadow-modal border border-gray-100 dark:border-theme py-1 z-[100] animate-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-theme">
              <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
            </div>
            <div className="py-1">
              <button
                onClick={() => { setProfileOpen(false); setResetOpen(true); }}
                className="w-full text-left px-4 py-2 text-[13px] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700/50 flex items-center gap-2"
              >
                <KeyRound size={14} /> Reset Password
              </button>
            </div>
            <div className="border-t border-gray-100 dark:border-theme py-1">
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-2 text-[13px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        )}
      </div>

      <ResetPasswordModal open={resetOpen} user={user} onClose={() => setResetOpen(false)} />
    </div>
  );
}

function ProtectedLayout() {
  const { currentUser, setCurrentUser } = useUserContext();
  const isDarkMode = useUI((s) => s.darkMode);
  const navigate = useNavigate();

  // Warm the live-data cache once on entering the authed area so Inventory /
  // Approvals open instantly (their own fetch + polling keep the data fresh).
  useEffect(() => {
    prefetchLiveData();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore network errors on logout */
    }
    setAuthed(false);
    clearLiveCache();
    setCurrentUser(null);
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden text-[14px] font-sans text-primary bg-page">
      {/* Single app-wide live driver: WebSocket (Reverb) + adaptive poll fallback; Inventory/
          Approvals/bell consume LIVE_CACHE_EVENT. */}
      <LiveDataPoller />
      <IdleTimeout onLogout={handleLogout} />

      {/* No header bar — the brand floats top-left and the controls float top-right, both on the background. */}
      <div className="h-[68px] shrink-0 flex items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#185FA5] rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm shadow-blue-500/30">
            <svg viewBox="0 0 16 16" className="w-5 h-5 fill-current"><path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v3a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm0 7a1 1 0 011-1h10a1 1 0 011 1v3a1 1 0 01-1 1H3a1 1 0 01-1-1v-3z"/></svg>
          </div>
          <div className="whitespace-nowrap leading-tight">
            <div className="text-[15px] font-medium text-gray-900 dark:text-gray-100">Infra<span className="text-[#185FA5]">Cloud</span></div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">VM Orchestration</div>
          </div>
        </div>
        <Topbar user={currentUser} onLogout={handleLogout} />
      </div>

      {/* Body row: floating sidebar + content. Both start below the strip, so the sidebar top
          lines up with the Settings sub-navigation. */}
      <div className="flex-1 min-h-0 flex gap-6 px-6 pb-6">
        <Sidebar user={currentUser} />
        <main className="flex-1 min-w-0 overflow-y-auto scroll-smooth">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <ProviderProvider>
          <CatalogProvider>
            <NetworkProvider>
              <DatastoreProvider>
                <NodeProvider>
                <TierProvider>
                  <EnvironmentProvider>
                    <DataBootstrap />
                    <Toast />
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route element={<RequireAuth />}>
                        <Route element={<ProtectedLayout />}>
                          <Route path="/" element={<Navigate to="/catalog" replace />} />
                          <Route path="/catalog" element={<Catalog />} />
                          <Route path="/request-vm" element={<VmRequest />} />
                          <Route path="/inventory" element={<Inventory />} />
                          <Route path="/approvals" element={<Approvals />} />
                          <Route element={<RequireRole roles={[ROLES.ADMIN]} />}>
                            <Route path="/settings" element={<Settings />} />
                          </Route>
                          <Route path="*" element={<NotFound />} />
                        </Route>
                      </Route>
                    </Routes>
                  </EnvironmentProvider>
                </TierProvider>
                </NodeProvider>
              </DatastoreProvider>
            </NetworkProvider>
          </CatalogProvider>
        </ProviderProvider>
      </UserProvider>
    </BrowserRouter>
  );
}
