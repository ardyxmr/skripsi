import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Catalog() {
  const navigate = useNavigate();

  const catalogs = [
    { id: 'ubuntu-22.04', os: 'Ubuntu 22.04 LTS', desc: 'Stable server release, widely used for web hosting.', icon: '🐧', color: '#E6F1FB' },
    { id: 'centos-9', os: 'CentOS Stream 9', desc: 'Community enterprise OS, RHEL-compatible.', icon: '🔵', color: '#EEEDFE' },
    { id: 'debian-12', os: 'Debian 12', desc: 'Stable, secure, widely supported distribution.', icon: '🌀', color: '#E1F5EE' },
    { id: 'rocky-9', os: 'Rocky Linux 9', desc: 'Enterprise Linux, binary compatible with RHEL 9.', icon: '🪨', color: '#FAEEDA' },
    { id: 'win-2022', os: 'Windows Server 2022', desc: 'Microsoft server OS with full GUI and AD.', icon: '🪟', color: '#F1EFE8' },
    { id: 'alma-9', os: 'AlmaLinux 9', desc: 'RHEL-compatible community OS by CloudLinux.', icon: '⭐', color: '#FAECE7' },
  ];

  const isLoading = false; // Mock loading state

  const handleSelect = (catalogId, tierId) => {
    navigate('/request-vm', { state: { catalogId, tierId } });
  };

  return (
    <div className="animate-in fade-in duration-300">

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Catalog Card */}
        <div className="bg-white dark:bg-card rounded-card p-5 border border-gray-100 dark:border-theme shadow-card transition-[transform,box-shadow] hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            </div>
            <div className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Catalog</div>
          </div>
          <div className="text-[28px] font-bold text-gray-800 dark:text-gray-100">6</div>
          <div className="text-[12px] text-teal-600 dark:text-teal-400 font-medium mt-1">Available Catalogs</div>
        </div>
        
        {/* My VMs Card */}
        <div 
          onClick={() => navigate('/inventory')}
          className="bg-white dark:bg-card rounded-card p-5 border border-gray-100 dark:border-theme shadow-card cursor-pointer transition-[transform,box-shadow] hover:shadow-md hover:-translate-y-1"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
            </div>
            <div className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">My VMs</div>
          </div>
          <div className="text-[28px] font-bold text-gray-800 dark:text-gray-100">4</div>
          <div className="text-[12px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">2 Running</div>
        </div>
        
        {/* Providers Card */}
        <div className="bg-white dark:bg-card rounded-card p-5 border border-gray-100 dark:border-theme shadow-card transition-[transform,box-shadow] hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
            </div>
            <div className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Providers</div>
          </div>
          <div className="text-[28px] font-bold text-gray-800 dark:text-gray-100">2</div>
          <div className="text-[12px] text-blue-600 dark:text-blue-400 font-medium mt-1">Available for Provisioning</div>
        </div>
        
        {/* Requests Card */}
        <div 
          onClick={() => navigate('/approvals')}
          className="bg-white dark:bg-card rounded-card p-5 border border-gray-100 dark:border-theme shadow-card cursor-pointer transition-[transform,box-shadow] hover:shadow-md hover:-translate-y-1"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <div className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Requests</div>
          </div>
          <div className="text-[28px] font-bold text-gray-800 dark:text-gray-100">12</div>
          <div className="text-[12px] text-amber-600 dark:text-amber-400 font-medium mt-1">1 Pending</div>
        </div>
      </div>

      {/* Catalog Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[16px] font-bold text-gray-800 dark:text-gray-100">VM Templates</div>
          <span className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">Select a template to provision</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-card border border-gray-100 dark:border-theme rounded-card p-5 h-48 animate-pulse">
                <div className="w-14 h-14 bg-gray-200 dark:bg-surface rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-surface rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-surface rounded w-3/4 mb-6"></div>
                <div className="h-10 bg-gray-200 dark:bg-surface rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : catalogs.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-card p-10 flex flex-col items-center justify-center border border-dashed border-gray-300 dark:border-theme text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-surface rounded-full flex items-center justify-center text-gray-400 mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            </div>
            <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 mb-1">No VM Templates Available</h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400">Please contact Administrator to assign templates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {catalogs.map((cat) => (
              <div
                key={cat.id}
                className="group bg-white dark:bg-card border border-gray-100 dark:border-theme rounded-card p-5 shadow-card cursor-pointer transition-[transform,box-shadow] duration-200 hover:shadow-xl hover:shadow-teal-500/10 hover:scale-[1.02] hover:border-teal-200 dark:hover:border-teal-700"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-4 shadow-inner transition-transform group-hover:scale-110"
                  style={{ backgroundColor: cat.color }}
                >
                  {cat.icon}
                </div>
                <div className="text-[15px] font-bold text-gray-800 dark:text-gray-100 mb-1.5">{cat.os}</div>
                <div className="text-[12px] text-gray-500 dark:text-gray-400 mb-4 leading-relaxed h-[36px] overflow-hidden">{cat.desc}</div>

                <div className="relative">
                  <select
                    className="w-full pl-3 pr-8 py-2.5 text-[12px] font-medium border border-gray-200 dark:border-theme rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-gray-50 dark:bg-surface dark:text-gray-100 appearance-none cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      if (e.target.value) handleSelect(cat.id, e.target.value);
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Select Compute Tier</option>
                    <option value="bronze">Bronze — 1 vCPU / 1 GB RAM</option>
                    <option value="silver">Silver — 2 vCPU / 2 GB RAM</option>
                    <option value="gold">Gold — 3 vCPU / 3 GB RAM</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
