import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Cloud, Search, Plus, Edit2, CheckCircle2, Database, Layers, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import TableActionMenu from '../../../components/common/TableActionMenu';
import DataTable from '../../../components/common/DataTable';
import ProviderForm from './ProviderForm';
import ProviderDiscovery from './ProviderDiscovery';
import ProviderActionModal from './ProviderActionModal';
import NodePreview from './NodePreview';
import ErrorBoundary from './ErrorBoundary';
import { useProviderContext } from '../../../contexts/ProviderContext';
import api from '../../../lib/api';
import StatusPill from '../../../components/common/StatusPill';
import { useDebouncedValue } from '../../../lib/useDebouncedValue';
import { formatDateTime } from '../../../lib/datetime';
import { useUI } from '../../../stores/uiStore';
import { ensureMinDuration } from '../../../lib/minDuration';

export default function ProviderManagement() {
  const { providers, loading, refetch, create, update, remove } = useProviderContext();
  // All notifications use the global, always-on-top top-center toast (consistent with the
  // duplicate-data error). dismissToast clears the in-progress "loading" toast on completion.
  const pushToast = useUI((s) => s.pushToast);
  const dismissToast = useUI((s) => s.dismissToast);
  const [providerSearch, setProviderSearch] = useState('');
  const debouncedSearch = useDebouncedValue(providerSearch, 250);
  const [providerTypeFilter, setProviderTypeFilter] = useState('All Types');
  const [providerStatusFilter, setProviderStatusFilter] = useState('All Status');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  
  const [modal, setModal] = useState({ isOpen: false, mode: 'add', data: null });
  const [discoveryDrawer, setDiscoveryDrawer] = useState({ isOpen: false, provider: null });
  const [actionModal, setActionModal] = useState({ isOpen: false, action: null, provider: null, isBlocking: false });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showUnsavedWarning) {
          setShowUnsavedWarning(false);
        } else if (modal.isOpen) {
          closeModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showUnsavedWarning, modal.isOpen, hasUnsavedChanges]);

  // Auto-refresh provider list + connection status every 10s while viewing
  // (paused when the tab is hidden or a modal is open so it never disrupts editing).
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden && !modal.isOpen) refetch();
    }, 10000);
    return () => clearInterval(id);
  }, [refetch, modal.isOpen]);

  const openModal = (mode, data = null) => {
    setOpenDropdownId(null); // close any open row action menu
    setModal({ isOpen: true, mode, data });
    setHasUnsavedChanges(false);
  };

  // Close the action dropdown on any outside click (the menu portals to body).
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-dropdown-container') && !e.target.closest('.action-dropdown-portal')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeModal = (force = false) => {
    if (hasUnsavedChanges && !force) {
      setShowUnsavedWarning(true);
    } else {
      setModal({ isOpen: false, mode: 'add', data: null });
      setShowUnsavedWarning(false);
      setHasUnsavedChanges(false);
    }
  };

  const confirmCloseModal = () => {
    closeModal(true);
  };

  const handleRefreshProviders = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    const start = Date.now();
    const tid = crypto.randomUUID();
    pushToast({ id: tid, kind: 'loading', message: 'Refreshing provider data…' });
    try {
      await refetch();
      dismissToast(tid);
      pushToast({ kind: 'success', message: 'Provider data refreshed successfully.' });
    } catch (e) {
      dismissToast(tid);
      pushToast({ kind: 'error', message: e.message || 'Refresh failed.' });
    } finally {
      // Let the icon complete at least one full spin even on a cache-fast refetch.
      await ensureMinDuration(start);
      setIsRefreshing(false);
    }
  };

  const handleTestConnection = async (p) => {
    setOpenDropdownId(null);
    const tid = crypto.randomUUID();
    pushToast({ id: tid, kind: 'loading', message: `Testing connection to ${p.providerName}…` });
    try {
      const res = await api.post(`/providers/${p.id}/test-connection`);
      dismissToast(tid);
      pushToast({ kind: 'success', message: `${p.providerName}: ${res.status}${res.version ? ` (v${res.version})` : ''}` });
    } catch (e) {
      dismissToast(tid);
      pushToast({ kind: 'error', message: e.message || 'Connection test failed.' });
    }
  };

  const handleRunDiscovery = async (p) => {
    setOpenDropdownId(null);
    const tid = crypto.randomUUID();
    pushToast({ id: tid, kind: 'loading', message: `Running discovery for ${p.providerName}…` });
    try {
      const res = await api.post(`/providers/${p.id}/discover`);
      const c = res.counts || {};
      dismissToast(tid);
      pushToast({ kind: 'success', message: `Discovery complete: ${c.nodes || 0} nodes, ${c.templates || 0} templates, ${c.networks || 0} networks, ${c.datastores || 0} datastores, ${c.vms || 0} VMs.`, duration: 5000 });
      await refetch();
    } catch (e) {
      dismissToast(tid);
      pushToast({ kind: 'error', message: e.message || 'Discovery failed.' });
    }
  };

  const handleDropdownClick = (e, id) => {
    e.stopPropagation();
    if (openDropdownId === id) {
      setOpenDropdownId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + window.scrollY, right: window.innerWidth - rect.right });
      setOpenDropdownId(id);
    }
  };

  const handleDeleteClick = (provider) => {
    // Check if provider is referenced. In a real app we'd check against catalogs, networks, datastores.
    // Assuming true for blocking demo, wait no, let's keep it simple or assume false unless we have the real data.
    // For now, no blocking since we don't have catalogs/networks state here.
    // Actually we will just pass isBlocking: false for now, as refactor implies keeping UI.
    setActionModal({ isOpen: true, action: 'Delete', provider, isBlocking: false });
  };

  const confirmAction = async () => {
    if (actionModal.action === 'Delete') {
      try {
        await remove(actionModal.provider.id);
        pushToast({ kind: 'success', message: 'Provider deleted.' });
      } catch (e) {
        pushToast({ kind: 'error', message: e.message || 'Delete failed.' });
      }
    }
    setActionModal({ isOpen: false, action: null, provider: null, isBlocking: false });
  };

  const handleFormSubmit = async (data) => {
    try {
      if (modal.mode === 'add') {
        await create(data);
        pushToast({ kind: 'success', message: 'Provider created.' });
      } else {
        await update(modal.data.id, data);
        pushToast({ kind: 'success', message: 'Provider updated.' });
      }
      closeModal(true);
    } catch (e) {
      pushToast({ kind: 'error', message: e.message || 'Save failed.' });
    }
  };

  const activeTab = 'Provider Management';
  const isLoading = false;

  // A disconnected provider contributes no usable resources — the aggregate widgets (Templates /
  // Networks / Datastores) count connected providers only, matching what can actually be provisioned.
  const connectedProviders = providers.filter((p) => p.status === 'Connected');

  // Filtered list (DataTable sorts + paginates internally).
  const filteredProviders = useMemo(() => {
    return providers.filter(p =>
      (providerTypeFilter === 'All Types' || p.providerType === providerTypeFilter) &&
      (providerStatusFilter === 'All Status' || p.status === providerStatusFilter) &&
      ((p.providerName || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
       (p.endpoint || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
       (p.providerType || '').toLowerCase().includes(debouncedSearch.toLowerCase()))
    );
  }, [providers, providerTypeFilter, providerStatusFilter, debouncedSearch]);

  // Column defs for the shared <DataTable>: `weight` = fit-mode share of the width, `render` = cell.
  const providerColumns = [
    { key: 'name', header: 'Provider Name', weight: 2.2, sortable: true, sortAccessor: p => (p.providerName || '').toLowerCase(),
      headerClassName: 'px-5 py-3', cellClassName: 'px-5 py-3',
      render: p => <div className="text-[13px] font-bold text-gray-800 dark:text-gray-200">{p.providerName}</div> },
    { key: 'type', header: 'Type', weight: 1.0,
      render: p => <span className="text-[13px] text-gray-600 dark:text-gray-400 capitalize">{p.providerType}</span> },
    { key: 'endpoint', header: 'Endpoint', weight: 2.4,
      render: p => <span className="text-[13px] text-gray-600 dark:text-gray-400">{p.endpoint}</span> },
    { key: 'nodes', header: 'Nodes', weight: 0.8,
      render: p => <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">{p.nodesCount ?? '—'}</span> },
    { key: 'templates', header: 'Templates', weight: 1.0, sortable: true, sortAccessor: p => p.templatesCount ?? -1,
      render: p => <span className="text-[13px] font-bold text-blue-600 dark:text-blue-400">{p.templatesCount ?? '—'}</span> },
    { key: 'networks', header: 'Networks', weight: 1.0, sortable: true, sortAccessor: p => p.networksCount ?? -1,
      render: p => <span className="text-[13px] font-bold text-purple-600 dark:text-purple-400">{p.networksCount ?? '—'}</span> },
    { key: 'datastores', header: 'Datastores', weight: 1.0, sortable: true, sortAccessor: p => p.datastoresCount ?? -1,
      render: p => <span className="text-[13px] font-bold text-amber-500 dark:text-amber-400">{p.datastoresCount ?? '—'}</span> },
    { key: 'connection', header: 'Connection', weight: 1.2,
      render: p => <StatusPill status={p.status} label={p.status} variant="soft" shape="full" size="sm" weight="font-medium" pad="px-2 py-0.5" /> },
    { key: 'discovery', header: 'Discovery', weight: 1.2,
      render: p => (
        <StatusPill
          tone={p.discoveryStatus === 'success' ? 'info' : p.discoveryStatus === 'failed' ? 'danger' : p.discoveryStatus === 'running' ? 'warning' : 'neutral'}
          label={(p.discoveryStatus || 'never run').replace(/_/g, ' ')}
          variant="soft" shape="full" size="sm" weight="font-medium" pad="px-2 py-0.5" className="capitalize"
        />
      ) },
    { key: 'lastDiscovery', header: 'Last Discovery', weight: 1.7, cellClassName: 'px-4 py-3 text-[12px]', sortable: true, sortAccessor: p => p.lastDiscoveryAt || '',
      render: p => (
        <>
          <div className="text-gray-800 dark:text-gray-200 font-medium">{formatDateTime(p.lastDiscoveryAt) || 'Never'}</div>
          {p.lastDiscoveryAt && <div className="text-gray-400 dark:text-gray-500 mt-0.5">{p.nextDiscoveryAt ? `Next: ${formatDateTime(p.nextDiscoveryAt)}` : 'Manual'}</div>}
        </>
      ) },
    { key: 'syncMode', header: 'Sync Mode', weight: 1.2, cellClassName: 'px-4 py-3 text-[12px]',
      render: p => (
        <>
          <div className="text-gray-800 dark:text-gray-200 font-medium">{p.autoDiscoveryEnabled ? (p.discoveryInterval || '—') : 'Manual'}</div>
          <div className="text-gray-400 dark:text-gray-500 mt-0.5">{p.autoDiscoveryEnabled ? 'Auto Sync' : 'Manual Only'}</div>
        </>
      ) },
    { key: 'action', header: 'Action', weight: 0.8, align: 'center', resizable: false, headerClassName: 'px-5 py-3', cellClassName: 'px-5 py-3',
      render: p => (
        <TableActionMenu isOpen={openDropdownId === p.id} onToggle={(e) => handleDropdownClick(e, p.id)} dropdownPos={dropdownPos}>
          <button onClick={() => { setOpenDropdownId(null); openModal('edit', p); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200">
            <Edit2 size={14}/> Edit Provider
          </button>
          <button onClick={() => handleTestConnection(p)} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-700 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={14}/> Test Discovery Connection
          </button>
          <button onClick={() => handleRunDiscovery(p)} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-700 text-purple-600 dark:text-purple-400">
            <Database size={14}/> Run Discovery Now
          </button>
          <div className="h-px bg-slate-100 dark:bg-zinc-700 my-1"></div>
          <button onClick={() => { setOpenDropdownId(null); setDiscoveryDrawer({ isOpen: true, provider: p }); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-700 text-blue-600 dark:text-blue-400">
            <Layers size={14} /> Discovery Explorer
          </button>
          <div className="h-px bg-slate-100 dark:bg-zinc-700 my-1"></div>
          <button onClick={() => { setOpenDropdownId(null); handleDeleteClick(p); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Trash2 size={14}/> Delete Provider
          </button>
        </TableActionMenu>
      ) },
  ];

  return (
    <>
          {/* Provider Management */}
          {!isLoading && activeTab === 'Provider Management' && (
            <div key={activeTab} className="flex flex-col gap-6 h-full animate-in slide-in-from-right-8 fade-in duration-300 fill-mode-both items-start w-full">
              
              {/* Stats Row */}
              <div className="shrink-0 w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card p-4 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Provider Management Statistics</h1>
                    <p className="text-[13px] text-slate-500 dark:text-zinc-400 mt-1">Overview of registered infrastructure providers and connection states.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                      <div className="text-2xl font-bold text-slate-800 dark:text-zinc-200">{providers.length}</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Providers</div>
                    </div>
                    <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{connectedProviders.length}</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Connected</div>
                    </div>
                    <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{providers.filter(p => p.discoveryStatus === 'success').length}</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Discovery Success</div>
                    </div>
                    <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{connectedProviders.reduce((acc, p) => acc + (p.templatesCount || 0), 0)}</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Templates</div>
                    </div>
                    <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{connectedProviders.reduce((acc, p) => acc + (p.networksCount || 0), 0)}</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Networks</div>
                    </div>
                    <div className="text-center pl-4">
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">{connectedProviders.reduce((acc, p) => acc + (p.datastoresCount || 0), 0)}</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Datastores</div>
                    </div>
                  </div>
                </div>

                {/* Scrollable Container for Tables Only */}
                <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col gap-6 pr-1 pb-1">
                  {/* Provider Overview Table */}
                  <div className="flex flex-col w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card shadow-card min-h-0">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex items-center justify-between shrink-0">
                    <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100">Provider Overview</h3>
                    <div className="flex items-center gap-2 relative">
                      <button 
                        onClick={handleRefreshProviders}
                        disabled={isRefreshing}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-md disabled:opacity-50"
                        title="Refresh"
                      >
                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                      </button>
                      <button 
                        onClick={() => openModal('add', null)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
                      >
                        <Plus size={14} /> Add Provider
                      </button>
                    </div>
                  </div>
                  
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex items-center gap-3 shrink-0">
                    <div className="relative w-[300px]">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search Provider..." 
                        value={providerSearch}
                        onChange={e => setProviderSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-surface border border-gray-200 dark:border-theme rounded-lg text-[13px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:text-gray-100"
                      />
                    </div>
                    <select 
                      value={providerTypeFilter}
                      onChange={e => setProviderTypeFilter(e.target.value)}
                      className="bg-white dark:bg-surface border border-gray-200 dark:border-theme text-gray-700 dark:text-gray-200 text-[13px] font-medium rounded-lg px-3 py-2 outline-none cursor-pointer min-w-[140px]"
                    >
                      <option value="All Types">All Types</option>
                      <option value="proxmox">Proxmox</option>
                      <option value="openstack">OpenStack</option>
                      <option value="olvm">OLVM</option>
                    </select>
                    <select 
                      value={providerStatusFilter}
                      onChange={e => setProviderStatusFilter(e.target.value)}
                      className="bg-white dark:bg-surface border border-gray-200 dark:border-theme text-gray-700 dark:text-gray-200 text-[13px] font-medium rounded-lg px-3 py-2 outline-none cursor-pointer min-w-[140px]"
                    >
                      <option value="All Status">All Status</option>
                      <option value="Connected">Connected</option>
                      <option value="Disconnected">Disconnected</option>
                    </select>
                  </div>
                  
                  <DataTable
                    columns={providerColumns}
                    rows={filteredProviders}
                    rowKey={p => p.id}
                    rowClassName={p => (p.status !== 'Connected' ? 'opacity-60' : '')}
                    noun="Providers"
                    loading={loading}
                    defaultSort={{ key: 'name', dir: 'asc' }}
                    emptyState={{
                      icon: Cloud,
                      title: 'No Providers Configured',
                      message: 'Register your first infrastructure provider to begin VM provisioning.',
                      action: (
                        <button onClick={() => openModal('add', null)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20">
                          <Plus size={14} /> Add Provider
                        </button>
                      ),
                    }}
                  />
                </div>

                  {/* Published Node Preview — fourth published abstraction (ADR-17), below Providers */}
                  <NodePreview />
              </div>
            </div>
          )}


      <ProviderForm 
        isOpen={modal.isOpen}
        mode={modal.mode}
        data={modal.data}
        onSubmit={handleFormSubmit}
        onClose={() => closeModal()}
        onChange={() => setHasUnsavedChanges(true)}
      />
      
      <ErrorBoundary>
        <ProviderDiscovery 
          isOpen={discoveryDrawer.isOpen}
          provider={discoveryDrawer.provider}
          onClose={() => setDiscoveryDrawer({ isOpen: false, provider: null })}
        />
      </ErrorBoundary>

      <ProviderActionModal
        isOpen={actionModal.isOpen}
        action={actionModal.action}
        provider={actionModal.provider}
        isBlocking={actionModal.isBlocking}
        onClose={() => setActionModal({ isOpen: false, action: null, provider: null, isBlocking: false })}
        onConfirm={confirmAction}
      />
      {/* Unsaved Changes Warning Modal */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-[400px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-1">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-zinc-100 leading-tight">Unsaved Changes</h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400">You have unsaved changes in the form. Are you sure you want to close it? Your changes will be lost.</p>
              <div className="flex justify-center gap-3 mt-4 w-full">
                <button onClick={() => setShowUnsavedWarning(false)} className="flex-1 px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-input transition-colors">Cancel</button>
                <button onClick={confirmCloseModal} className="flex-1 px-4 py-2 text-[13px] font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-input transition-colors shadow-sm">Discard Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
