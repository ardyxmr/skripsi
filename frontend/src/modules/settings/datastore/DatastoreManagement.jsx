import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, Filter, Plus, FileText, CheckCircle2, XCircle, AlertCircle, Eye, Settings2, Shield, Server, Box, Globe, Info, Play, Loader2, ArrowRight, Save, Trash2, Key, Database, RefreshCw, AlertTriangle, Grid, Edit2, Layers, Check 
} from 'lucide-react';
import TableActionMenu from '../../../components/common/TableActionMenu';
import ResizableTh from '../../../components/ResizableTh';

// Extracted Components
import DatastoreForm from './DatastoreForm';
import DatastoreDiscovery from './DatastoreDiscovery';
import { useProviderContext } from '../../../contexts/ProviderContext';
import { useDatastoreContext } from '../../../contexts/DatastoreContext';
import StatusPill from '../../../components/common/StatusPill';
import { isOffline } from '../../../lib/resourceStatus';
import TableSkeleton from '../../../components/common/TableSkeleton';
import { useDebouncedValue } from '../../../lib/useDebouncedValue';
import { formatDateTime } from '../../../lib/datetime';
import { useUI } from '../../../stores/uiStore';
import { ensureMinDuration } from '../../../lib/minDuration';
import { LIVE_CACHE_EVENT } from '../../../lib/liveCache';

