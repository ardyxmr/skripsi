import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useSearchParams } from 'react-router-dom';
import { Search, Grid, Plus, Server, CheckSquare, Settings as SettingsIcon, LogOut, Bell, Moon, Sun, User as UserIcon, Shield, Users, Cloud, Network, Database, Layers, Box, FileText, ArrowLeft, Menu, CheckCircle2 } from 'lucide-react';

import Login from './pages/Login';
import Catalog from './pages/Catalog';
import Inventory from './pages/Inventory';
import VmRequest from './pages/VmRequest';
import Settings from './pages/Settings';
import Approvals from './pages/Approvals';
import NotificationCenter from './components/NotificationCenter';

import { UserProvider } from './contexts/UserContext';
import { ProviderProvider } from './contexts/ProviderContext';
import { CatalogProvider } from './contexts/CatalogContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { DatastoreProvider } from './contexts/DatastoreContext';
import { TierProvider } from './contexts/TierContext';
import { EnvironmentProvider } from './contexts/EnvironmentContext';

const MOCK_USER = {
  name: 'John Doe',
  email: 'admin@infraprov.local',
  role: 'Admin',
  initials: 'JD'
};

function Sidebar({ user, isCollapsed, toggleSidebar }) {
  const location = useLocation();
  if (location.pathname === '/login') return null;

  const links = [
    { name: 'Catalog', icon: <Grid size={15} />, path: '/catalog' },
    { name: 'Provision VM', icon: <Plus size={15} />, path: '/request-vm' },
    { name: 'Inventory', icon: <Server size={15} />, path: '/inventory' },
  ];

  if (user?.role === 'Manager' || user?.role === 'Admin') {
    links.splice(2, 0, { name: 'Approval Requests', icon: <CheckSquare size={15} />, path: '/approvals' });
  }

  if (user?.role === 'Admin') {
    links.push({ name: 'Settings', icon: <SettingsIcon size={15} />, path: '/settings' });
  }

  return (
    <aside className={`${isCollapsed ? 'w-[72px]' : 'w-[240px]'} bg-white dark:bg-card border-r border-gray-200 dark:border-theme flex flex-col shrink-0 transition-[width] duration-[250ms] ease-in-out relative z-40`}>
      <div className="absolute top-0 left-0 w-[240px] h-[61px] p-[18px_16px_14px] border-b border-gray-200 dark:border-theme flex items-center gap-2 bg-white dark:bg-card z-50">
        <div className="w-7 h-7 bg-[#185FA5] rounded-md flex items-center justify-center text-white shrink-0">
          <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v3a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm0 7a1 1 0 011-1h10a1 1 0 011 1v3a1 1 0 01-1 1H3a1 1 0 01-1-1v-3z"/></svg>
        </div>
        <div className="whitespace-nowrap">
          <div className="text-[14px] font-medium leading-tight text-gray-900 dark:text-gray-100">Infra<span className="text-[#185FA5]">Cloud</span></div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">VM Orchestration</div>
        </div>
      </div>
      
      <div className="h-[61px] shrink-0"></div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 overflow-x-hidden custom-scrollbar">
        <div className="flex items-center justify-between px-3 pb-2 pt-2 min-h-[36px]">
          <div className={`text-[11px] font-semibold text-gray-400 uppercase tracking-widest transition-all duration-[250ms] whitespace-nowrap overflow-hidden ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
            Navigation
          </div>
          <button 
            onClick={toggleSidebar} 
            className={`p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors shrink-0 ${isCollapsed ? 'mx-auto' : ''}`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <Menu size={18} />
          </button>
        </div>

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
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-gray-200 hover:translate-x-1'
                  }`}
                >
                  <span className={`${isActive ? 'text-teal-600' : 'opacity-70'} shrink-0 transition-colors`}>{link.icon}</span>
                  {!isCollapsed && (
                    <>
                      <span className="whitespace-nowrap overflow-hidden text-ellipsis">{link.name}</span>
                      {link.badge && (
                        <span className="ml-auto bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shrink-0">
                          {link.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
                {isCollapsed && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-800 dark:bg-gray-700 text-white text-[12px] font-medium px-2.5 py-1.5 rounded shadow-lg opacity-0 pointer-events-none group-hover/nav:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                    {link.name}
                    {link.badge && <span className="ml-2 bg-rose-500 px-1.5 py-0.5 rounded-full text-[9px]">{link.badge}</span>}
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

function Topbar({ user, isDarkMode, toggleDarkMode, isSidebarCollapsed }) {
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileRef]);

  if (location.pathname === '/login') return null;

  const titles = {
    '/catalog': 'VM Catalog',
    '/request-vm': 'Provision New VM',
    '/inventory': 'VM Inventory',
    '/approvals': 'Approval Requests',
    '/settings': 'Settings'
  };

  const title = titles[location.pathname] || 'Dashboard';

  return (
    <header className={`h-[61px] bg-white dark:bg-card border-b border-gray-200 dark:border-theme flex items-center justify-between px-5 shrink-0 transition-[padding] duration-[250ms] ${isSidebarCollapsed ? 'pl-[188px]' : ''}`}>
      <div className="text-[15px] font-medium text-gray-800 dark:text-gray-100">{title}</div>
      <div className="flex items-center gap-4">
        
        {/* Notification Center */}
        <NotificationCenter />

        {/* Dark Mode Switch */}
        <button 
          onClick={toggleDarkMode}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700/50"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Avatar Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-[12px] font-bold text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-transform hover:scale-105"
          >
            {user?.initials}
          </button>
          
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-card rounded-modal shadow-modal border border-gray-100 dark:border-theme py-1 z-50 animate-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-theme">
                <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <button className="w-full text-left px-4 py-2 text-[13px] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 flex items-center gap-2">
                  <UserIcon size={14} /> Profile Settings
                </button>
                <button className="w-full text-left px-4 py-2 text-[13px] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 flex items-center gap-2">
                  <SettingsIcon size={14} /> Reset Password
                </button>
              </div>
              <div className="border-t border-gray-100 dark:border-theme py-1">
                <button className="w-full text-left px-4 py-2 text-[13px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2">
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function AppLayout() {
  const location = useLocation();
  const isLogin = location.pathname === '/login';
  const currentUser = MOCK_USER;
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('mainSidebarCollapsed') === 'true';
  });

  const [globalToast, setGlobalToast] = useState('');

  useEffect(() => {
    if (location.state?.globalToast) {
      setGlobalToast(location.state.globalToast);
      
      // Clear the state from history so it doesn't reappear on refresh
      window.history.replaceState({}, document.title);

      const timer = setTimeout(() => {
        setGlobalToast('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = ''; 
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = ''; 
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('mainSidebarCollapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  if (isLogin) return <Login />;

  return (
    <div className={`flex h-screen w-full overflow-hidden text-[14px] font-sans ${isDarkMode ? 'dark text-primary bg-page' : 'text-primary bg-page'}`}>
      
      {/* Global Toast Notification */}
      {globalToast && (
        <div className="fixed top-4 left-0 right-0 flex justify-center z-[100] pointer-events-none">
          <div className="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-4 py-2 rounded-md shadow-md flex items-center gap-2 text-[13px] font-medium animate-in fade-in slide-in-from-top-4 duration-200">
            <CheckCircle2 size={16} className="text-emerald-500" />
            {globalToast}
          </div>
        </div>
      )}

      <Sidebar user={currentUser} isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col min-w-0 bg-transparent transition-all duration-[250ms]">
        <Topbar user={currentUser} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} isSidebarCollapsed={isSidebarCollapsed} />
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <Routes>
            <Route path="/" element={<Navigate to="/catalog" replace />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/request-vm" element={<VmRequest />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/approvals" element={<Approvals />} />
          </Routes>
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
                <TierProvider>
                  <EnvironmentProvider>
                    <AppLayout />
                  </EnvironmentProvider>
                </TierProvider>
              </DatastoreProvider>
            </NetworkProvider>
          </CatalogProvider>
        </ProviderProvider>
      </UserProvider>
    </BrowserRouter>
  );
}
