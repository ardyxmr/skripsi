import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Grid, Search, Filter, Edit2, Trash2, XCircle, CheckCircle2, RefreshCw, Plus, AlertTriangle, Layers } from 'lucide-react';
import TableActionMenu from '../../../components/common/TableActionMenu';
import Colgroup from '../../../components/common/Colgroup';
import PaginationBar from '../../../components/common/PaginationBar';
import { useClientPagination } from '../../../components/common/useClientPagination';
import NetworkForm from './NetworkForm';
import NetworkExplorer from './NetworkExplorer';
import { useProviderContext } from '../../../contexts/ProviderContext';
import { useNetworkContext } from '../../../contexts/NetworkContext';
import StatusPill from '../../../components/common/StatusPill';
import { isOffline } from '../../../lib/resourceStatus';
import TableSkeleton from '../../../components/common/TableSkeleton';
import { useDebouncedValue } from '../../../lib/useDebouncedValue';
import { formatDateTime } from '../../../lib/datetime';
import { useUI } from '../../../stores/uiStore';
import { ensureMinDuration } from '../../../lib/minDuration';
import { LIVE_CACHE_EVENT } from '../../../lib/liveCache';

// Fixed column widths (px) shared by the pinned-header table + scrolling body table (aligned under
// `table-fixed`). 9 columns; sum ≈ 1330 = the table's min width.
const NETWORK_COL_WIDTHS = [220, 180, 140, 180, 160, 100, 120, 160, 70];

