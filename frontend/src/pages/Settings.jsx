import UserManagement from '../modules/settings/user/UserManagement';
import React, { useState, useEffect } from 'react';
import { Shield, Users, Grid, Cloud, Network, Database, Layers, Box, FileText, Loader2, Menu } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import DatastoreManagement from '../modules/settings/datastore/DatastoreManagement';
import NetworkManagement from '../modules/settings/network/NetworkManagement';
import ProviderManagement from '../modules/settings/provider/ProviderManagement';
import CatalogManagement from '../modules/settings/catalog/CatalogManagement';
import EnvironmentManagement from '../modules/settings/environment/EnvironmentManagement';
import TierManagement from '../modules/settings/tier/TierManagement';
import AuditManagement from '../modules/settings/audit/AuditManagement';




const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar:hover::-webkit-scrollbar-track {
    background: #E5E7EB;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #3B82F6;
  }
`;

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'User Management';

  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(() => {
    return localStorage.getItem('settingsSidebarCollapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('settingsSidebarCollapsed', isSettingsCollapsed);
  }, [isSettingsCollapsed]);

  const [isLoading, setIsLoading] = useState(false);
  
  
  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="flex h-full w-full gap-4">
        
        {/* Left Sidebar */}
        <div className={`${isSettingsCollapsed ? 'w-[72px]' : 'w-[240px]'} shrink-0 h-full flex flex-col bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card shadow-card overflow-hidden transition-[width] duration-[250ms] ease-in-out relative z-30`}>
          <div className="p-4 border-b border-gray-100 dark:border-theme flex items-center justify-between min-h-[53px]">
            <h2 className={`text-[15px] font-bold text-gray-800 dark:text-gray-100 transition-all duration-[250ms] whitespace-nowrap overflow-hidden ${isSettingsCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>Settings</h2>
            <button 
              onClick={() => setIsSettingsCollapsed(!isSettingsCollapsed)}
              className={`p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-theme transition-colors shrink-0 ${isSettingsCollapsed ? 'mx-auto' : ''}`}
              title={isSettingsCollapsed ? 'Expand Settings' : 'Collapse Settings'}
            >
              <Menu size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar overflow-x-hidden">
            {[
              { id: 'User Management', icon: Users },
              { id: 'Provider Management', icon: Cloud },
              { id: 'Catalog Management', icon: Grid },
              { id: 'Network Management', icon: Network },
              { id: 'Datastore Management', icon: Database },
              { id: 'Tier Management', icon: Layers },
              { id: 'Environment Management', icon: Box },
              { id: 'Audit', icon: FileText }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div key={item.id} className="relative group/setnav">
                  <button
                    onClick={() => {
                      setSearchParams({ tab: item.id });
                    }}
                    className={`w-full flex items-center ${isSettingsCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-lg text-[13px] font-medium transition-all duration-[250ms] ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-500/10 to-emerald-500/10 text-teal-700 dark:text-teal-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <Icon size={16} className={`${isActive ? 'text-teal-600 dark:text-teal-400' : 'opacity-70'} shrink-0 transition-colors`} />
                    {!isSettingsCollapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.id}</span>}
                  </button>
                  {isSettingsCollapsed && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-800 dark:bg-gray-700 text-white text-[12px] font-medium px-2.5 py-1.5 rounded shadow-lg opacity-0 pointer-events-none group-hover/setnav:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                      {item.id}
                      <div className="absolute top-1/2 -translate-y-1/2 -left-1 border-[4px] border-transparent border-r-gray-800 dark:border-r-gray-700"></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          
          {/* Default Empty State */}
          {!activeTab && !isLoading && (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500 animate-in fade-in duration-500">
              <Shield size={48} className="mb-4 opacity-20" />
              <p>Please select a menu from the left panel.</p>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && activeTab && (
            <div className="w-full h-full flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 rounded-card animate-in fade-in duration-200 border border-gray-200 dark:border-theme shadow-card">
               <div className="flex flex-col items-center gap-3 text-blue-600 dark:text-blue-400">
                 <Loader2 size={32} className="animate-spin" />
                 <span className="text-sm font-medium">Loading {activeTab}...</span>
               </div>
            </div>
          )}

          {/* Actual Content */}
          {!isLoading && activeTab === 'User Management' && (
            <UserManagement />
          )}

          {/* Provider Management */}
          {!isLoading && activeTab === 'Provider Management' && (
            <ProviderManagement />
          )}

          {/* Catalog Management */}
          {!isLoading && activeTab === 'Catalog Management' && (
            <CatalogManagement />
          )}

          {/* Network Management */}
          {!isLoading && activeTab === 'Network Management' && (
            <NetworkManagement />
          )}

          {/* Datastore Management */}
          {!isLoading && activeTab === 'Datastore Management' && (
            <DatastoreManagement />
          )}

          {/* Environment Management */}
          {!isLoading && activeTab === 'Environment Management' && (
            <EnvironmentManagement />
          )}

          {/* Tier Management */}
          {!isLoading && activeTab === 'Tier Management' && (
            <TierManagement />
          )}

          {/* Audit Management */}
          {!isLoading && activeTab === 'Audit' && (
            <AuditManagement />
          )}

          {/* Fallback for other tabs */}
          {!isLoading && activeTab && activeTab !== 'User Management' && activeTab !== 'Provider Management' && activeTab !== 'Catalog Management' && activeTab !== 'Network Management' && activeTab !== 'Datastore Management' && activeTab !== 'Environment Management' && activeTab !== 'Tier Management' && activeTab !== 'Audit' && (
            <div key={activeTab} className="flex flex-col gap-6 h-full animate-in slide-in-from-right-8 fade-in duration-300 fill-mode-both items-start w-full">
              <div className="shrink-0 w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card p-4 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h1 className="text-lg font-bold text-slate-800 dark:text-zinc-100">{activeTab}</h1>
                  <p className="text-[13px] text-slate-500 dark:text-zinc-400 mt-1">Configuration panel coming soon.</p>
                </div>
              </div>
              <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col gap-6 pr-1 pb-1">
                <div className="bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card shadow-card flex items-center justify-center p-20 text-slate-500 dark:text-zinc-400 text-sm shrink-0">
                  {activeTab} configuration panel coming soon.
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
