import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Box, Search, Plus, Filter, Edit2, Trash2, X, AlertTriangle, Shield, CheckCircle2, XCircle, Clock, Server, Eye } from 'lucide-react';
import TableActionMenu from '../../../components/common/TableActionMenu';
import { useEnvironmentContext } from '../../../contexts/EnvironmentContext';
import { useCatalogContext } from '../../../contexts/CatalogContext';
import { useNetworkContext } from '../../../contexts/NetworkContext';
import { useDatastoreContext } from '../../../contexts/DatastoreContext';
import { useNodeContext } from '../../../contexts/NodeContext';
import { useProviderContext } from '../../../contexts/ProviderContext';
import { useTierContext } from '../../../contexts/TierContext';
import ResizableTh from '../../../components/ResizableTh';
import TableSkeleton from '../../../components/common/TableSkeleton';
import { useDebouncedValue } from '../../../lib/useDebouncedValue';
import EnvironmentForm from './EnvironmentForm';
import EnvironmentExplorer from './EnvironmentExplorer';
import { useUI } from '../../../stores/uiStore';

export default function EnvironmentManagement() {
  const { environments, loading, create, update, remove } = useEnvironmentContext();
  const pushToast = useUI((s) => s.pushToast);
  const { catalogs } = useCatalogContext();
  const { networks } = useNetworkContext();
  const { datastores } = useDatastoreContext();
  const { nodes } = useNodeContext();
  const { providers } = useProviderContext();
  const { tiers } = useTierContext();
  
  // Searching & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modals & Drawers
  const [envDrawer, setEnvDrawer] = useState({ isOpen: false, environment: null });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showUnsavedWarning) {
          setShowUnsavedWarning(false);
        } else if (isFormOpen) {
          closeForm();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showUnsavedWarning, isFormOpen, hasUnsavedChanges]);

  const closeForm = (force = false) => {
    if (hasUnsavedChanges && !force) {
      setShowUnsavedWarning(true);
    } else {
      setIsFormOpen(false);
      setShowUnsavedWarning(false);
      setHasUnsavedChanges(false);
    }
  };

  const confirmCloseForm = () => {
    closeForm(true);
  };
  const [formMode, setFormMode] = useState('create');
  const [editingEnv, setEditingEnv] = useState(null);
  
  // Action Menu State
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  // Deletion/Action Modal
  const [envActionModal, setEnvActionModal] = useState({ isOpen: false, action: null, environment: null, isBlocking: false, blockReasons: [] });
  const [envActionConfirmText, setEnvActionConfirmText] = useState('');

  // Filtering Logic
  const debouncedSearch = useDebouncedValue(searchQuery, 250);
  const filteredEnvironments = environments.filter(env => {
    const q = debouncedSearch.toLowerCase();
    const matchesSearch = env.name.toLowerCase().includes(q) ||
                          env.description.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All Status' || env.status === statusFilter;
    const matchesType = typeFilter === 'All Types' || env.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate stats
  const totalEnvs = environments.length;
  const activeEnvs = environments.filter(e => e.status === 'Active').length;
  const defaultEnvs = environments.filter(e => e.type === 'Default').length;
  const customEnvs = environments.filter(e => e.type === 'Custom').length;

  // Handle outside click for menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenuId]);

  const openMenu = (e, envId) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.right - 160
    });
    setActiveMenuId(activeMenuId === envId ? null : envId);
  };

  const handleCreate = () => {
    setActiveMenuId(null); // close any open row action menu
    setFormMode('create');
    setEditingEnv(null);
    setIsFormOpen(true);
    setHasUnsavedChanges(false);
  };

  const handleEdit = (env) => {
    setFormMode('edit');
    setEditingEnv(env);
    setIsFormOpen(true);
    setActiveMenuId(null);
    setHasUnsavedChanges(false);
  };

  const handleSave = async (envData) => {
    const payload = {
      environmentName: envData.name,
      description: envData.description,
      expiryType: envData.expiryType,
      expiryValue: envData.expiryType === 'lifetime' ? null : envData.expiryValue,
      gracePeriodType: envData.gracePeriodType ?? 'days',
      gracePeriodValue: envData.gracePeriodValue ?? 7,
      approvalRequired: envData.approvalRequired,
      allowDataDisk: envData.allowDataDisk,
      maxDataDisks: envData.allowDataDisk ? (envData.maxDataDisks ?? 6) : 0,
      status: envData.status,
      // Allow-list is now Providers + Nodes + Tiers (etc.txt item 3). Networks/datastores
      // follow the selected nodes, so they're no longer sent; their dormant rule tables are
      // left untouched (syncRules only syncs keys present in the request).
      allowedProviderIds: envData.allowedProviderIds ?? [],
      allowedTierIds: envData.allowedTierIds ?? [],
      allowedNodeIds: envData.allowedNodeIds ?? [],
    };
    try {
      if (formMode === 'create') {
        await create(payload);
      } else {
        await update(editingEnv.id, payload);
      }
      closeForm(true);
    } catch (e) {
      pushToast({ kind: 'error', message: e.message || 'Save failed.' });
    }
  };

  const handleActionClick = (action, env) => {
    setActiveMenuId(null);
    setEnvActionConfirmText('');
    
    if (action === 'Delete') {
      if (env.type === 'Default') {
        setEnvActionModal({
          isOpen: true,
          action: 'Delete',
          environment: env,
          isBlocking: true,
          blockReasons: ['The environment is a Default Environment. Default environments are critical for core functionality and cannot be deleted.']
        });
        return;
      }

      // Check dependencies
      const inUseByCatalogs = catalogs.filter(c => Array.isArray(c.environment) ? c.environment.includes(env.name) : c.environment === env.name);
      const inUseByNetworks = networks.filter(n => Array.isArray(n.environment) ? n.environment.includes(env.name) : n.environment === env.name);
      const inUseByDatastores = datastores.filter(d => Array.isArray(d.environment) ? d.environment.includes(env.name) : d.environment === env.name);

      const blockReasons = [];
      if (inUseByCatalogs.length > 0) blockReasons.push(`In use by ${inUseByCatalogs.length} Catalog(s)`);
      if (inUseByNetworks.length > 0) blockReasons.push(`In use by ${inUseByNetworks.length} Network(s)`);
      if (inUseByDatastores.length > 0) blockReasons.push(`In use by ${inUseByDatastores.length} Datastore(s)`);

      if (blockReasons.length > 0) {
        setEnvActionModal({
          isOpen: true,
          action: 'Delete',
          environment: env,
          isBlocking: true,
          blockReasons
        });
        return;
      }
    }
    
    setEnvActionModal({
      isOpen: true,
      action,
      environment: env,
      isBlocking: false,
      blockReasons: []
    });
  };

  const handleConfirmAction = async () => {
    const { action, environment } = envActionModal;
    try {
      if (action === 'Delete') {
        await remove(environment.id);
      } else if (action === 'Enable') {
        await update(environment.id, { status: 'Active' });
      } else if (action === 'Disable') {
        await update(environment.id, { status: 'Inactive' });
      }
    } catch (e) {
      pushToast({ kind: 'error', message: e.message || 'Action failed.' });
    }
    setEnvActionModal({ isOpen: false, action: null, environment: null, isBlocking: false, blockReasons: [] });
  };

  const formatExpiry = (type, value) => {
    if (type === 'lifetime') return 'Lifetime';
    return `${value} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  };

  return (
    <div className="flex flex-col gap-6 h-full animate-in slide-in-from-right-8 fade-in duration-300 fill-mode-both items-start w-full">
      
      {/* Stats Row Header */}
      <div className="shrink-0 w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card p-4 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Environment Management Statistics</h1>
          <p className="text-[13px] text-slate-500 dark:text-zinc-400 mt-1">Configure expiry, approval, and resource policies per environment.</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
            <div className="text-2xl font-bold text-slate-800 dark:text-zinc-200">{totalEnvs}</div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Total Environments</div>
          </div>
          <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeEnvs}</div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Active</div>
          </div>
          <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">{defaultEnvs}</div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Default Envs</div>
          </div>
          <div className="text-center px-4">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{customEnvs}</div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Custom Envs</div>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col gap-6 pr-1 pb-1">

        {/* Table View Container */}
        <div className="block w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card shadow-card shrink-0">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100">Environment Overview</h3>
            <div className="flex items-center gap-2 relative">
              <button 
                onClick={handleCreate}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
              >
                <Plus size={14} /> Create Environment
              </button>
            </div>
          </div>
          
          {/* Toolbar */}
          <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex flex-wrap items-center gap-3">
            <div className="relative w-[300px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search environments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-surface border border-gray-200 dark:border-theme rounded-lg text-[13px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:text-gray-100"
              />
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white dark:bg-surface border border-gray-200 dark:border-theme text-gray-700 dark:text-gray-200 text-[13px] font-medium rounded-lg px-3 py-2 outline-none cursor-pointer min-w-[140px]"
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>

            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white dark:bg-surface border border-gray-200 dark:border-theme text-gray-700 dark:text-gray-200 text-[13px] font-medium rounded-lg px-3 py-2 outline-none cursor-pointer min-w-[140px]"
            >
              <option>All Types</option>
              <option>Default</option>
              <option>Custom</option>
            </select>
          </div>

          <div className="w-full overflow-x-auto overflow-y-visible">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-theme sticky top-0 z-10">
                <tr>
                  <ResizableTh>Environment</ResizableTh>
                  <ResizableTh>Type</ResizableTh>
                  <ResizableTh>Expiry Policy</ResizableTh>
                  <ResizableTh>Approval</ResizableTh>
                  <ResizableTh>Status</ResizableTh>
                  <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider table-header-optimized border-b border-slate-100 dark:border-theme w-16">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {loading && environments.length === 0 ? (
                  <TableSkeleton cols={6} />
                ) : filteredEnvironments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-slate-500 dark:text-zinc-400">
                      <Box size={32} className="mx-auto mb-3 opacity-20" />
                      <p>No environments found matching your criteria.</p>
                    </td>
                  </tr>
                ) : (
                  filteredEnvironments.map((env) => (
                    <tr key={env.id} className="table-row-optimized border-b border-slate-100 dark:border-theme last:border-0 group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20">
                            <Box size={16} className="text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-zinc-200">{env.name}</p>
                            <p className="text-[12px] text-slate-500 dark:text-zinc-500 truncate max-w-[200px]" title={env.description}>{env.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {env.type === 'Default' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                            <Shield size={12} className="text-slate-500" />
                            Default
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                            <Server size={12} className="text-indigo-500" />
                            Custom
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-zinc-300">
                          <Clock size={14} className="text-slate-400" />
                          {formatExpiry(env.expiryType, env.expiryValue)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {env.approvalRequired ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                            <Shield size={14} />
                            Required
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                            Optional
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium ${
                          env.status === 'Active' 
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'
                            : 'bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700'
                        }`}>
                          {env.status === 'Active' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {env.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <TableActionMenu
                          isOpen={activeMenuId === env.id}
                          onToggle={(e) => openMenu(e, env.id)}
                          dropdownPos={menuPosition}
                        >
                          <button 
                            onClick={() => { setEnvDrawer({ isOpen: true, environment: env }); setActiveMenuId(null); }}
                            className="w-full px-3 py-2 text-left text-[13px] text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                          >
                            <Eye size={14} /> Env Explorer
                          </button>
                          <button 
                            onClick={() => { handleEdit(env); setActiveMenuId(null); }}
                            className="w-full px-3 py-2 text-left text-[13px] text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                          >
                            <Edit2 size={14} /> Edit Env
                          </button>
                          <button 
                            onClick={() => { handleActionClick(env.status === 'Active' ? 'Disable' : 'Enable', env); setActiveMenuId(null); }}
                            className="w-full px-3 py-2 text-left text-[13px] text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                          >
                            {env.status === 'Active' ? (
                              <><XCircle size={14} className="text-amber-500" /> Disable Env</>
                            ) : (
                              <><CheckCircle2 size={14} className="text-emerald-500" /> Enable Env</>
                            )}
                          </button>
                          <div className="h-px bg-slate-100 dark:bg-zinc-700 my-1"></div>
                          <button 
                            onClick={() => { handleActionClick('Delete', env); setActiveMenuId(null); }}
                            className="w-full px-3 py-2 text-left text-[13px] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2"
                          >
                            <Trash2 size={14} /> Delete Env
                          </button>
                        </TableActionMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>


      {/* Forms */}
      <EnvironmentForm
        isOpen={isFormOpen}
        onClose={() => closeForm()}
        onSave={handleSave}
        initialData={editingEnv}
        title={formMode === 'create' ? "Create Environment" : "Edit Environment"}
        onChange={() => setHasUnsavedChanges(true)}
        lists={{ providers, tiers, nodes, networks, datastores }}
      />

      {/* Unified Action Modal */}
      {envActionModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" 
            onClick={() => setEnvActionModal({ isOpen: false, action: null, environment: null, isBlocking: false, blockReasons: [] })}
          />
          <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full max-w-[400px] overflow-hidden flex flex-col relative z-10 animate-in zoom-in-95 duration-200">
            <div className="p-5 flex flex-col gap-4">
              
              {envActionModal.isBlocking ? (
                <>
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-1">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-zinc-100 leading-tight">
                    Cannot Delete Environment
                  </h3>
                  <div className="text-sm text-slate-600 dark:text-zinc-400">
                    This environment cannot be deleted due to the following reasons:<br/><br/>
                    {envActionModal.blockReasons.map((reason, i) => (
                      <React.Fragment key={i}>
                        • {reason}<br/>
                      </React.Fragment>
                    ))}
                    <br/>
                    Please remove these dependencies before deleting this environment.
                  </div>
                  <div className="flex justify-end mt-2">
                    <button onClick={() => setEnvActionModal({ isOpen: false, action: null, environment: null, isBlocking: false, blockReasons: [] })} className="px-4 py-2 text-[13px] font-medium bg-slate-100 dark:bg-surface text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-md transition-colors">Close</button>
                  </div>
                </>
              ) : (
                <>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${
                    envActionModal.action === 'Delete' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500' :
                    envActionModal.action === 'Enable' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' :
                    'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500'
                  }`}>
                    {envActionModal.action === 'Delete' ? <Trash2 size={24} /> : envActionModal.action === 'Enable' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-zinc-100 leading-tight">
                    {envActionModal.action} Environment
                  </h3>
                  <div className="text-sm text-slate-600 dark:text-zinc-400">
                    {envActionModal.action === 'Delete' && 'This action cannot be undone.'}
                    {envActionModal.action === 'Enable' && 'This will make the environment available for new resource assignments.'}
                    {envActionModal.action === 'Disable' && 'This will prevent new resources from using this environment.'}
                  </div>
                  <div className="bg-slate-50 dark:bg-surface p-3 rounded-card text-[12px] border border-gray-200 dark:border-theme">
                    <div className="font-semibold text-slate-700 dark:text-zinc-300 mb-1">Environment:</div>
                    <div className="text-slate-500 dark:text-zinc-400 font-mono">{envActionModal.environment?.name}</div>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Type the environment name to confirm:</label>
                    <input 
                      type="text" 
                      value={envActionConfirmText}
                      onChange={(e) => setEnvActionConfirmText(e.target.value)}
                      placeholder={`Type "${envActionModal.environment?.name}"`}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors shadow-sm" 
                    />
                  </div>
                  <div className="p-4 bg-transparent dark:bg-transparent/50 border-t border-gray-100 dark:border-theme flex justify-end gap-3 mt-2 -mx-5 -mb-5">
                    <button onClick={() => setEnvActionModal({ isOpen: false, action: null, environment: null, isBlocking: false, blockReasons: [] })} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-input transition-colors">
                      Cancel
                    </button>
                    <button 
                      onClick={handleConfirmAction} 
                      disabled={envActionConfirmText !== envActionModal.environment?.name}
                      className={`px-4 py-2 text-[13px] font-medium text-white rounded-input transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                        envActionModal.action === 'Delete' ? 'bg-rose-600 hover:bg-rose-700' :
                        envActionModal.action === 'Enable' ? 'bg-emerald-600 hover:bg-emerald-700' :
                        'bg-amber-600 hover:bg-amber-700'
                      }`}>
                      {envActionModal.action} Environment
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Explorer Drawer */}
      <EnvironmentExplorer envDrawer={envDrawer} setEnvDrawer={setEnvDrawer} />

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
                <button onClick={confirmCloseForm} className="flex-1 px-4 py-2 text-[13px] font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-input transition-colors shadow-sm">Discard Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