export default function DatastoreManagement() {
  const { providers } = useProviderContext();
  const { datastores, loading, refetch, create, update, remove } = useDatastoreContext();
  // All notifications use the global, always-on-top top-center toast (consistent everywhere).
  const pushToast = useUI((s) => s.pushToast);
  const dismissToast = useUI((s) => s.dismissToast);
  const [datastoreSearchQuery, setDatastoreSearchQuery] = useState('');
  const [datastoreProviderFilter, setDatastoreProviderFilter] = useState('All Providers');
  const [datastoreStatusFilter, setDatastoreStatusFilter] = useState('All Status');
  const [datastoreSortConfig, setDatastoreSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [datastoreActionModal, setDatastoreActionModal] = useState({ isOpen: false, action: null, datastore: null, isBlocking: false });
  const [datastoreActionConfirmText, setDatastoreActionConfirmText] = useState('');
  const [datastoreDrawer, setDatastoreDrawer] = useState({ isOpen: false, datastore: null });
  const [isRefreshingDatastore, setIsRefreshingDatastore] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [modal, setModal] = useState({ isOpen: false, type: null, mode: null, data: null });

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

  // Keep the Usage (active-VM) count live: the app-wide LiveDataPoller refreshes /inventory and fires
  // LIVE_CACHE_EVENT when VMs are created or deleted. Re-pull datastores silently on that event so the
  // VMs column updates on its own, no manual refresh.
  const refetchRef = useRef(refetch);
  useEffect(() => { refetchRef.current = refetch; }, [refetch]);
  useEffect(() => {
    const onLive = (e) => {
      if (e.detail?.path !== '/inventory' || document.hidden) return;
      refetchRef.current?.({ silent: true });
    };
    window.addEventListener(LIVE_CACHE_EVENT, onLive);
    return () => window.removeEventListener(LIVE_CACHE_EVENT, onLive);
  }, []);

  const openModal = (type, mode, data = null) => {
    setModal({ isOpen: true, type, mode, data });
    setHasUnsavedChanges(false);
  };

  const closeModal = (force = false) => {
    if (hasUnsavedChanges && !force) {
      setShowUnsavedWarning(true);
    } else {
      setModal({ isOpen: false, type: null, mode: null, data: null });
      setShowUnsavedWarning(false);
      setHasUnsavedChanges(false);
    }
  };

  const confirmCloseModal = () => {
    closeModal(true);
  };

  // Handle outside click for dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-dropdown-container') && !e.target.closest('.action-dropdown-portal')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownClick = (e, id) => {
    e.stopPropagation();
    if (openDropdownId === id) {
      setOpenDropdownId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom, right: window.innerWidth - rect.right });
      setOpenDropdownId(id);
    }
  };

  const handleDatastoreActionClick = (action, datastore) => {
    if (action === 'Delete') {
      if (datastore.activeVMs > 0 || (datastore.status === 'Active' && Array.isArray(datastore.environment) && datastore.environment.includes('Production'))) {
        setDatastoreActionModal({ isOpen: true, action: 'Delete', datastore, isBlocking: true });
        return;
      }
    }
    setDatastoreActionConfirmText('');
    setDatastoreActionModal({ isOpen: true, action, datastore, isBlocking: false });
  };

  const handleConfirmDatastoreAction = async () => {
    const { action, datastore } = datastoreActionModal;
    try {
      if (action === 'Delete') {
        await remove(datastore.id);
      } else if (action === 'Enable') {
        await update(datastore.id, { status: 'Active' });
      } else if (action === 'Disable') {
        await update(datastore.id, { status: 'Disabled' });
      }
    } catch (e) {
      pushToast({ kind: 'error', message: e.message || 'Action failed.' });
    }
    setDatastoreActionModal({ isOpen: false, action: null, datastore: null, isBlocking: false });
    setDatastoreActionConfirmText('');
  };

  const handleRefreshDatastores = async () => {
    setIsRefreshingDatastore(true);
    const start = Date.now();
    const tid = crypto.randomUUID();
    pushToast({ id: tid, kind: 'loading', message: 'Refreshing datastore data…' });
    try {
      await refetch();
      dismissToast(tid);
      pushToast({ kind: 'success', message: 'Datastore data refreshed successfully.' });
    } catch (e) {
      dismissToast(tid);
      pushToast({ kind: 'error', message: e.message || 'Refresh failed.' });
    } finally {
      // Let the icon complete at least one full spin even on a cache-fast refetch.
      await ensureMinDuration(start);
      setIsRefreshingDatastore(false);
    }
  };

  const handleAddEditDatastoreSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      datastoreName: formData.get('datastoreName'),
      description: formData.get('description'),
      providerId: Number(formData.get('providerId')) || null,
      providerDatastoreId: Number(formData.get('providerDatastoreId')) || null,
      status: formData.get('status'),
    };

    try {
      if (modal.mode === 'add') {
        await create(payload);
      } else {
        await update(modal.data.id, payload);
      }
      closeModal(true);
    } catch (err) {
      pushToast({ kind: 'error', message: err.message || 'Save failed.' });
    }
  };

  const handleDatastoreSort = (key) => {
    let direction = 'asc';
    if (datastoreSortConfig.key === key && datastoreSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setDatastoreSortConfig({ key, direction });
  };

  const debouncedSearch = useDebouncedValue(datastoreSearchQuery, 250);
  const sortedDatastores = React.useMemo(() => {
    let sortableData = [...datastores];

    // Apply Filters
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      sortableData = sortableData.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      );
    }
    if (datastoreProviderFilter !== 'All Providers') sortableData = sortableData.filter(d => d.provider === datastoreProviderFilter);
    if (datastoreStatusFilter !== 'All Status') sortableData = sortableData.filter(d => datastoreStatusFilter === 'Offline / Missing' ? isOffline(d.status) : d.status === datastoreStatusFilter);

    if (datastoreSortConfig.key !== null) {
      sortableData.sort((a, b) => {
        let valA = a[datastoreSortConfig.key];
        let valB = b[datastoreSortConfig.key];
        if (datastoreSortConfig.key === 'capacity') {
            valA = a.capacity.percentage;
            valB = b.capacity.percentage;
        }
        if (valA < valB) return datastoreSortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return datastoreSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableData;
  }, [datastores, debouncedSearch, datastoreProviderFilter, datastoreStatusFilter, datastoreSortConfig]);

  return (
    <div className="flex flex-col gap-6 h-full animate-in slide-in-from-right-8 fade-in duration-300 fill-mode-both items-start w-full">
      
      {/* Stats Row */}
      <div className="shrink-0 w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card p-4 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Datastore Management Statistics</h1>
            <p className="text-[13px] text-slate-500 dark:text-zinc-400 mt-1">Overview of infrastructure datastores from connected providers.</p>
          </div>
          <div className="flex gap-4">
              <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                <div className="text-2xl font-bold text-slate-800 dark:text-zinc-200">{datastores.length}</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Total Datastores</div>
              </div>
              <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{datastores.filter(n => n.status === 'Active').length}</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Active</div>
              </div>
              <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{datastores.filter(n => isOffline(n.status)).length}</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Offline / Missing</div>
              </div>
            <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">{datastores.filter(n => n.status === 'Low Capacity').length}</div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Low Capacity</div>
            </div>
            <div className="text-center px-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{new Set(datastores.map(n => n.provider)).size}</div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Linked Providers</div>
            </div>
          </div>
        </div>

        {/* Scrollable Container for Tables Only */}
        <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col gap-6 pr-1 pb-1">
          {/* Datastore Overview Table */}
          <div className="block w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card shadow-card shrink-0">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100">Datastore Overview</h3>
            <div className="flex items-center gap-2 relative">
              <button 
                onClick={handleRefreshDatastores}
                disabled={isRefreshingDatastore}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-md disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw size={16} className={isRefreshingDatastore ? 'animate-spin' : ''} />
              </button>
              <button 
                onClick={() => openModal('datastore', 'add')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
              >
                <Plus size={14} /> Add Datastore
              </button>
            </div>
          </div>
          
          <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex flex-wrap items-center gap-3">
            <div className="relative w-[300px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search Datastore..." 
                value={datastoreSearchQuery}
                onChange={e => setDatastoreSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-surface border border-gray-200 dark:border-theme rounded-lg text-[13px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:text-gray-100"
              />
            </div>
            <select 
              value={datastoreProviderFilter}
              onChange={e => setDatastoreProviderFilter(e.target.value)}
              className="bg-white dark:bg-surface border border-gray-200 dark:border-theme text-gray-700 dark:text-gray-200 text-[13px] font-medium rounded-lg px-3 py-2 outline-none cursor-pointer min-w-[140px]"
            >
              <option value="All Providers">All Providers</option>
              {Array.from(new Set(datastores.map(n => n.provider))).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              value={datastoreStatusFilter}
              onChange={e => setDatastoreStatusFilter(e.target.value)}
              className="bg-white dark:bg-surface border border-gray-200 dark:border-theme text-gray-700 dark:text-gray-200 text-[13px] font-medium rounded-lg px-3 py-2 outline-none cursor-pointer min-w-[140px]"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
              <option value="Offline / Missing">Offline / Missing</option>
              <option value="Node Offline">Node Offline</option>
              <option value="Low Capacity">Low Capacity</option>
            </select>
          </div>
          
          <div className="w-full overflow-x-auto overflow-y-visible">
            {datastores.length === 0 && !loading ? (
              <div className="w-full py-16 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500">
                <Database size={48} className="mb-4 opacity-20" />
                <h4 className="text-[15px] font-bold text-gray-800 dark:text-gray-200 mb-1">No Datastores Found</h4>
                <p className="text-[13px] mb-4 text-center max-w-sm">Create a datastore mapping to manage discovered infrastructure storage.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1200px]">
                <thead className="sticky top-0 z-20 shadow-sm">
                  <tr>
                    <ResizableTh width={220} storageKey="datastore_management_column_widths" columnKey="name" onClick={() => handleDatastoreSort('name')}>
                      Datastore Name {datastoreSortConfig.key === 'name' ? (datastoreSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </ResizableTh>
                    <ResizableTh width={140} storageKey="datastore_management_column_widths" columnKey="provider" onClick={() => handleDatastoreSort('provider')}>
                      Provider {datastoreSortConfig.key === 'provider' ? (datastoreSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </ResizableTh>
                    <ResizableTh width={140} storageKey="datastore_management_column_widths" columnKey="node" onClick={() => handleDatastoreSort('node')}>
                      Node {datastoreSortConfig.key === 'node' ? (datastoreSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </ResizableTh>
                    <ResizableTh width={140} storageKey="datastore_management_column_widths" columnKey="providerDatastore">
                      Provider Datastore
                    </ResizableTh>
                    <ResizableTh width={120} storageKey="datastore_management_column_widths" columnKey="type">
                      Datastore Type
                    </ResizableTh>
                    <ResizableTh width={200} storageKey="datastore_management_column_widths" columnKey="capacity" onClick={() => handleDatastoreSort('capacity')}>
                      Capacity {datastoreSortConfig.key === 'capacity' ? (datastoreSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </ResizableTh>
                    <ResizableTh width={120} storageKey="datastore_management_column_widths" columnKey="status">
                      Status
                    </ResizableTh>
                    <ResizableTh width={100} storageKey="datastore_management_column_widths" columnKey="usage" onClick={() => handleDatastoreSort('activeVMs')}>
                      VMs {datastoreSortConfig.key === 'activeVMs' ? (datastoreSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </ResizableTh>
                    <ResizableTh width={160} storageKey="datastore_management_column_widths" columnKey="lastUpdated" onClick={() => handleDatastoreSort('lastUpdated')}>
                      Last Updated {datastoreSortConfig.key === 'lastUpdated' ? (datastoreSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </ResizableTh>
                    <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider table-header-optimized border-b border-slate-100 dark:border-theme w-16">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && datastores.length === 0 && <TableSkeleton cols={10} />}
                  {sortedDatastores.map((datastore) => (
                    <tr key={datastore.id} className={`table-row-optimized border-b border-slate-100 dark:border-theme last:border-0 group ${isOffline(datastore.status) ? 'opacity-60' : ''}`}>
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-800 dark:text-zinc-200 text-[13px]">{datastore.name}</div>
                        {datastore.description && <div className="text-[12px] text-slate-500 dark:text-zinc-400 mt-0.5">{datastore.description}</div>}
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-zinc-300 text-[13px]">{datastore.provider}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-zinc-300 text-[13px]">{datastore.node}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-zinc-400 text-[13px] font-mono">{datastore.providerDatastore}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-zinc-400 text-[13px]">{datastore.type}</td>
                      <td className="px-5 py-3">
                        {isOffline(datastore.status) ? (
                          // Provider unreachable → the capacity snapshot is stale, so blank it (mirrors the node CPU/RAM bars).
                          <span className="text-[12px] text-slate-400">— offline</span>
                        ) : (
                          <div className="flex flex-col gap-1 w-full max-w-[160px]">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                              <span>{datastore.capacity.used} / {datastore.capacity.total}</span>
                              <span className="font-medium">{datastore.capacity.percentage}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${datastore.capacity.percentage > 90 ? 'bg-rose-500' : datastore.capacity.percentage > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${datastore.capacity.percentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill status={datastore.status} label={datastore.status} variant="soft" shape="full" size="sm" weight="font-medium" pad="px-2 py-0.5" />
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-zinc-300 text-[13px] font-medium">
                        {datastore.activeVMs || 0}
                      </td>
                      <td className="px-5 py-3 text-slate-400 dark:text-zinc-500 text-[12px]">{formatDateTime(datastore.lastUpdated)}</td>
                      <td className="px-5 py-3 text-center">
                        <TableActionMenu
                          isOpen={openDropdownId === `datastore-${datastore.id}`}
                          onToggle={(e) => handleDropdownClick(e, `datastore-${datastore.id}`)}
                          dropdownPos={dropdownPos}
                        >
                          <button onClick={() => { setOpenDropdownId(null); openModal('datastore', 'edit', datastore); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200">
                            <Edit2 size={14}/> Edit Datastore
                          </button>
                          <button onClick={() => { setOpenDropdownId(null); setDatastoreDrawer({ isOpen: true, datastore }); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-700 text-blue-600 dark:text-blue-400">
                            <Database size={14}/> Datastore Explorer
                          </button>
                          <button disabled={isOffline(datastore.status)} title={isOffline(datastore.status) ? 'Provider offline — reconnect the provider first' : undefined} onClick={() => { if (isOffline(datastore.status)) return; setOpenDropdownId(null); handleDatastoreActionClick(datastore.status === 'Active' ? 'Disable' : 'Enable', datastore); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                            {datastore.status === 'Active' ? <XCircle size={14} className="text-amber-500"/> : <CheckCircle2 size={14} className="text-emerald-500"/>}
                            {datastore.status === 'Active' ? 'Disable Datastore' : 'Enable Datastore'}
                          </button>
                          <div className="h-px bg-slate-100 dark:bg-zinc-700 my-1"></div>
                          <button onClick={() => { setOpenDropdownId(null); handleDatastoreActionClick('Delete', datastore); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            <Trash2 size={14}/> Delete Datastore
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
              Showing {datastores.length > 0 ? 1 : 0}–{datastores.length} of {datastores.length} Datastores
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-gray-500 dark:text-gray-400">Rows per page:</span>
                <select className="bg-transparent text-[12px] font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-theme rounded-md px-2 py-1 outline-none cursor-pointer">
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              <div className="w-px h-4 bg-gray-200 dark:bg-theme"></div>
              <div className="flex items-center gap-1.5">
                <button className="w-8 h-8 flex items-center justify-center border border-gray-200 dark:border-theme bg-white dark:bg-card text-gray-400 dark:text-gray-500 rounded-input text-[12px] font-medium cursor-not-allowed">←</button>
                <button className="w-8 h-8 flex items-center justify-center border-none bg-gradient-to-br from-teal-500 to-emerald-500 text-white rounded-input shadow-sm text-[12px] font-bold cursor-default">1</button>
                <button className="w-8 h-8 flex items-center justify-center border border-gray-200 dark:border-theme bg-white dark:bg-card text-gray-400 dark:text-gray-500 rounded-input text-[12px] font-medium cursor-not-allowed">→</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {datastoreActionModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full max-w-[400px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 flex flex-col gap-4">
              
              {datastoreActionModal.isBlocking ? (
                <>
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-1">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-zinc-100 leading-tight">
                    Cannot Delete Datastore
                  </h3>
                  <div className="text-sm text-slate-600 dark:text-zinc-400">
                    This datastore is currently being used by active resources.<br/><br/>
                    The datastore cannot be deleted while it is referenced by:<br/>
                    • Active VMs<br/>
                    • Active Deployments<br/><br/>
                    Move or remove the related VMs before deleting this datastore.
                  </div>
                  <div className="flex justify-end mt-2">
                    <button onClick={() => setDatastoreActionModal({ isOpen: false, action: null, datastore: null, isBlocking: false })} className="px-4 py-2 text-[13px] font-medium bg-slate-100 dark:bg-surface text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-md transition-colors">Close</button>
                  </div>
                </>
              ) : (
                <>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${
                    datastoreActionModal.action === 'Delete' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500' :
                    datastoreActionModal.action === 'Enable' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' :
                    'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500'
                  }`}>
                    {datastoreActionModal.action === 'Delete' ? <Trash2 size={24} /> : datastoreActionModal.action === 'Enable' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-zinc-100 leading-tight">
                    {datastoreActionModal.action} Datastore
                  </h3>
                  <div className="text-sm text-slate-600 dark:text-zinc-400">
                    {datastoreActionModal.action === 'Delete' && 'This action cannot be undone.'}
                    {datastoreActionModal.action === 'Enable' && 'This will make the datastore available for provisioning.'}
                    {datastoreActionModal.action === 'Disable' && 'This will prevent new provisioning requests from using this datastore.'}
                  </div>
                  {datastoreActionModal.action === 'Disable' && datastoreActionModal.datastore?.activeVMs > 0 && (
                    <div className="text-[12px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-md px-3 py-2">
                      ⚠️ {datastoreActionModal.datastore.activeVMs} active VM(s) still use this datastore. Disabling only stops NEW provisioning — existing VMs keep running.
                    </div>
                  )}
                  <div className="bg-slate-50 dark:bg-surface p-3 rounded-card text-[12px] border border-gray-200 dark:border-theme">
                    <div className="font-semibold text-slate-700 dark:text-zinc-300 mb-1">Datastore:</div>
                    <div className="text-slate-500 dark:text-zinc-400 font-mono">{datastoreActionModal.datastore?.name}</div>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Type the datastore name to confirm:</label>
                    <input 
                      type="text" 
                      value={datastoreActionConfirmText}
                      onChange={(e) => setDatastoreActionConfirmText(e.target.value)}
                      placeholder={`Type "${datastoreActionModal.datastore?.name}"`}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors shadow-sm" 
                    />
                  </div>
                  <div className="p-4 bg-transparent dark:bg-transparent/50 border-t border-gray-100 dark:border-theme flex justify-end gap-3 mt-2 -mx-5 -mb-5">
                    <button onClick={() => setDatastoreActionModal({ isOpen: false, action: null, datastore: null, isBlocking: false })} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-input transition-colors">
                      Cancel
                    </button>
                    <button 
                      onClick={handleConfirmDatastoreAction} 
                      disabled={datastoreActionConfirmText !== datastoreActionModal.datastore?.name}
                      className={`px-4 py-2 text-[13px] font-medium text-white rounded-input transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                        datastoreActionModal.action === 'Delete' ? 'bg-rose-600 hover:bg-rose-700' :
                        datastoreActionModal.action === 'Enable' ? 'bg-emerald-600 hover:bg-emerald-700' :
                        'bg-amber-600 hover:bg-amber-700'
                      }`}>
                      {datastoreActionModal.action} Datastore
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <DatastoreForm 
        modal={modal} 
        setModal={closeModal} 
        handleAddEditDatastoreSubmit={handleAddEditDatastoreSubmit} 
        providers={providers}
        onChange={() => setHasUnsavedChanges(true)}
      />
      
      {/* We pass the whole datastoreDrawer state and setter to the explorer */}
      <DatastoreDiscovery
        datastoreDrawer={datastoreDrawer} 
        setDatastoreDrawer={setDatastoreDrawer} 
      />
        {/* Unsaved Changes Warning Modal */}
        {showUnsavedWarning && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
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
    </div>
  );
}
