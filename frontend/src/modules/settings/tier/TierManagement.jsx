import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Layers, Search, Plus, Filter, Edit2, Trash2, X, AlertTriangle, Shield, CheckCircle2, XCircle, Cpu, MemoryStick, HardDrive, MoreVertical } from 'lucide-react';
import TableActionMenu from '../../../components/common/TableActionMenu';
import { useTierContext } from '../../../contexts/TierContext';
import { useEnvironmentContext } from '../../../contexts/EnvironmentContext';
import ResizableTh from '../../../components/ResizableTh';
import TierForm from './TierForm';

export default function TierManagement() {
  const { tiers, setTiers } = useTierContext();
  const { environments } = useEnvironmentContext();
  
  // Searching & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Types');

  // Modals
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
  const [editingTier, setEditingTier] = useState(null);
  
  // Action Menu State
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  // Deletion/Action Modal
  const [tierActionModal, setTierActionModal] = useState({ isOpen: false, action: null, tier: null, isBlocking: false, blockReasons: [] });
  const [tierActionConfirmText, setTierActionConfirmText] = useState('');

  // Filtering Logic
  const filteredTiers = tiers.filter(tier => {
    const matchesSearch = tier.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tier.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || tier.status === statusFilter;
    const matchesType = typeFilter === 'All Types' || tier.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate stats
  const totalTiers = tiers.length;
  const activeTiers = tiers.filter(t => t.status === 'Active').length;
  const inactiveTiers = tiers.filter(t => t.status === 'Inactive').length;
  const mostUsedTier = "Bronze"; // Mocked since Inventory doesn't exist yet

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

  const openMenu = (e, tierId) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.right - 160
    });
    setActiveMenuId(activeMenuId === tierId ? null : tierId);
  };

  const handleCreate = () => {
    setFormMode('create');
    setEditingTier(null);
    setIsFormOpen(true);
    setHasUnsavedChanges(false);
  };

  const handleEdit = (tier) => {
    setFormMode('edit');
    setEditingTier(tier);
    setIsFormOpen(true);
    setActiveMenuId(null);
    setHasUnsavedChanges(false);
  };

  const handleSave = (tierData) => {
    if (formMode === 'create') {
      const newTier = {
        ...tierData,
        id: Math.max(...tiers.map(t => t.id), 0) + 1,
        type: 'Custom',
        createdDate: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      };
      setTiers([...tiers, newTier]);
    } else {
      setTiers(tiers.map(t => {
        if (t.id === editingTier.id) {
          return {
            ...t,
            ...tierData
          };
        }
        return t;
      }));
    }
    closeForm(true);
  };

  const handleActionClick = (action, tier) => {
    setActiveMenuId(null);
    setTierActionConfirmText('');
    
    if (action === 'Delete') {
      if (tier.type === 'Default') {
        setTierActionModal({
          isOpen: true,
          action: 'Delete',
          tier: tier,
          isBlocking: true,
          blockReasons: ['The tier is a Default Tier. Default tiers are critical for core functionality and cannot be deleted.']
        });
        return;
      }

      // Check dependencies (Mocking environments check for future-proofing)
      // We assume environments might have a `allowedTiers` array
      const inUseByEnvironments = environments.filter(e => e.allowedTiers && e.allowedTiers.includes(tier.name));

      const blockReasons = [];
      if (inUseByEnvironments.length > 0) blockReasons.push(`In use by ${inUseByEnvironments.length} Environment Policy(s)`);
      // Future: Check Inventory and Provision Requests here
      // if (inUseByInventory) blockReasons.push(`In use by active VMs in Inventory`);

      if (blockReasons.length > 0) {
        setTierActionModal({
          isOpen: true,
          action: 'Delete',
          tier: tier,
          isBlocking: true,
          blockReasons
        });
        return;
      }
    }
    
    setTierActionModal({
      isOpen: true,
      action,
      tier: tier,
      isBlocking: false,
      blockReasons: []
    });
  };

  const handleConfirmAction = () => {
    const { action, tier } = tierActionModal;
    
    if (action === 'Delete') {
      setTiers(tiers.filter(t => t.id !== tier.id));
    } else if (action === 'Enable') {
      setTiers(tiers.map(t => t.id === tier.id ? { ...t, status: 'Active' } : t));
    } else if (action === 'Disable') {
      setTiers(tiers.map(t => t.id === tier.id ? { ...t, status: 'Inactive' } : t));
    }
    
    setTierActionModal({ isOpen: false, action: null, tier: null, isBlocking: false, blockReasons: [] });
  };

  return (
    <div className="flex flex-col gap-6 h-full animate-in slide-in-from-right-8 fade-in duration-300 fill-mode-both items-start w-full">
      
      {/* Stats Row Header */}
      <div className="shrink-0 w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card p-4 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Tier Management Statistics</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Configure compute resource blueprints for provisioning.</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{totalTiers}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Total Tiers</div>
          </div>
          <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeTiers}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Active Tiers</div>
          </div>
          <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">{inactiveTiers}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Inactive Tiers</div>
          </div>
          <div className="text-center px-4">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{mostUsedTier}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Most Used Tier</div>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col gap-6 pr-1 pb-1">

        {/* Table View Container */}
        <div className="block w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card shadow-card shrink-0">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100">Resource Blueprints</h3>
            <div className="flex items-center gap-2 relative">
              <button 
                onClick={handleCreate}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
              >
                <Plus size={14} /> Create Tier
              </button>
            </div>
          </div>
          
          {/* Toolbar */}
          <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex flex-wrap items-center gap-3">
            <div className="relative w-[300px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search tiers..."
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
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-theme sticky top-0 z-10">
                <tr>
                  <ResizableTh>Tier Name</ResizableTh>
                  <ResizableTh>CPU</ResizableTh>
                  <ResizableTh>RAM (GB)</ResizableTh>
                  <ResizableTh>Disk (GB)</ResizableTh>
                  <ResizableTh>Status</ResizableTh>
                  <ResizableTh>Created Date</ResizableTh>
                  <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider table-header-optimized border-b border-slate-100 dark:border-theme w-16">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredTiers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                      <Layers size={32} className="mx-auto mb-3 opacity-20" />
                      <p>No tiers found matching your criteria.</p>
                    </td>
                  </tr>
                ) : (
                  filteredTiers.map((tier) => (
                    <tr key={tier.id} className="table-row-optimized border-b border-slate-100 dark:border-theme last:border-0 group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20">
                            <Layers size={16} className="text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-800 dark:text-slate-200">{tier.name}</p>
                              {tier.type === 'Default' && (
                                <Shield size={12} className="text-slate-400" title="Default Tier" />
                              )}
                            </div>
                            <p className="text-[12px] text-slate-500 dark:text-slate-500 truncate max-w-[200px]" title={tier.description}>{tier.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                          <Cpu size={14} className="text-slate-400" />
                          {tier.cpu} vCPU
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                          <MemoryStick size={14} className="text-slate-400" />
                          {tier.ram} GB
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                          <HardDrive size={14} className="text-slate-400" />
                          {tier.disk} GB
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium ${
                          tier.status === 'Active' 
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'
                            : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {tier.status === 'Active' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {tier.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-[13px]">
                        {tier.createdDate}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <TableActionMenu
                          isOpen={activeMenuId === tier.id}
                          onToggle={(e) => openMenu(e, tier.id)}
                          dropdownPos={menuPosition}
                        >
                          <button 
                            onClick={() => { handleEdit(tier); setActiveMenuId(null); }}
                            className="w-full px-3 py-2 text-left text-[13px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            <Edit2 size={14} /> Edit Tier
                          </button>
                          <button 
                            onClick={() => { handleActionClick(tier.status === 'Active' ? 'Disable' : 'Enable', tier); setActiveMenuId(null); }}
                            className="w-full px-3 py-2 text-left text-[13px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            {tier.status === 'Active' ? (
                              <><XCircle size={14} className="text-amber-500" /> Disable Tier</>
                            ) : (
                              <><CheckCircle2 size={14} className="text-emerald-500" /> Enable Tier</>
                            )}
                          </button>
                          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                          <button 
                            onClick={() => { handleActionClick('Delete', tier); setActiveMenuId(null); }}
                            className="w-full px-3 py-2 text-left text-[13px] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2"
                          >
                            <Trash2 size={14} /> Delete Tier
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
      <TierForm 
        isOpen={isFormOpen} 
        onClose={() => closeForm()} 
        onSave={handleSave} 
        initialData={editingTier}
        title={formMode === 'create' ? "Create Tier" : "Edit Tier"}
        onChange={() => setHasUnsavedChanges(true)}
      />

      {/* Unified Action Modal */}
      {tierActionModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" 
            onClick={() => setTierActionModal({ isOpen: false, action: null, tier: null, isBlocking: false, blockReasons: [] })}
          />
          <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full max-w-[400px] overflow-hidden flex flex-col relative z-10 animate-in zoom-in-95 duration-200">
            <div className="p-5 flex flex-col gap-4">
              
              {tierActionModal.isBlocking ? (
                <>
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-1">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                    Cannot Delete Tier
                  </h3>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    This tier cannot be deleted due to the following reasons:<br/><br/>
                    {tierActionModal.blockReasons.map((reason, i) => (
                      <React.Fragment key={i}>
                        • {reason}<br/>
                      </React.Fragment>
                    ))}
                    <br/>
                    Please remove these dependencies before deleting this tier.
                  </div>
                  <div className="flex justify-end mt-2">
                    <button onClick={() => setTierActionModal({ isOpen: false, action: null, tier: null, isBlocking: false, blockReasons: [] })} className="px-4 py-2 text-[13px] font-medium bg-slate-100 dark:bg-surface text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors">Close</button>
                  </div>
                </>
              ) : (
                <>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${
                    tierActionModal.action === 'Delete' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500' :
                    tierActionModal.action === 'Enable' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' :
                    'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500'
                  }`}>
                    {tierActionModal.action === 'Delete' ? <Trash2 size={24} /> : tierActionModal.action === 'Enable' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                    {tierActionModal.action} Tier
                  </h3>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {tierActionModal.action === 'Delete' && 'This action cannot be undone.'}
                    {tierActionModal.action === 'Enable' && 'This will make the tier available for provisioning and environments.'}
                    {tierActionModal.action === 'Disable' && 'This will prevent new provisioning requests from using this tier.'}
                  </div>
                  <div className="bg-slate-50 dark:bg-surface p-3 rounded-card text-[12px] border border-gray-200 dark:border-theme">
                    <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Tier Blueprint:</div>
                    <div className="text-slate-500 dark:text-slate-400 font-mono">{tierActionModal.tier?.name} ({tierActionModal.tier?.cpu} vCPU, {tierActionModal.tier?.ram}GB RAM)</div>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Type the tier name to confirm:</label>
                    <input 
                      type="text" 
                      value={tierActionConfirmText}
                      onChange={(e) => setTierActionConfirmText(e.target.value)}
                      placeholder={`Type "${tierActionModal.tier?.name}"`}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors shadow-sm" 
                    />
                  </div>
                  <div className="p-4 bg-transparent dark:bg-transparent/50 border-t border-gray-100 dark:border-theme flex justify-end gap-3 mt-2 -mx-5 -mb-5">
                    <button onClick={() => setTierActionModal({ isOpen: false, action: null, tier: null, isBlocking: false, blockReasons: [] })} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-input transition-colors">
                      Cancel
                    </button>
                    <button 
                      onClick={handleConfirmAction} 
                      disabled={tierActionConfirmText !== tierActionModal.tier?.name}
                      className={`px-4 py-2 text-[13px] font-medium text-white rounded-input transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                        tierActionModal.action === 'Delete' ? 'bg-rose-600 hover:bg-rose-700' :
                        tierActionModal.action === 'Enable' ? 'bg-emerald-600 hover:bg-emerald-700' :
                        'bg-amber-600 hover:bg-amber-700'
                      }`}>
                      {tierActionModal.action} Tier
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
                <button onClick={confirmCloseForm} className="flex-1 px-4 py-2 text-[13px] font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-input transition-colors shadow-sm">Discard Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
