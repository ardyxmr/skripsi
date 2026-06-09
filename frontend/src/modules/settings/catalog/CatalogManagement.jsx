import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Grid, Search, Filter, Edit2, Trash2, XCircle, CheckCircle2, RefreshCw, Plus, AlertTriangle, Layers, Server } from 'lucide-react';
import TableActionMenu from '../../../components/common/TableActionMenu';
import ResizableTh from '../../../components/ResizableTh';
import CatalogForm from './CatalogForm';
import CatalogExplorer from './CatalogExplorer';
import { useProviderContext } from '../../../contexts/ProviderContext';
import { useCatalogContext } from '../../../contexts/CatalogContext';
import api from '../../../lib/api';

export default function CatalogManagement() {
  const { providers } = useProviderContext();
  const { catalogs, refetch, create, update, remove } = useCatalogContext();
  
  // Search & Filters
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogProviderFilter, setCatalogProviderFilter] = useState('All Providers');
  const [catalogEnvironmentFilter, setCatalogEnvironmentFilter] = useState('All Environments');
  const [catalogStatusFilter, setCatalogStatusFilter] = useState('All Status');
  const [catalogSortConfig, setCatalogSortConfig] = useState({ key: 'name', direction: 'asc' });
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
  
  const [catalogToastMsg, setCatalogToastMsg] = useState('');

  const showCatalogToast = (msg) => {
    setCatalogToastMsg(msg);
    setTimeout(() => setCatalogToastMsg(''), 3000);
  };

  const handleRefreshCatalogs = async () => {
    if (isRefreshingCatalog) return;
    setIsRefreshingCatalog(true);
    try {
      await refetch();
      showCatalogToast('Catalog data refreshed successfully.');
    } catch (e) {
      showCatalogToast(e.message || 'Refresh failed.');
    } finally {
      setIsRefreshingCatalog(false);
    }
  };

  const handleCatalogSort = (key) => {
    let direction = 'asc';
    if (catalogSortConfig.key === key && catalogSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setCatalogSortConfig({ key, direction });
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
      showCatalogToast(err.message || 'Save failed.');
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
      showCatalogToast(e.message || 'Action failed.');
    }
    setCatalogActionModal({ isOpen: false, action: null, catalog: null, isBlocking: false });
  };

  const filteredCatalogs = catalogs.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(catalogSearch.toLowerCase()) || 
                          (c.description && c.description.toLowerCase().includes(catalogSearch.toLowerCase())) ||
                          c.provider.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                          c.template.toLowerCase().includes(catalogSearch.toLowerCase());
    
    const matchesProvider = catalogProviderFilter === 'All Providers' || c.provider === catalogProviderFilter;
    const matchesEnvironment = catalogEnvironmentFilter === 'All Environments' || (c.environments && c.environments.includes(catalogEnvironmentFilter));
    const matchesStatus = catalogStatusFilter === 'All Status' || c.status === catalogStatusFilter;

    return matchesSearch && matchesProvider && matchesEnvironment && matchesStatus;
  });

  const sortedCatalogs = [...filteredCatalogs].sort((a, b) => {
    const key = catalogSortConfig.key;
    const direction = catalogSortConfig.direction === 'asc' ? 1 : -1;
    
    if (key === 'lastUpdated') {
      return (new Date(a[key]) - new Date(b[key])) * direction;
    }
    
    return String(a[key]).localeCompare(String(b[key])) * direction;
  });

  return (
    <div className="flex flex-col gap-6 h-full animate-in slide-in-from-right-8 fade-in duration-300 fill-mode-both items-start w-full">
      {/* Stats Row */}
      <div className="shrink-0 w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card p-4 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Catalog Management Statistics</h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Overview of catalog configurations and linked templates.</p>
          </div>
          <div className="flex gap-4">
              <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{catalogs.length}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Published Catalogs</div>
              </div>
              <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{catalogs.filter(c => c.status !== 'Offline / Missing').length}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Active</div>
              </div>
              <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{catalogs.filter(c => c.status === 'Offline / Missing').length}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Offline / Missing</div>
              </div>
            <div className="text-center px-4 border-r border-slate-200 dark:border-theme">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{new Set(catalogs.map(c => c.template)).size}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Templates Linked</div>
            </div>
            <div className="text-center pl-4">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{new Set(catalogs.map(c => c.provider)).size}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Providers Used</div>
            </div>
          </div>
        </div>

        {/* Scrollable Container for Tables Only */}
        <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col gap-6 pr-1 pb-1">
          {/* Catalog Overview Table */}
          <div className="block w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card shadow-card shrink-0">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100">Catalog Overview</h3>
            <div className="flex items-center gap-2 relative">
              <button 
                onClick={handleRefreshCatalogs}
                disabled={isRefreshingCatalog}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md disabled:opacity-50"
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
              
              {/* Sync Toast Notification */}
              {catalogToastMsg && (
                <div className="absolute top-full right-0 mt-3 z-50 animate-in slide-in-from-top-2 fade-in duration-300 pointer-events-none">
                  <div className="bg-slate-800 dark:bg-slate-700 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2.5 text-sm font-medium whitespace-nowrap">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    {catalogToastMsg}
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
              value={catalogEnvironmentFilter}
              onChange={e => setCatalogEnvironmentFilter(e.target.value)}
              className="bg-white dark:bg-surface border border-gray-200 dark:border-theme text-gray-700 dark:text-gray-200 text-[13px] font-medium rounded-lg px-3 py-2 outline-none cursor-pointer min-w-[140px]"
            >
              <option value="All Environments">All Environments</option>
              <option value="Production">Production</option>
              <option value="Development">Development</option>
              <option value="Staging">Staging</option>
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
          
          <div className="w-full overflow-x-auto overflow-y-visible">
            {catalogs.length === 0 ? (
              <div className="w-full py-16 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <Grid size={48} className="mb-4 opacity-20" />
                <h4 className="text-[15px] font-bold text-gray-800 dark:text-gray-200 mb-1">No Catalogs Found</h4>
                <p className="text-[13px] mb-4 text-center max-w-sm">Create a catalog mapping to start provisioning virtual machines.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
                <thead className="sticky top-0 z-20 shadow-sm">
                  <tr>
                    <ResizableTh width={220} storageKey="catalog_management_column_widths" columnKey="name" onClick={() => handleCatalogSort('name')}>
                      Catalog Name {catalogSortConfig.key === 'name' ? (catalogSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </ResizableTh>
                    <ResizableTh width={160} storageKey="catalog_management_column_widths" columnKey="provider" onClick={() => handleCatalogSort('provider')}>
                      Provider {catalogSortConfig.key === 'provider' ? (catalogSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </ResizableTh>
                    <ResizableTh width={180} storageKey="catalog_management_column_widths" columnKey="template" onClick={() => handleCatalogSort('template')}>
                      Source Template {catalogSortConfig.key === 'template' ? (catalogSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </ResizableTh>
                    <ResizableTh width={180} storageKey="catalog_management_column_widths" columnKey="environment">
                      Environments
                    </ResizableTh>
                    <ResizableTh width={140} storageKey="catalog_management_column_widths" columnKey="tiers">
                      Tiers
                    </ResizableTh>
                    <ResizableTh width={100} storageKey="catalog_management_column_widths" columnKey="activeVMs">
                      Usage
                    </ResizableTh>
                    <ResizableTh width={100} storageKey="catalog_management_column_widths" columnKey="status">
                      Status
                    </ResizableTh>
                    <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider table-header-optimized border-b border-slate-100 dark:border-theme w-16">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCatalogs.map((catalog) => (
                    <tr key={catalog.id} className="table-row-optimized border-b border-slate-100 dark:border-theme last:border-0 group">
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200 text-[13px] hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" onClick={() => setCatalogDrawer({ isOpen: true, catalog })}>
                          {catalog.name}
                        </div>
                        {catalog.description && <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{catalog.description}</div>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-slate-800 dark:text-slate-200 font-medium text-[13px]">{catalog.provider}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-slate-600 dark:text-slate-300 text-[13px]">{catalog.template}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {catalog.environments?.map(env => (
                            <span key={env} className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded border ${
                              env === 'Production' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20' :
                              env === 'Development' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' :
                              'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                            }`}>
                              {env}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {catalog.tiers?.map(tier => (
                            <span key={tier} className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded border bg-slate-50 dark:bg-surface text-slate-600 dark:text-slate-400 border-slate-200 dark:border-theme">
                              {tier}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-[12px]">
                          <Server size={12} className="text-slate-400" />
                          <span className="font-medium">{catalog.activeVMs || 0}</span> VMs
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border ${
                          catalog.status === 'Active' 
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' 
                            : catalog.status === 'Offline / Missing'
                            ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                            : 'bg-slate-100 dark:bg-surface text-slate-600 dark:text-slate-400 border-slate-200 dark:border-theme'
                        }`}>
                          {catalog.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <TableActionMenu
                          isOpen={openDropdownId === `catalog-${catalog.id}`}
                          onToggle={(e) => handleDropdownClick(e, `catalog-${catalog.id}`)}
                          dropdownPos={dropdownPos}
                        >
                          <button onClick={() => { setOpenDropdownId(null); openModal('catalog', 'edit', catalog); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                            <Edit2 size={14}/> Edit Catalog
                          </button>
                          <button onClick={() => { setOpenDropdownId(null); setCatalogDrawer({ isOpen: true, catalog }); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400">
                            <Layers size={14}/> Catalog Explorer
                          </button>
                          <button onClick={() => { setOpenDropdownId(null); handleCatalogActionClick(catalog.status === 'Active' ? 'Disable' : 'Enable', catalog); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                            {catalog.status === 'Active' ? <XCircle size={14} className="text-amber-500"/> : <CheckCircle2 size={14} className="text-emerald-500"/>} 
                            {catalog.status === 'Active' ? 'Disable Catalog' : 'Enable Catalog'}
                          </button>
                          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                          <button onClick={() => { setOpenDropdownId(null); handleCatalogActionClick('Delete', catalog); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            <Trash2 size={14}/> Delete Catalog
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
              Showing {catalogs.length > 0 ? 1 : 0}–{catalogs.length} of {catalogs.length} Catalogs
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

      {catalogActionModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full max-w-[400px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 flex flex-col gap-4">
              
              {catalogActionModal.isBlocking ? (
                <>
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-1">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                    Cannot Delete Catalog
                  </h3>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    This catalog is currently being used by active resources.<br/><br/>
                    The catalog cannot be deleted while it is referenced by:<br/>
                    • VM Requests<br/>
                    • Active Deployments<br/><br/>
                    Catalog masih digunakan oleh deployment aktif.<br/><br/>
                    Pindahkan atau hapus deployment terkait sebelum menghapus Catalog.
                  </div>
                  <div className="flex justify-end mt-2">
                    <button onClick={() => setCatalogActionModal({ isOpen: false, action: null, catalog: null, isBlocking: false })} className="px-4 py-2 text-[13px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-md transition-colors">Close</button>
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
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                    {catalogActionModal.action} Catalog
                  </h3>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {catalogActionModal.action === 'Delete' && 'This action cannot be undone.'}
                    {catalogActionModal.action === 'Enable' && 'This will make the catalog available for provisioning.'}
                    {catalogActionModal.action === 'Disable' && 'This will prevent new provisioning requests from using this catalog.'}
                  </div>
                  <div className="bg-slate-50 dark:bg-surface p-3 rounded-card text-[12px] border border-gray-200 dark:border-theme">
                    <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Catalog:</div>
                    <div className="text-slate-500 dark:text-slate-400 font-mono">{catalogActionModal.catalog?.name}</div>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Type the catalog name to confirm:</label>
                    <input 
                      type="text" 
                      value={catalogActionConfirmText}
                      onChange={(e) => setCatalogActionConfirmText(e.target.value)}
                      placeholder={`Type "${catalogActionModal.catalog?.name}"`}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors shadow-sm" 
                    />
                  </div>
                  <div className="p-4 bg-transparent dark:bg-transparent/50 border-t border-slate-100 dark:border-theme flex justify-end gap-3 mt-2 -mx-5 -mb-5">
                    <button onClick={() => setCatalogActionModal({ isOpen: false, action: null, catalog: null, isBlocking: false })} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-input transition-colors">
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
