import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Boxes, Database, FileText } from 'lucide-react';
import api from '../lib/api';
import { useCatalogContext } from '../contexts/CatalogContext';
import { useTierContext } from '../contexts/TierContext';
import { useProviderContext } from '../contexts/ProviderContext';

export default function Catalog() {
  const navigate = useNavigate();
  const { catalogs, loading } = useCatalogContext();
  const { tiers } = useTierContext();
  const { providers } = useProviderContext();
  // Data freshness on login is handled centrally by <DataBootstrap/> (refetches every context when
  // the user authenticates), so no per-page refetch is needed here.

  // Lightweight dashboard counts (read-only) for the stat cards.
  const [counts, setCounts] = useState({ vms: 0, running: 0, pending: 0 });
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [inv, appr] = await Promise.all([
          api.get('/inventory').catch(() => []),
          api.get('/approvals').catch(() => []),
        ]);
        if (!active) return;
        const live = (inv || []).filter((v) => v.status !== 'Deleted');
        setCounts({
          vms: live.length,
          running: live.filter((v) => (v.observedPowerState ?? v.status) === 'running' || v.status === 'Active').length,
          pending: (appr || []).filter((a) => a.status === 'Pending').length,
        });
      } catch { /* dashboard counts are best-effort */ }
    })();
    return () => { active = false; };
  }, []);

  // Only catalogs that are actually usable for provisioning.
  const usable = (catalogs || []).filter((c) => c.status === 'Active');

  const handleSelect = (catalogId, tierId) => {
    if (catalogId && tierId) navigate('/request-vm', { state: { catalogId, tierId } });
  };

  return (
    <div className="animate-in fade-in duration-300">

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-card rounded-card p-5 border border-gray-100 dark:border-theme shadow-card transition-[transform,box-shadow] hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400"><Boxes size={16} /></div>
            <div className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Catalog</div>
          </div>
          <div className="text-[28px] font-bold text-gray-800 dark:text-gray-100">{usable.length}</div>
          <div className="text-[12px] text-teal-600 dark:text-teal-400 font-medium mt-1">Available Catalogs</div>
        </div>

        <div onClick={() => navigate('/inventory')} className="bg-white dark:bg-card rounded-card p-5 border border-gray-100 dark:border-theme shadow-card cursor-pointer transition-[transform,box-shadow] hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400"><Server size={16} /></div>
            <div className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">My VMs</div>
          </div>
          <div className="text-[28px] font-bold text-gray-800 dark:text-gray-100">{counts.vms}</div>
          <div className="text-[12px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">{counts.running} Running</div>
        </div>

        <div className="bg-white dark:bg-card rounded-card p-5 border border-gray-100 dark:border-theme shadow-card transition-[transform,box-shadow] hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400"><Database size={16} /></div>
            <div className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Providers</div>
          </div>
          <div className="text-[28px] font-bold text-gray-800 dark:text-gray-100">{(providers || []).length}</div>
          <div className="text-[12px] text-blue-600 dark:text-blue-400 font-medium mt-1">Available for Provisioning</div>
        </div>

        <div onClick={() => navigate('/approvals')} className="bg-white dark:bg-card rounded-card p-5 border border-gray-100 dark:border-theme shadow-card cursor-pointer transition-[transform,box-shadow] hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400"><FileText size={16} /></div>
            <div className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Requests</div>
          </div>
          <div className="text-[28px] font-bold text-gray-800 dark:text-gray-100">{counts.pending}</div>
          <div className="text-[12px] text-amber-600 dark:text-amber-400 font-medium mt-1">Pending approval</div>
        </div>
      </div>

      {/* Catalog Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[16px] font-bold text-gray-800 dark:text-gray-100">VM Templates</div>
          <span className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">Select a template to provision</span>
        </div>

        {loading && catalogs.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-card border border-gray-100 dark:border-theme rounded-card p-5 h-48 animate-pulse">
                <div className="w-20 h-20 bg-gray-200 dark:bg-surface rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-surface rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-surface rounded w-3/4 mb-6"></div>
                <div className="h-10 bg-gray-200 dark:bg-surface rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : usable.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-card p-10 flex flex-col items-center justify-center border border-dashed border-gray-300 dark:border-theme text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-surface rounded-full flex items-center justify-center text-gray-400 mb-4"><Boxes size={24} /></div>
            <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 mb-1">No VM Templates Available</h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400">Publish a catalog in Settings → Catalog (or ask an Administrator).</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {usable.map((cat) => (
              <div
                key={cat.id}
                className="group bg-white dark:bg-card border border-gray-100 dark:border-theme rounded-card p-5 shadow-card text-center transition-[transform,box-shadow] duration-200 hover:shadow-xl hover:shadow-teal-500/10 hover:scale-[1.02] hover:border-teal-200 dark:hover:border-teal-700"
              >
                <div className="w-20 h-20 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-inner bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 overflow-hidden transition-transform group-hover:scale-110">
                  {cat.catalogImage
                    ? <img
                        src={cat.catalogImage}
                        alt=""
                        decoding="async"
                        className="w-full h-full object-contain opacity-0 transition-opacity duration-200"
                        ref={(el) => { if (el && el.complete) el.style.opacity = '1'; }}
                        onLoad={(e) => { e.currentTarget.style.opacity = '1'; }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    : <Server size={38} />}
                </div>
                <div className="text-[15px] font-bold text-gray-800 dark:text-gray-100 mb-1.5">{cat.name}</div>
                <div className="text-[12px] text-gray-500 dark:text-gray-400 mb-4 leading-relaxed h-[36px] overflow-hidden">
                  {cat.description || <span className="italic text-gray-400">No description</span>}
                </div>

                <div className="relative text-left">
                  <select
                    className="w-full pl-3 pr-8 py-2.5 text-[12px] font-medium border border-gray-200 dark:border-theme rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-gray-50 dark:bg-surface dark:text-gray-100 appearance-none cursor-pointer"
                    onChange={(e) => { if (e.target.value) handleSelect(cat.id, e.target.value); }}
                    defaultValue=""
                  >
                    <option value="" disabled>Select Compute Tier</option>
                    {(tiers || []).map((t) => (
                      <option key={t.id} value={t.id}>{t.name} — {t.cpu} vCPU / {t.ram} GB RAM</option>
                    ))}
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
