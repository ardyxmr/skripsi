import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Grid, Search, Filter, Edit2, Trash2, XCircle, CheckCircle2, RefreshCw, Plus, AlertTriangle, Layers, Server, Shield } from 'lucide-react';
import TableActionMenu from '../../../components/common/TableActionMenu';
import DataTable from '../../../components/common/DataTable';
import CatalogForm from './CatalogForm';
import CatalogExplorer from './CatalogExplorer';
import { useProviderContext } from '../../../contexts/ProviderContext';
import { useCatalogContext } from '../../../contexts/CatalogContext';
import api from '../../../lib/api';
import StatusPill from '../../../components/common/StatusPill';
import { isOffline } from '../../../lib/resourceStatus';
import { useDebouncedValue } from '../../../lib/useDebouncedValue';
import { useUI } from '../../../stores/uiStore';
import { ensureMinDuration } from '../../../lib/minDuration';
import { LIVE_CACHE_EVENT } from '../../../lib/liveCache';

export default function CatalogManagement() {
  const { providers } = useProviderContext();
  const { catalogs, loading, refetch, create, update, remove } = useCatalogContext();
  // All notifications use the global, always-on-top top-center toast (consistent everywhere).
  const pushToast = useUI((s) => s.pushToast);
  const dismissToast = useUI((s) => s.dismissToast);
  
  // Search & Filters
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogProviderFilter, setCatalogProviderFilter] = useState('All Providers');
  const [catalogStatusFilter, setCatalogStatusFilter] = useState('All Status');
  const [isRefreshingCatalog, setIsRefreshingCatalog] = useState(false);

  // Actions & Modals
  const [catalogActionModal, setCatalogActionModal] = useState({ isOpen: false, action: null, catalog: null, isBlocking: false });
  const [catalogActionConfirmText, setCatalogActionConfirmText] = useState('');
  const [catalogDrawer, setCatalogDrawer] = useState({ isOpen: false, catalog: null });
  
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
  // LIVE_CACHE_EVENT when VMs are created or deleted. Re-pull catalogs on that event so the Usage column
  // updates on its own (server recomputes active_vms), no manual refresh needed.
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
  const showCatalogToast = (msg) => pushToast({ kind: 'success', message: msg });

  const handleRefreshCatalogs = async () => {
    if (isRefreshingCatalog) return;
    setIsRefreshingCatalog(true);
    const start = Date.now();
    const tid = crypto.randomUUID();
    pushToast({ id: tid, kind: 'loading', message: 'Refreshing catalog data…' });
    try {
      await refetch();
      dismissToast(tid);
      showCatalogToast('Catalog data refreshed successfully.');
    } catch (e) {
      dismissToast(tid);
      pushToast({ kind: 'error', message: e.message || 'Refresh failed.' });
    } finally {
      // Let the icon complete at least one full spin even on a cache-fast refetch.
      await ensureMinDuration(start);
      setIsRefreshingCatalog(false);
    }
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



  const handleAddEditCatalogSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const imageFile = formData.get('catalogImage');
    const hasNewImage = imageFile && typeof imageFile === 'object' && imageFile.size > 0;

    // Submit business IDs only; the backend resolves names + node (ADR-05).
    const payload = {
      catalogName: formData.get('catalogName'),
      catalogDescription: formData.get('catalogDescription'),
      providerId: Number(formData.get('providerId')) || null,
      providerTemplateId: Number(formData.get('providerTemplateId')) || null,
      status: formData.get('status'),
    };

    try {
      let catalogId = modal.data?.id;
      if (modal.mode === 'edit') {
        await update(modal.data.id, payload);
        showCatalogToast(`Catalog "${payload.catalogName}" updated successfully.`);
      } else {
        const created = await create(payload);
        catalogId = created?.id ?? catalogId;
        showCatalogToast(`Catalog "${payload.catalogName}" created successfully.`);
      }

      // Upload the image (multipart) after the catalog exists.
      if (hasNewImage && catalogId) {
        const fd = new FormData();
        fd.append('image', imageFile);
        await api.raw.post(`/catalogs/${catalogId}/image`, fd);
        await refetch();
      }
      closeModal(true);
    } catch (err) {
      pushToast({ kind: 'error', message: err.message || 'Save failed.' });
    }
  };

  const handleCatalogActionClick = (action, catalog) => {
    if (action === 'Delete' && catalog.activeVMs > 0) {
      setCatalogActionModal({ isOpen: true, action: 'Delete', catalog, isBlocking: true });
    } else {
      setCatalogActionModal({ isOpen: true, action, catalog, isBlocking: false });
      setCatalogActionConfirmText('');
    }
  };

  const handleConfirmCatalogAction = async () => {
    const target = catalogActionModal.catalog;
    try {
      if (catalogActionModal.action === 'Delete') {
        await remove(target.id);
        showCatalogToast(`Catalog "${target.name}" deleted successfully.`);
      } else if (catalogActionModal.action === 'Enable' || catalogActionModal.action === 'Disable') {
        const status = catalogActionModal.action === 'Enable' ? 'Active' : 'Disabled';
        await update(target.id, { status });
        showCatalogToast(`Catalog "${target.name}" ${catalogActionModal.action === 'Enable' ? 'enabled' : 'disabled'} successfully.`);
      }
    } catch (e) {
      pushToast({ kind: 'error', message: e.message || 'Action failed.' });
    }
    setCatalogActionModal({ isOpen: false, action: null, catalog: null, isBlocking: false });
  };

  const debouncedSearch = useDebouncedValue(catalogSearch, 250);
  const filteredCatalogs = catalogs.filter(c => {
    const q = debouncedSearch.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(q) ||
                          (c.description && c.description.toLowerCase().includes(q)) ||
                          c.provider.toLowerCase().includes(q) ||
                          c.template.toLowerCase().includes(q);
    
    const matchesProvider = catalogProviderFilter === 'All Providers' || c.provider === catalogProviderFilter;
    const matchesStatus = catalogStatusFilter === 'All Status'
      || (catalogStatusFilter === 'Offline / Missing' ? isOffline(c.status) : c.status === catalogStatusFilter);

    return matchesSearch && matchesProvider && matchesStatus;
  });

  // Column defs for the shared <DataTable>: `weight` = fit-mode share of the width, `render` = cell.
  const catalogColumns = [
    { key: 'name', header: 'Catalog Name', weight: 2.2, sortable: true, sortAccessor: (c) => (c.name || '').toLowerCase(),
      headerClassName: 'px-5 py-3', cellClassName: 'px-5 py-3',
      render: (catalog) => (
        <>
          <div className="font-medium text-slate-800 dark:text-zinc-200 text-[13px] hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" onClick={() => setCatalogDrawer({ isOpen: true, catalog })}>
            {catalog.name}
          </div>
          {catalog.description && <div className="text-[12px] text-slate-500 dark:text-zinc-400 mt-0.5">{catalog.description}</div>}
        </>
      ) },
    { key: 'provider', header: 'Provider', weight: 1.6, sortable: true, sortAccessor: (c) => (c.provider || '').toLowerCase(),
      headerClassName: 'px-5 py-3', cellClassName: 'px-5 py-3',
      render: (c) => <div className="text-slate-800 dark:text-zinc-200 font-medium text-[13px]">{c.provider}</div> },
    { key: 'node', header: 'Node', weight: 1.4, sortable: true, sortAccessor: (c) => (c.node || '').toLowerCase(),
      headerClassName: 'px-5 py-3', cellClassName: 'px-5 py-3',
      render: (c) => <div className="text-slate-600 dark:text-zinc-300 text-[13px]">{c.node || '—'}</div> },
    { key: 'template', header: 'Source Template', weight: 1.8, sortable: true, sortAccessor: (c) => (c.template || '').toLowerCase(),
      headerClassName: 'px-5 py-3', cellClassName: 'px-5 py-3',
      render: (c) => <div className="text-slate-600 dark:text-zinc-300 text-[13px]">{c.template}</div> },
    { key: 'usage', header: 'Usage', weight: 1.0, headerClassName: 'px-5 py-3', cellClassName: 'px-5 py-3',
      render: (c) => (
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300 text-[12px]">
          <Server size={12} className="text-slate-400" />
          <span className="font-medium">{c.activeVMs || 0}</span> VMs
        </div>
      ) },
    { key: 'harden', header: 'Harden / Patch', weight: 1.3, headerClassName: 'px-5 py-3', cellClassName: 'px-5 py-3',
      render: (c) => c.hardeningVersionCount > 0 ? (
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-teal-700 dark:text-teal-400">
          <Shield size={13} /> {c.hardeningVersionCount} version{c.hardeningVersionCount > 1 ? 's' : ''}
        </span>
      ) : (
        <span className="text-[12px] text-slate-400 dark:text-zinc-500">—</span>
      ) },
    { key: 'status', header: 'Status', weight: 1.0, headerClassName: 'px-5 py-3', cellClassName: 'px-5 py-3',
      render: (c) => <StatusPill status={c.status} label={c.status} variant="soft" shape="full" size="sm" weight="font-medium" pad="px-2 py-0.5" /> },
    { key: 'action', header: 'Action', weight: 0.7, align: 'center', resizable: false, headerClassName: 'px-5 py-3', cellClassName: 'px-5 py-3',
      render: (catalog) => (
        <TableActionMenu
          isOpen={openDropdownId === `catalog-${catalog.id}`}
          onToggle={(e) => handleDropdownClick(e, `catalog-${catalog.id}`)}
          dropdownPos={dropdownPos}
        >
          <button onClick={() => { setOpenDropdownId(null); openModal('catalog', 'edit', catalog); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200">
            <Edit2 size={14}/> Edit Catalog
          </button>
          <button onClick={() => { setOpenDropdownId(null); setCatalogDrawer({ isOpen: true, catalog }); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-700 text-blue-600 dark:text-blue-400">
            <Layers size={14}/> Catalog Explorer
          </button>
          <button disabled={isOffline(catalog.status)} title={isOffline(catalog.status) ? 'Provider offline — reconnect the provider first' : undefined} onClick={() => { if (isOffline(catalog.status)) return; setOpenDropdownId(null); handleCatalogActionClick(catalog.status === 'Active' ? 'Disable' : 'Enable', catalog); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent">
            {catalog.status === 'Active' ? <XCircle size={14} className="text-amber-500"/> : <CheckCircle2 size={14} className="text-emerald-500"/>}
            {catalog.status === 'Active' ? 'Disable Catalog' : 'Enable Catalog'}
          </button>
          <div className="h-px bg-slate-100 dark:bg-zinc-700 my-1"></div>
          <button onClick={() => { setOpenDropdownId(null); handleCatalogActionClick('Delete', catalog); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Trash2 size={14}/> Delete Catalog
          </button>
        </TableActionMenu>
      ) },
  ];

  return (
    <div className="flex flex-col gap-6 h-full animate-in slide-in-from-right-8 fade-in duration-300 fill-mode-both items-start w-full">
      {/* Stats Row */}
      <div className="shrink-0 w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card p-4 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Catalog Management Statistics</h1>
            <p className="text-[13px] text-slate-500 dark:text-zinc-400 mt-1">Overview of catalog configurations and linked templates.</p>
          </div>
          <div className="flex gap-4">
              <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                <div className="text-2xl font-bold text-slate-800 dark:text-zinc-200">{catalogs.length}</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Published Catalogs</div>
              </div>
              <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{catalogs.filter(c => !isOffline(c.status)).length}</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Active</div>
              </div>
              <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{catalogs.filter(c => isOffline(c.status)).length}</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Offline / Missing</div>
              </div>
            <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{new Set(catalogs.map(c => c.template)).size}</div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Templates Linked</div>
            </div>
            <div className="text-center pl-4">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{new Set(catalogs.map(c => c.provider)).size}</div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-medium">Providers Used</div>
            </div>
          </div>
        </div>

        {/* Scrollable Container for Tables Only */}
        <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col gap-6 pr-1 pb-1">
          {/* Catalog Overview Table */}
          <div className="flex flex-col w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card shadow-card min-h-0">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex items-center justify-between shrink-0">
            <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100">Catalog Overview</h3>
            <div className="flex items-center gap-2 relative">
              <button 
                onClick={handleRefreshCatalogs}
                disabled={isRefreshingCatalog}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-md disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw size={16} className={isRefreshingCatalog ? 'animate-spin' : ''} />
              </button>
              <button 
                onClick={() => openModal('catalog', 'add')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
              >
                <Plus size={14} /> Add Catalog
              </button>
            </div>
          </div>
          
          <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex items-center gap-3 shrink-0">
            <div className="relative w-[300px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Catalog..."
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-surface border border-gray-200 dark:border-theme rounded-lg text-[13px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:text-gray-100"
              />
            </div>
            <select 
              value={catalogProviderFilter}
              onChange={e => setCatalogProviderFilter(e.target.value)}
              className="bg-white dark:bg-surface border border-gray-200 dark:border-theme text-gray-700 dark:text-gray-200 text-[13px] font-medium rounded-lg px-3 py-2 outline-none cursor-pointer min-w-[140px]"
            >
              <option value="All Providers">All Providers</option>
              {Array.from(new Set(catalogs.map(c => c.provider))).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              value={catalogStatusFilter}
              onChange={e => setCatalogStatusFilter(e.target.value)}
              className="bg-white dark:bg-surface border border-gray-200 dark:border-theme text-gray-700 dark:text-gray-200 text-[13px] font-medium rounded-lg px-3 py-2 outline-none cursor-pointer min-w-[140px]"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
              <option value="Offline / Missing">Offline / Missing</option>
            </select>
          </div>
          
          <DataTable
            columns={catalogColumns}
            rows={filteredCatalogs}
            rowKey={(c) => c.id}
            rowClassName={(c) => (isOffline(c.status) ? 'opacity-60' : '')}
            noun="Catalogs"
            loading={loading}
            defaultSort={{ key: 'name', dir: 'asc' }}
            emptyState={{
              icon: Grid,
              title: 'No Catalogs Found',
              message: 'Create a catalog mapping to start provisioning virtual machines.',
            }}
          />
        </div>
      </div>

      {catalogActionModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full max-w-[400px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 flex flex-col gap-4">
              
              {catalogActionModal.isBlocking ? (
                <>
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-1">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-zinc-100 leading-tight">
                    Cannot Delete Catalog
                  </h3>
                  <div className="text-sm text-slate-600 dark:text-zinc-400">
                    This catalog is currently being used by active resources.<br/><br/>
                    The catalog cannot be deleted while it is referenced by:<br/>
                    • VM Requests<br/>
                    • Active Deployments<br/><br/>
                    Catalog masih digunakan oleh deployment aktif.<br/><br/>
                    Pindahkan atau hapus deployment terkait sebelum menghapus Catalog.
                  </div>
                  <div className="flex justify-end mt-2">
                    <button onClick={() => setCatalogActionModal({ isOpen: false, action: null, catalog: null, isBlocking: false })} className="px-4 py-2 text-[13px] font-medium bg-slate-100 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700/80 rounded-md transition-colors">Close</button>
                  </div>
                </>
              ) : (
                <>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${
                    catalogActionModal.action === 'Delete' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500' :
                    catalogActionModal.action === 'Enable' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' :
                    'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500'
                  }`}>
                    {catalogActionModal.action === 'Delete' ? <Trash2 size={24} /> : catalogActionModal.action === 'Enable' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-zinc-100 leading-tight">
                    {catalogActionModal.action} Catalog
                  </h3>
                  <div className="text-sm text-slate-600 dark:text-zinc-400">
                    {catalogActionModal.action === 'Delete' && 'This action cannot be undone.'}
                    {catalogActionModal.action === 'Enable' && 'This will make the catalog available for provisioning.'}
                    {catalogActionModal.action === 'Disable' && 'This will prevent new provisioning requests from using this catalog.'}
                  </div>
                  <div className="bg-slate-50 dark:bg-surface p-3 rounded-card text-[12px] border border-gray-200 dark:border-theme">
                    <div className="font-semibold text-slate-700 dark:text-zinc-300 mb-1">Catalog:</div>
                    <div className="text-slate-500 dark:text-zinc-400 font-mono">{catalogActionModal.catalog?.name}</div>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Type the catalog name to confirm:</label>
                    <input 
                      type="text" 
                      value={catalogActionConfirmText}
                      onChange={(e) => setCatalogActionConfirmText(e.target.value)}
                      placeholder={`Type "${catalogActionModal.catalog?.name}"`}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors shadow-sm" 
                    />
                  </div>
                  <div className="p-4 bg-transparent dark:bg-transparent/50 border-t border-slate-100 dark:border-theme flex justify-end gap-3 mt-2 -mx-5 -mb-5">
                    <button onClick={() => setCatalogActionModal({ isOpen: false, action: null, catalog: null, isBlocking: false })} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-input transition-colors">
                      Cancel
                    </button>
                    <button 
                      onClick={handleConfirmCatalogAction} 
                      disabled={catalogActionConfirmText !== catalogActionModal.catalog?.name}
                      className={`px-4 py-2 text-[13px] font-medium text-white rounded-input transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                        catalogActionModal.action === 'Delete' ? 'bg-rose-600 hover:bg-rose-700' :
                        catalogActionModal.action === 'Enable' ? 'bg-emerald-600 hover:bg-emerald-700' :
                        'bg-amber-600 hover:bg-amber-700'
                      }`}>
                      {catalogActionModal.action} Catalog
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <CatalogForm 
        modal={modal} 
        setModal={closeModal} 
        handleAddEditCatalogSubmit={handleAddEditCatalogSubmit} 
        providers={providers}
        onChange={() => setHasUnsavedChanges(true)}
      />
      
      <CatalogExplorer 
        catalogDrawer={catalogDrawer} 
        setCatalogDrawer={setCatalogDrawer} 
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