export default function NetworkManagement() {
  const { providers } = useProviderContext();
  const { networks, loading, refetch, create, update, remove } = useNetworkContext();
  // All notifications use the global, always-on-top top-center toast (consistent everywhere).
  const pushToast = useUI((s) => s.pushToast);
  const dismissToast = useUI((s) => s.dismissToast);
  
  // Search & Filters
  const [networkSearch, setNetworkSearch] = useState('');
  const [networkProviderFilter, setNetworkProviderFilter] = useState('All Providers');
  const [networkStatusFilter, setNetworkStatusFilter] = useState('All Status');
  const [networkSortConfig, setNetworkSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [isRefreshingNetwork, setIsRefreshingNetwork] = useState(false);

  // Actions & Modals
  const [networkActionModal, setNetworkActionModal] = useState({ isOpen: false, action: null, network: null, isBlocking: false });
  const [networkActionConfirmText, setNetworkActionConfirmText] = useState('');
  const [networkDrawer, setNetworkDrawer] = useState({ isOpen: false, network: null });
  
  const [modal, setModal] = useState({ isOpen: false, type: null, mode: null, data: null });
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef(null);
  
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
  // LIVE_CACHE_EVENT when VMs are created or deleted. Re-pull networks silently on that event so the
  // Usage column updates on its own, no manual refresh.
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
  
  // All success notifications go through the global top-center toast (same as the error toasts).
  const showNetworkToast = (msg) => pushToast({ kind: 'success', message: msg });

  const handleRefreshNetworks = async () => {
    if (isRefreshingNetwork) return;
    setIsRefreshingNetwork(true);
    const start = Date.now();
    const tid = crypto.randomUUID();
    pushToast({ id: tid, kind: 'loading', message: 'Refreshing network data…' });
    try {
      await refetch();
      dismissToast(tid);
      showNetworkToast('Network data refreshed successfully.');
    } catch (e) {
      dismissToast(tid);
      pushToast({ kind: 'error', message: e.message || 'Refresh failed.' });
    } finally {
      // Let the icon complete at least one full spin even on a cache-fast refetch.
      await ensureMinDuration(start);
      setIsRefreshingNetwork(false);
    }
  };

  const handleNetworkSort = (key) => {
    let direction = 'asc';
    if (networkSortConfig.key === key && networkSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setNetworkSortConfig({ key, direction });
  };

  const handleDropdownClick = (e, id) => {
    if (openDropdownId === id) {
      setOpenDropdownId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + window.scrollY, right: window.innerWidth - rect.right });
      setOpenDropdownId(id);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-dropdown-container') && !e.target.closest('.action-dropdown-portal')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddEditNetworkSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      networkName: formData.get('networkName'),
      description: formData.get('description'),
      providerId: Number(formData.get('providerId')) || null,
      providerNetworkId: Number(formData.get('providerNetworkId')) || null,
      status: formData.get('status'),
    };

    try {
      if (modal.mode === 'edit') {
        await update(modal.data.id, payload);
        showNetworkToast(`Network "${payload.networkName}" updated successfully.`);
      } else {
        await create(payload);
        showNetworkToast(`Network "${payload.networkName}" created successfully.`);
      }
      closeModal(true);
    } catch (err) {
      pushToast({ kind: 'error', message: err.message || 'Save failed.' });
    }
  };

  const handleNetworkActionClick = (action, network) => {
    if (action === 'Delete' && network.activeVMs > 0) {
      setNetworkActionModal({ isOpen: true, action: 'Delete', network, isBlocking: true });
    } else {
      setNetworkActionModal({ isOpen: true, action, network, isBlocking: false });
      setNetworkActionConfirmText('');
    }
  };

  const handleConfirmNetworkAction = async () => {
    const target = networkActionModal.network;
    try {
    if (networkActionModal.action === 'Delete') {
      await remove(target.id);
      showNetworkToast(`Network "${target.name}" deleted successfully.`);
    } else if (networkActionModal.action === 'Enable' || networkActionModal.action === 'Disable') {
      await update(target.id, { status: networkActionModal.action === 'Enable' ? 'Active' : 'Disabled' });
      showNetworkToast(`Network "${target.name}" ${networkActionModal.action === 'Enable' ? 'enabled' : 'disabled'} successfully.`);
    }
    } catch (e) {
      pushToast({ kind: 'error', message: e.message || 'Action failed.' });
    }
    setNetworkActionModal({ isOpen: false, action: null, network: null, isBlocking: false });
  };

  const debouncedSearch = useDebouncedValue(networkSearch, 250);
  const sortedNetworks = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return networks.filter(n => {
      const matchesSearch = n.name.toLowerCase().includes(q) ||
                            (n.description && n.description.toLowerCase().includes(q)) ||
                            n.provider.toLowerCase().includes(q);
      
      const matchesProvider = networkProviderFilter === 'All Providers' || n.provider === networkProviderFilter;
      const matchesStatus = networkStatusFilter === 'All Status'
        || (networkStatusFilter === 'Offline / Missing' ? isOffline(n.status) : n.status === networkStatusFilter);

      return matchesSearch && matchesProvider && matchesStatus;
    }).sort((a, b) => {
      if (networkSortConfig.key === 'activeVMs') {
        return networkSortConfig.direction === 'asc' ? a.activeVMs - b.activeVMs : b.activeVMs - a.activeVMs;
      }
      if (a[networkSortConfig.key] < b[networkSortConfig.key]) return networkSortConfig.direction === 'asc' ? -1 : 1;
      if (a[networkSortConfig.key] > b[networkSortConfig.key]) return networkSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [networks, debouncedSearch, networkProviderFilter, networkStatusFilter, networkSortConfig]);

  const networksPager = useClientPagination(sortedNetworks, 10);

  return (
    <div className="flex flex-col gap-6 h-full animate-in slide-in-from-right-8 fade-in duration-300 fill-mode-both items-start w-full">
      {/* Stats Row */}
      <div className="shrink-0 w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card p-4 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Network Management Statistics</h1>
            <p className="text-[13px] text-slate-500 dark:text-zinc-400 mt-1">Overview of infrastructure networks from connected providers.</p>
          </div>
          <div className="flex gap-4">
              <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                <div className="text-2xl font-bold text-slate-800 dark:text-zinc-200">{networks.length}</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Total Networks</div>
              </div>
              <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{networks.filter(n => !isOffline(n.status)).length}</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Active</div>
              </div>
              <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{networks.filter(n => isOffline(n.status)).length}</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Offline / Missing</div>
              </div>
            <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{new Set(networks.map(n => n.provider)).size}</div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Linked Providers</div>
            </div>
            <div className="text-center px-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{new Set(networks.map(n => n.node)).size}</div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Active Nodes</div>
            </div>

          </div>
        </div>

        {/* Scrollable Container for Tables Only */}
        <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col gap-6 pr-1 pb-1">
          {/* Network Overview Table */}
          <div className="flex flex-col w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card shadow-card min-h-0">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex items-center justify-between shrink-0">
            <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100">Network Overview</h3>
            <div className="flex items-center gap-2 relative">
              <button 
                onClick={handleRefreshNetworks}
                disabled={isRefreshingNetwork}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-md disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw size={16} className={isRefreshingNetwork ? 'animate-spin' : ''} />
              </button>
              <button onClick={() => openModal('network', 'add')} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20">
                <Plus size={14} /> Add Network
              </button>
            </div>
          </div>
          
          <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex items-center gap-3 shrink-0">
            <div className="relative w-[300px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Network..."
                value={networkSearch}
                onChange={e => setNetworkSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-surface border border-gray-200 dark:border-theme rounded-lg text-[13px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:text-gray-100"
              />
            </div>
            <select 
              value={networkProviderFilter}
              onChange={e => setNetworkProviderFilter(e.target.value)}
              className="bg-white dark:bg-surface border border-gray-200 dark:border-theme text-gray-700 dark:text-gray-200 text-[13px] font-medium rounded-lg px-3 py-2 outline-none cursor-pointer min-w-[140px]"
            >
              <option value="All Providers">All Providers</option>
              {Array.from(new Set(networks.map(n => n.provider))).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              value={networkStatusFilter}
              onChange={e => setNetworkStatusFilter(e.target.value)}
              className="bg-white dark:bg-surface border border-gray-200 dark:border-theme text-gray-700 dark:text-gray-200 text-[13px] font-medium rounded-lg px-3 py-2 outline-none cursor-pointer min-w-[140px]"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
              <option value="Offline / Missing">Offline / Missing</option>
            </select>
          </div>
          
          <div className="w-full overflow-x-auto overflow-y-hidden custom-scrollbar flex-auto min-h-0 flex flex-col">
            <div className="min-w-[1330px] w-full h-full flex flex-col">
              <table className="w-full text-left border-collapse table-fixed shrink-0">
                <Colgroup widths={NETWORK_COL_WIDTHS} />
                <thead className="bg-gray-50 dark:bg-surface border-b border-gray-200 dark:border-theme shadow-sm">
                  <tr className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="px-5 py-3 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300" onClick={() => handleNetworkSort('name')}>
                      Network Name {networkSortConfig.key === 'name' ? (networkSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="px-5 py-3 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300" onClick={() => handleNetworkSort('provider')}>
                      Provider {networkSortConfig.key === 'provider' ? (networkSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="px-5 py-3 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300" onClick={() => handleNetworkSort('node')}>
                      Node {networkSortConfig.key === 'node' ? (networkSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="px-5 py-3">Provider Network</th>
                    <th className="px-5 py-3">CIDR</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300" onClick={() => handleNetworkSort('activeVMs')}>
                      Usage {networkSortConfig.key === 'activeVMs' ? (networkSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="px-5 py-3 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300" onClick={() => handleNetworkSort('lastUpdated')}>
                      Last Updated {networkSortConfig.key === 'lastUpdated' ? (networkSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="px-5 py-3 text-center">Action</th>
                  </tr>
                </thead>
              </table>
              <div className="flex-auto min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-card">
              <table className="w-full text-left border-collapse whitespace-nowrap table-fixed">
                <Colgroup widths={NETWORK_COL_WIDTHS} />
                <tbody>
                  {loading && networks.length === 0 && <TableSkeleton cols={9} />}
                  {!loading && networksPager.total === 0 && (
                    <tr>
                      <td colSpan="9" className="py-16">
                        <div className="w-full flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500">
                          <Grid size={48} className="mb-4 opacity-20" />
                          <h4 className="text-[15px] font-bold text-gray-800 dark:text-gray-200 mb-1">No Networks Found</h4>
                          <p className="text-[13px] mb-4 text-center max-w-sm">Create a network mapping to manage discovered infrastructure networks.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {networksPager.paged.map((network) => (
                    <tr key={network.id} className={`table-row-optimized border-b border-slate-100 dark:border-theme last:border-0 group ${isOffline(network.status) ? 'opacity-60' : ''}`}>
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-800 dark:text-zinc-200 text-[13px]">{network.name}</div>
                        {network.description && <div className="text-[12px] text-slate-500 dark:text-zinc-400 mt-0.5">{network.description}</div>}
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-zinc-300 text-[13px]">{network.provider}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-zinc-300 text-[13px]">{network.node}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-zinc-400 text-[13px] font-mono">{network.providerNetwork}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-zinc-400 text-[13px] font-mono">{network.cidr || '192.168.1.0/24'}</td>
                      <td className="px-5 py-3">
                        <StatusPill status={network.status} label={network.status} variant="soft" shape="full" size="sm" weight="font-medium" pad="px-2 py-0.5" />
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-zinc-300 text-[13px] font-medium">
                        {network.activeVMs || 0} VMs
                      </td>
                      <td className="px-5 py-3 text-slate-400 dark:text-zinc-500 text-[12px]">{formatDateTime(network.lastUpdated)}</td>
                      <td className="px-5 py-3 text-center">
                        <TableActionMenu
                          isOpen={openDropdownId === `network-${network.id}`}
                          onToggle={(e) => handleDropdownClick(e, `network-${network.id}`)}
                          dropdownPos={dropdownPos}
                        >
                          <button onClick={() => { setOpenDropdownId(null); openModal('network', 'edit', network); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200">
                            <Edit2 size={14}/> Edit Network
                          </button>
                          <button onClick={() => { setOpenDropdownId(null); setNetworkDrawer({ isOpen: true, network }); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-700 text-blue-600 dark:text-blue-400">
                            <Layers size={14}/> Network Explorer
                          </button>
                          <button disabled={isOffline(network.status)} title={isOffline(network.status) ? 'Provider offline — reconnect the provider first' : undefined} onClick={() => { if (isOffline(network.status)) return; setOpenDropdownId(null); handleNetworkActionClick(network.status === 'Active' ? 'Disable' : 'Enable', network); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                            {network.status === 'Active' ? <XCircle size={14} className="text-amber-500"/> : <CheckCircle2 size={14} className="text-emerald-500"/>}
                            {network.status === 'Active' ? 'Disable Network' : 'Enable Network'}
                          </button>
                          <div className="h-px bg-slate-100 dark:bg-zinc-700 my-1"></div>
                          <button onClick={() => { setOpenDropdownId(null); handleNetworkActionClick('Delete', network); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            <Trash2 size={14}/> Delete Network
                          </button>
                        </TableActionMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
          <PaginationBar pager={networksPager} noun="Networks" />
        </div>
      </div>

      {networkActionModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full max-w-[400px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 flex flex-col gap-4">
              
              {networkActionModal.isBlocking ? (
                <>
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-1">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-zinc-100 leading-tight">
                    Cannot Delete Network
                  </h3>
                  <div className="text-sm text-slate-600 dark:text-zinc-400">
                    This network is currently being used by active resources.<br/><br/>
                    The network cannot be deleted while it is referenced by:<br/>
                    • Active VMs<br/>
                    • Active Deployments<br/><br/>
                    Move or remove the related VMs before deleting this network.
                  </div>
                  <div className="flex justify-end mt-2">
                    <button onClick={() => setNetworkActionModal({ isOpen: false, action: null, network: null, isBlocking: false })} className="px-4 py-2 text-[13px] font-medium bg-slate-100 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700/80 rounded-md transition-colors">Close</button>
                  </div>
                </>
              ) : (
                <>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${
                    networkActionModal.action === 'Delete' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500' :
                    networkActionModal.action === 'Enable' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' :
                    'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500'
                  }`}>
                    {networkActionModal.action === 'Delete' ? <Trash2 size={24} /> : networkActionModal.action === 'Enable' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-zinc-100 leading-tight">
                    {networkActionModal.action} Network
                  </h3>
                  <div className="text-sm text-slate-600 dark:text-zinc-400">
                    {networkActionModal.action === 'Delete' && 'This action cannot be undone.'}
                    {networkActionModal.action === 'Enable' && 'This will make the network available for provisioning.'}
                    {networkActionModal.action === 'Disable' && 'This will prevent new provisioning requests from using this network.'}
                  </div>
                  {networkActionModal.action === 'Disable' && networkActionModal.network?.activeVMs > 0 && (
                    <div className="text-[12px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-md px-3 py-2">
                      ⚠️ {networkActionModal.network.activeVMs} active VM(s) still use this network. Disabling only stops NEW provisioning — existing VMs keep running.
                    </div>
                  )}
                  <div className="bg-slate-50 dark:bg-surface p-3 rounded-card text-[12px] border border-gray-200 dark:border-theme">
                    <div className="font-semibold text-slate-700 dark:text-zinc-300 mb-1">Network:</div>
                    <div className="text-slate-500 dark:text-zinc-400 font-mono">{networkActionModal.network?.name}</div>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Type the network name to confirm:</label>
                    <input 
                      type="text" 
                      value={networkActionConfirmText}
                      onChange={(e) => setNetworkActionConfirmText(e.target.value)}
                      placeholder={`Type "${networkActionModal.network?.name}"`}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors shadow-sm" 
                    />
                  </div>
                  <div className="p-4 bg-transparent dark:bg-transparent/50 border-t border-slate-100 dark:border-theme flex justify-end gap-3 mt-2 -mx-5 -mb-5">
                    <button onClick={() => setNetworkActionModal({ isOpen: false, action: null, network: null, isBlocking: false })} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-input transition-colors">
                      Cancel
                    </button>
                    <button 
                      onClick={handleConfirmNetworkAction} 
                      disabled={networkActionConfirmText !== networkActionModal.network?.name}
                      className={`px-4 py-2 text-[13px] font-medium text-white rounded-input transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                        networkActionModal.action === 'Delete' ? 'bg-rose-600 hover:bg-rose-700' :
                        networkActionModal.action === 'Enable' ? 'bg-emerald-600 hover:bg-emerald-700' :
                        'bg-amber-600 hover:bg-amber-700'
                      }`}>
                      {networkActionModal.action} Network
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <NetworkForm 
        modal={modal} 
        setModal={closeModal} 
        handleAddEditNetworkSubmit={handleAddEditNetworkSubmit} 
        providers={providers}
        onChange={() => setHasUnsavedChanges(true)}
      />
      
      <NetworkExplorer 
        networkDrawer={networkDrawer} 
        setNetworkDrawer={setNetworkDrawer} 
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
