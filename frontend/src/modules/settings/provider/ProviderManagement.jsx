import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Cloud, Search, Plus, Edit2, CheckCircle2, Database, Layers, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import TableActionMenu from '../../../components/common/TableActionMenu';
import ResizableTh from '../../../components/ResizableTh';
import ProviderForm from './ProviderForm';
import ProviderDiscovery from './ProviderDiscovery';
import ProviderActionModal from './ProviderActionModal';
import ErrorBoundary from './ErrorBoundary';
import { useProviderContext } from '../../../contexts/ProviderContext';

export default function ProviderManagement() {
  const { providers, setProviders } = useProviderContext();
  const [providerSearch, setProviderSearch] = useState('');
  const [providerTypeFilter, setProviderTypeFilter] = useState('All Types');
  const [providerStatusFilter, setProviderStatusFilter] = useState('All Status');
  const [providerSortConfig, setProviderSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  
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

  const openModal = (mode, data = null) => {
    setModal({ isOpen: true, mode, data });
    setHasUnsavedChanges(false);
  };

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

  const handleRefreshProviders = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setToastMsg('Provider data refreshed successfully.');
      setTimeout(() => setToastMsg(''), 3000);
    }, 1500);
  };

  const handleProviderSort = (key) => {
    let direction = 'asc';
    if (providerSortConfig.key === key && providerSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setProviderSortConfig({ key, direction });
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

  const confirmAction = () => {
    if (actionModal.action === 'Delete') {
      setProviders(providers.filter(p => p.id !== actionModal.provider.id));
    }
    setActionModal({ isOpen: false, action: null, provider: null, isBlocking: false });
  };

  const handleFormSubmit = (data) => {
    if (modal.mode === 'add') {
      setProviders([...providers, { ...data, id: Date.now(), connectionStatus: 'Connected', discoveryStatus: 'Success', nodes: 0, templates: 0, networks: 0, datastores: 0 }]);
    } else {
      setProviders(providers.map(p => p.id === modal.data.id ? { ...p, ...data } : p));
    }
    closeModal(true);
  };

  const activeTab = 'Provider Management';
  const isLoading = false;

  return (
    <>
          {/* Provider Management */}
          {!isLoading && activeTab === 'Provider Management' && (
            <div key={activeTab} className="flex flex-col gap-6 h-full animate-in slide-in-from-right-8 fade-in duration-300 fill-mode-both items-start w-full">
              
              {/* Stats Row */}
              <div className="shrink-0 w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card p-4 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Provider Management Statistics</h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Overview of registered infrastructure providers and connection states.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{providers.length}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Providers</div>
                    </div>
                    <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{providers.filter(p => p.connectionStatus === 'Connected').length}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Connected</div>
                    </div>
                    <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{providers.filter(p => p.discoveryStatus === 'Success').length}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Discovery Success</div>
                    </div>
                    <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{providers.reduce((acc, p) => acc + p.templates, 0)}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Templates</div>
                    </div>
                    <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{providers.reduce((acc, p) => acc + p.networks, 0)}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Networks</div>
                    </div>
                    <div className="text-center pl-4">
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">{providers.reduce((acc, p) => acc + p.datastores, 0)}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Datastores</div>
                    </div>
                  </div>
                </div>

                {/* Scrollable Container for Tables Only */}
                <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col gap-6 pr-1 pb-1">
                  {/* Provider Overview Table */}
                  <div className="block w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card shadow-card shrink-0">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex items-center justify-between">
                    <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100">Provider Overview</h3>
                    <div className="flex items-center gap-2 relative">
                      <button 
                        onClick={handleRefreshProviders}
                        disabled={isRefreshing}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md disabled:opacity-50"
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
                      
                      {/* Sync Toast Notification */}
                      {toastMsg && (
                        <div className="absolute top-full right-0 mt-3 z-50 animate-in slide-in-from-top-2 fade-in duration-300 pointer-events-none">
                          <div className="bg-slate-800 dark:bg-slate-700 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2.5 text-sm font-medium whitespace-nowrap">
                            <CheckCircle2 size={16} className="text-emerald-400" />
                            {toastMsg}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex items-center gap-3">
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
                      <option value="Proxmox">Proxmox</option>
                      <option value="VMware">VMware</option>
                      <option value="Nutanix">Nutanix</option>
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
                  
                  <div className="w-full overflow-x-auto overflow-y-visible">
                    {providers.length === 0 ? (
                      <div className="w-full py-16 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                        <Cloud size={48} className="mb-4 opacity-20" />
                        <h4 className="text-[15px] font-bold text-gray-800 dark:text-gray-200 mb-1">No Providers Configured</h4>
                        <p className="text-[13px] mb-4 text-center max-w-sm">Register your first infrastructure provider to begin VM provisioning.</p>
                        <button onClick={() => openModal('add', null)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20">
                          <Plus size={14} /> Add Provider
                        </button>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-[13px]">
                        <thead className="sticky top-0 bg-white dark:bg-card z-10 shadow-sm border-b border-gray-100 dark:border-theme">
                          <tr>
                            <ResizableTh width={180} onClick={() => handleProviderSort('name')} storageKey="provider_management_column_widths" columnKey="name">
                              Provider Name {providerSortConfig.key === 'name' ? (providerSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                            </ResizableTh>
                            <ResizableTh width={100} storageKey="provider_management_column_widths" columnKey="type">Type</ResizableTh>
                            <ResizableTh width={180} storageKey="provider_management_column_widths" columnKey="endpoint">Endpoint</ResizableTh>
                            <ResizableTh width={80} storageKey="provider_management_column_widths" columnKey="nodes">Nodes</ResizableTh>
                            <ResizableTh width={100} onClick={() => handleProviderSort('templates')} storageKey="provider_management_column_widths" columnKey="templates">
                              Templates {providerSortConfig.key === 'templates' ? (providerSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                            </ResizableTh>
                            <ResizableTh width={100} onClick={() => handleProviderSort('networks')} storageKey="provider_management_column_widths" columnKey="networks">
                              Networks {providerSortConfig.key === 'networks' ? (providerSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                            </ResizableTh>
                            <ResizableTh width={100} onClick={() => handleProviderSort('datastores')} storageKey="provider_management_column_widths" columnKey="datastores">
                              Datastores {providerSortConfig.key === 'datastores' ? (providerSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                            </ResizableTh>
                            <ResizableTh width={100} storageKey="provider_management_column_widths" columnKey="connection">Connection</ResizableTh>

                            <ResizableTh width={100} storageKey="provider_management_column_widths" columnKey="discovery">Discovery</ResizableTh>
                            <ResizableTh width={140} storageKey="provider_management_column_widths" columnKey="lastDiscovery">Last Discovery</ResizableTh>
                            <ResizableTh width={110} storageKey="provider_management_column_widths" columnKey="syncMode">Sync Mode</ResizableTh>
                            <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider table-header-optimized border-b border-slate-100 dark:border-theme w-16">ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {providers.filter(p => 
                            (providerTypeFilter === 'All Types' || p.type === providerTypeFilter) &&
                            (providerStatusFilter === 'All Status' || p.connectionStatus === providerStatusFilter) &&
                            (p.name.toLowerCase().includes(providerSearch.toLowerCase()) || 
                             p.endpoint.toLowerCase().includes(providerSearch.toLowerCase()) || 
                             p.type.toLowerCase().includes(providerSearch.toLowerCase()))
                          ).sort((a, b) => {
                            if (a[providerSortConfig.key] < b[providerSortConfig.key]) {
                              return providerSortConfig.direction === 'asc' ? -1 : 1;
                            }
                            if (a[providerSortConfig.key] > b[providerSortConfig.key]) {
                              return providerSortConfig.direction === 'asc' ? 1 : -1;
                            }
                            return 0;
                          }).map((p) => (
                            <tr key={p.id} className="table-row-optimized border-b border-slate-100 dark:border-theme last:border-0 group">
                              <td className="px-5 py-3">
                                <div className="text-[13px] font-bold text-gray-800 dark:text-gray-200">{p.name}</div>
                              </td>
                              <td className="px-4 py-3 text-[13px] text-gray-600 dark:text-gray-400">{p.type}</td>
                              <td className="px-4 py-3 text-[13px] text-gray-600 dark:text-gray-400">{p.endpoint}</td>
                              <td className="px-4 py-3 text-[13px] font-bold text-emerald-600 dark:text-emerald-400">{p.nodes}</td>
                              <td className="px-4 py-3 text-[13px] font-bold text-blue-600 dark:text-blue-400">{p.templates}</td>
                              <td className="px-4 py-3 text-[13px] font-bold text-purple-600 dark:text-purple-400">{p.networks}</td>
                              <td className="px-4 py-3 text-[13px] font-bold text-amber-500 dark:text-amber-400">{p.datastores}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${p.connectionStatus === 'Connected' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}>
                                  {p.connectionStatus}
                                </span>
                              </td>

                              <td className="px-4 py-3">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${p.discoveryStatus === 'Success' ? 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' : p.discoveryStatus === 'Failed' ? 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' : p.discoveryStatus === 'Running' ? 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' : 'bg-slate-50 text-slate-600 border border-slate-200 dark:bg-surface dark:text-slate-400 dark:border-theme'}`}>
                                  {p.discoveryStatus}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[12px]">
                                <div className="text-gray-800 dark:text-gray-200 font-medium">{p.lastDiscovery || 'Never'}</div>
                                {p.lastDiscovery && <div className="text-gray-400 dark:text-gray-500 mt-0.5">{p.nextDiscovery ? `Next: ${p.nextDiscovery}` : 'Manual'}</div>}
                              </td>
                              <td className="px-4 py-3 text-[12px]">
                                <div className="text-gray-800 dark:text-gray-200 font-medium">{p.syncInterval}</div>
                                <div className="text-gray-400 dark:text-gray-500 mt-0.5">{p.autoSync ? 'Auto Sync' : 'Manual Only'}</div>
                              </td>
                              <td className="px-5 py-3 text-center">
                                <TableActionMenu
                                  isOpen={openDropdownId === p.id}
                                  onToggle={(e) => handleDropdownClick(e, p.id)}
                                  dropdownPos={dropdownPos}
                                >
                                  <button onClick={() => { setOpenDropdownId(null); openModal('edit', p); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                                    <Edit2 size={14}/> Edit Provider
                                  </button>
                                  <button onClick={() => setOpenDropdownId(null)} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 size={14}/> Test Discovery Connection
                                  </button>
                                  <button onClick={() => setOpenDropdownId(null)} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-purple-600 dark:text-purple-400">
                                    <Database size={14}/> Run Discovery Now
                                  </button>
                                  <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                  <button onClick={() => { setOpenDropdownId(null); setDiscoveryDrawer({ isOpen: true, provider: p }); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400">
                                    <Layers size={14} />
                                    Discovery Explorer
                                  </button>
                                  <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                  <button onClick={() => { setOpenDropdownId(null); handleDeleteClick(p); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                    <Trash2 size={14}/> Delete Provider
                                  </button>
                                </TableActionMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  {/* Pagination */}
                  <div className="h-[56px] bg-white dark:bg-transparent border-t border-gray-100 dark:border-theme flex items-center justify-between px-5">
                    <div className="text-[12px] font-medium text-gray-500 dark:text-gray-400">
                      Showing {providers.length > 0 ? 1 : 0}–{providers.length} of {providers.length} Providers
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-gray-500 dark:text-gray-400">Rows per page:</span>
                        <select className="bg-transparent text-[12px] font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-theme rounded-md px-2 py-1 outline-none cursor-pointer">
                          <option value="10">10</option>
                          <option value="50">50</option>
                        </select>
                      </div>
                      <div className="w-px h-4 bg-gray-200 dark:bg-slate-700"></div>
                      <div className="flex items-center gap-1.5">
                        <button className="w-8 h-8 flex items-center justify-center border border-gray-200 dark:border-theme bg-white dark:bg-card text-gray-400 dark:text-gray-500 rounded-input text-[12px] font-medium cursor-not-allowed">←</button>
                        <button className="w-8 h-8 flex items-center justify-center border-none bg-gradient-to-br from-teal-500 to-emerald-500 text-white rounded-input shadow-sm text-[12px] font-bold cursor-default">1</button>
                        <button className="w-8 h-8 flex items-center justify-center border border-gray-200 dark:border-theme bg-white dark:bg-card text-gray-400 dark:text-gray-500 rounded-input text-[12px] font-medium cursor-not-allowed">→</button>
                      </div>
                    </div>
                  </div>
                </div>
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
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight">Unsaved Changes</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">You have unsaved changes in the form. Are you sure you want to close it? Your changes will be lost.</p>
              <div className="flex justify-center gap-3 mt-4 w-full">
                <button onClick={() => setShowUnsavedWarning(false)} className="flex-1 px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-input transition-colors">Cancel</button>
                <button onClick={confirmCloseModal} className="flex-1 px-4 py-2 text-[13px] font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-input transition-colors shadow-sm">Discard Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
