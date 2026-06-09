import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Grid, Search, Filter, Edit2, Trash2, XCircle, CheckCircle2, RefreshCw, Plus, AlertTriangle, Layers } from 'lucide-react';
import TableActionMenu from '../../../components/common/TableActionMenu';
import ResizableTh from '../../../components/ResizableTh';
import NetworkForm from './NetworkForm';
import NetworkExplorer from './NetworkExplorer';
import { useProviderContext } from '../../../contexts/ProviderContext';
import { useNetworkContext } from '../../../contexts/NetworkContext';

export default function NetworkManagement() {
  const { providers } = useProviderContext();
  const { networks, refetch, create, update, remove } = useNetworkContext();
  
  // Search & Filters
  const [networkSearch, setNetworkSearch] = useState('');
  const [networkProviderFilter, setNetworkProviderFilter] = useState('All Providers');
  const [networkEnvironmentFilter, setNetworkEnvironmentFilter] = useState('All Environments');
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
  
  const [networkToastMsg, setNetworkToastMsg] = useState('');

  const showNetworkToast = (msg) => {
    setNetworkToastMsg(msg);
    setTimeout(() => setNetworkToastMsg(''), 3000);
  };

  const handleRefreshNetworks = async () => {
    if (isRefreshingNetwork) return;
    setIsRefreshingNetwork(true);
    try {
      await refetch();
      showNetworkToast('Network data refreshed successfully.');
    } catch (e) {
      showNetworkToast(e.message || 'Refresh failed.');
    } finally {
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
      provider: formData.get('provider'),
      node: formData.get('node'),
      providerNetwork: formData.get('providerNetwork'),
      environment: formData.getAll('environment'),
      tiers: formData.getAll('tiers'),
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
      showNetworkToast(err.message || 'Save failed.');
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
      showNetworkToast(e.message || 'Action failed.');
    }
    setNetworkActionModal({ isOpen: false, action: null, network: null, isBlocking: false });
  };

  const sortedNetworks = useMemo(() => {
    return networks.filter(n => {
      const matchesSearch = n.name.toLowerCase().includes(networkSearch.toLowerCase()) || 
                            (n.description && n.description.toLowerCase().includes(networkSearch.toLowerCase())) ||
                            n.provider.toLowerCase().includes(networkSearch.toLowerCase());
      
      const matchesProvider = networkProviderFilter === 'All Providers' || n.provider === networkProviderFilter;
      const matchesEnvironment = networkEnvironmentFilter === 'All Environments' || n.environment.includes(networkEnvironmentFilter);
      const matchesStatus = networkStatusFilter === 'All Status' || n.status === networkStatusFilter;
      
      return matchesSearch && matchesProvider && matchesEnvironment && matchesStatus;
    }).sort((a, b) => {
      if (networkSortConfig.key === 'activeVMs') {
        return networkSortConfig.direction === 'asc' ? a.activeVMs - b.activeVMs : b.activeVMs - a.activeVMs;
      }
      if (a[networkSortConfig.key] < b[networkSortConfig.key]) return networkSortConfig.direction === 'asc' ? -1 : 1;
      if (a[networkSortConfig.key] > b[networkSortConfig.key]) return networkSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [networks, networkSearch, networkProviderFilter, networkEnvironmentFilter, networkStatusFilter, networkSortConfig]);

  return (
    <div className="flex flex-col gap-6 h-full animate-in slide-in-from-right-8 fade-in duration-300 fill-mode-both items-start w-full">
      {/* Stats Row */}
      <div className="shrink-0 w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card p-4 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Network Management Statistics</h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Overview of infrastructure networks from connected providers.</p>
          </div>
          <div className="flex gap-4">
              <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{networks.length}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Total Networks</div>
              </div>
              <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{networks.filter(n => n.status !== 'Offline / Missing').length}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Active</div>
              </div>
              <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{networks.filter(n => n.status === 'Offline / Missing').length}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Offline / Missing</div>
              </div>
            <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{new Set(networks.map(n => n.provider)).size}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Linked Providers</div>
            </div>
            <div className="text-center px-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{new Set(networks.map(n => n.node)).size}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Active Nodes</div>
            </div>

          </div>
        </div>

        {/* Scrollable Container for Tables Only */}
        <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col gap-6 pr-1 pb-1">
          {/* Network Overview Table */}
          <div className="block w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card shadow-card shrink-0">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100">Network Overview</h3>
            <div className="flex items-center gap-2 relative">
              <button 
                onClick={handleRefreshNetworks}
                disabled={isRefreshingNetwork}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw size={16} className={isRefreshingNetwork ? 'animate-spin' : ''} />
              </button>
              <button onClick={() => openModal('network', 'add')} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20">
                <Plus size={14} /> Add Network
              </button>
              
              {/* Sync Toast Notification */}
              {networkToastMsg && (
                <div className="absolute top-full right-0 mt-3 z-50 animate-in slide-in-from-top-2 fade-in duration-300 pointer-events-none">
                  <div className="bg-slate-800 dark:bg-slate-700 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2.5 text-sm font-medium whitespace-nowrap">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    {networkToastMsg}
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
              value={networkEnvironmentFilter}
              onChange={e => setNetworkEnvironmentFilter(e.target.value)}
              className="bg-white dark:bg-surface border border-gray-200 dark:border-theme text-gray-700 dark:text-gray-200 text-[13px] font-medium rounded-lg px-3 py-2 outline-none cursor-pointer min-w-[140px]"
            >
              <option value="All Environments">All Environments</option>
              <option value="Production">Production</option>
              <option value="Development">Development</option>
              <option value="Staging">Staging</option>
              <option value="Testing">Testing</option>
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
          
          <div className="w-full overflow-x-auto overflow-y-visible">
            {networks.length === 0 ? (
              <div className="w-full py-16 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <Grid size={48} className="mb-4 opacity-20" />
                <h4 className="text-[15px] font-bold text-gray-800 dark:text-gray-200 mb-1">No Networks Found</h4>
                <p className="text-[13px] mb-4 text-center max-w-sm">Create a network mapping to manage discovered infrastructure networks.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
                <thead className="sticky top-0 z-20 shadow-sm">
                  <tr>
                    <ResizableTh width={220} storageKey="network_management_column_widths" columnKey="name" onClick={() => handleNetworkSort('name')}>
                      Network Name {networkSortConfig.key === 'name' ? (networkSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </ResizableTh>
                    <ResizableTh width={180} storageKey="network_management_column_widths" columnKey="provider" onClick={() => handleNetworkSort('provider')}>
                      Provider {networkSortConfig.key === 'provider' ? (networkSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </ResizableTh>
                    <ResizableTh width={140} storageKey="network_management_column_widths" columnKey="node" onClick={() => handleNetworkSort('node')}>
                      Node {networkSortConfig.key === 'node' ? (networkSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </ResizableTh>
                    <ResizableTh width={180} storageKey="network_management_column_widths" columnKey="providerNetwork">
                      Provider Network
                    </ResizableTh>
                    <ResizableTh width={160} storageKey="network_management_column_widths" columnKey="cidr">
                      CIDR
                    </ResizableTh>
                    <ResizableTh width={140} storageKey="network_management_column_widths" columnKey="environment" onClick={() => handleNetworkSort('environment')}>
                      Environment {networkSortConfig.key === 'environment' ? (networkSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </ResizableTh>
                    <ResizableTh width={140} storageKey="network_management_column_widths" columnKey="tiers">
                      Tier
                    </ResizableTh>
                    <ResizableTh width={100} storageKey="network_management_column_widths" columnKey="status">
                      Status
                    </ResizableTh>
                    <ResizableTh width={120} storageKey="network_management_column_widths" columnKey="usage" onClick={() => handleNetworkSort('activeVMs')}>
                      Usage {networkSortConfig.key === 'activeVMs' ? (networkSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </ResizableTh>
                    <ResizableTh width={160} storageKey="network_management_column_widths" columnKey="lastUpdated" onClick={() => handleNetworkSort('lastUpdated')}>
                      Last Updated {networkSortConfig.key === 'lastUpdated' ? (networkSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </ResizableTh>
                    <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider table-header-optimized border-b border-slate-100 dark:border-theme w-16">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedNetworks.map((network) => (
                    <tr key={network.id} className="table-row-optimized border-b border-slate-100 dark:border-theme last:border-0 group">
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200 text-[13px]">{network.name}</div>
                        {network.description && <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{network.description}</div>}
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300 text-[13px]">{network.provider}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300 text-[13px]">{network.node}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-[13px] font-mono">{network.providerNetwork}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-[13px] font-mono">{network.cidr || '192.168.1.0/24'}</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(network.environment) ? network.environment : [network.environment]).map(env => (
                            <span key={env} className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border ${
                              env === 'Production' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20' :
                              env === 'Development' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' :
                              env === 'Testing' ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20' :
                              'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                            }`}>
                              {env}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {network.tiers?.map(tier => (
                            <span key={tier} className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded border bg-slate-50 dark:bg-surface text-slate-600 dark:text-slate-400 border-slate-200 dark:border-theme">
                              {tier}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border ${
                          network.status === 'Active' 
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' 
                            : network.status === 'Offline / Missing'
                            ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                            : 'bg-slate-100 dark:bg-surface text-slate-600 dark:text-slate-400 border-slate-200 dark:border-theme'
                        }`}>
                          {network.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300 text-[13px] font-medium">
                        {network.activeVMs || 0} VMs
                      </td>
                      <td className="px-5 py-3 text-slate-400 dark:text-slate-500 text-[12px]">{network.lastUpdated}</td>
                      <td className="px-5 py-3 text-center">
                        <TableActionMenu
                          isOpen={openDropdownId === `network-${network.id}`}
                          onToggle={(e) => handleDropdownClick(e, `network-${network.id}`)}
                          dropdownPos={dropdownPos}
                        >
                          <button onClick={() => { setOpenDropdownId(null); openModal('network', 'edit', network); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                            <Edit2 size={14}/> Edit Network
                          </button>
                          <button onClick={() => { setOpenDropdownId(null); setNetworkDrawer({ isOpen: true, network }); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400">
                            <Layers size={14}/> Network Explorer
                          </button>
                          <button onClick={() => { setOpenDropdownId(null); handleNetworkActionClick(network.status === 'Active' ? 'Disable' : 'Enable', network); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                            {network.status === 'Active' ? <XCircle size={14} className="text-amber-500"/> : <CheckCircle2 size={14} className="text-emerald-500"/>} 
                            {network.status === 'Active' ? 'Disable Network' : 'Enable Network'}
                          </button>
                          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                          <button onClick={() => { setOpenDropdownId(null); handleNetworkActionClick('Delete', network); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            <Trash2 size={14}/> Delete Network
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
              Showing {networks.length > 0 ? 1 : 0}–{networks.length} of {networks.length} Networks
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

      {networkActionModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full max-w-[400px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 flex flex-col gap-4">
              
              {networkActionModal.isBlocking ? (
                <>
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-1">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                    Cannot Delete Network
                  </h3>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    This network is currently being used by active resources.<br/><br/>
                    The network cannot be deleted while it is referenced by:<br/>
                    • Active VMs<br/>
                    • Active Deployments<br/><br/>
                    Move or remove the related VMs before deleting this network.
                  </div>
                  <div className="flex justify-end mt-2">
                    <button onClick={() => setNetworkActionModal({ isOpen: false, action: null, network: null, isBlocking: false })} className="px-4 py-2 text-[13px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-md transition-colors">Close</button>
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
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                    {networkActionModal.action} Network
                  </h3>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {networkActionModal.action === 'Delete' && 'This action cannot be undone.'}
                    {networkActionModal.action === 'Enable' && 'This will make the network available for provisioning.'}
                    {networkActionModal.action === 'Disable' && 'This will prevent new provisioning requests from using this network.'}
                  </div>
                  <div className="bg-slate-50 dark:bg-surface p-3 rounded-card text-[12px] border border-gray-200 dark:border-theme">
                    <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Network:</div>
                    <div className="text-slate-500 dark:text-slate-400 font-mono">{networkActionModal.network?.name}</div>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Type the network name to confirm:</label>
                    <input 
                      type="text" 
                      value={networkActionConfirmText}
                      onChange={(e) => setNetworkActionConfirmText(e.target.value)}
                      placeholder={`Type "${networkActionModal.network?.name}"`}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors shadow-sm" 
                    />
                  </div>
                  <div className="p-4 bg-transparent dark:bg-transparent/50 border-t border-slate-100 dark:border-theme flex justify-end gap-3 mt-2 -mx-5 -mb-5">
                    <button onClick={() => setNetworkActionModal({ isOpen: false, action: null, network: null, isBlocking: false })} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-input transition-colors">
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
    </div>
  );
}
