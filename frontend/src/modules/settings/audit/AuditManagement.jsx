import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FileText, Search, Filter, Calendar, Download, X, AlertCircle } from 'lucide-react';
import ResizableTh from '../../../components/ResizableTh';

const MOCK_AUDIT_LOGS = [
  { id: 1001, user_id: 1, user_name: "admin", action_type: "APPROVE_RENEWAL", target_resource: "VM-App-Prod", status: "SUCCESS", description: "Approved renewal for VM-App-Prod", created_at: "2026-06-06T19:00:00Z" },
  { id: 1002, user_id: 2, user_name: "johndoe", action_type: "REQUEST_RENEWAL", target_resource: "VM-App-Prod", status: "SUCCESS", description: "Requested renewal for VM-App-Prod", created_at: "2026-06-06T18:45:00Z" },
  { id: 1003, user_id: 4, user_name: "system", action_type: "RETRY_PROVISIONING", target_resource: "VM-DB-02", status: "FAILED", description: "Retried provisioning for VM-DB-02", created_at: "2026-06-06T18:20:00Z" },
  { id: 1004, user_id: 3, user_name: "janedoe", action_type: "CREATE_USER", target_resource: "developer_01", status: "SUCCESS", description: "Created new user 'developer_01'", created_at: "2026-06-06T16:00:00Z" },
  { id: 1005, user_id: 1, user_name: "admin", action_type: "DELETE_VM", target_resource: "VM-Test-05", status: "SUCCESS", description: "Deleted legacy VM-Test-05", created_at: "2026-06-06T15:15:00Z" },
  { id: 1006, user_id: 2, user_name: "johndoe", action_type: "APPROVE_VM", target_resource: "VM-Dev-01", status: "SUCCESS", description: "Approved provision for VM-Dev-01", created_at: "2026-06-05T17:30:00Z" },
  { id: 1007, user_id: 1, user_name: "admin", action_type: "CREATE_VM", target_resource: "VM-Dev-01", status: "PENDING", description: "Requested provision for VM-Dev-01", created_at: "2026-06-05T17:00:00Z" },
  { id: 1008, user_id: 4, user_name: "system", action_type: "SYNC_DATASTORE", target_resource: "DS-Cluster-01", status: "SUCCESS", description: "Automated datastore synchronization completed", created_at: "2026-06-05T14:00:00Z" },
  { id: 1009, user_id: 3, user_name: "janedoe", action_type: "EDIT_NETWORK", target_resource: "VLAN-200", status: "SUCCESS", description: "Updated VLAN-200 description", created_at: "2026-06-05T10:15:00Z" },
];

export default function AuditManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All Actions');

  // Download State
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadDates, setDownloadDates] = useState({ start: '', end: '' });
  
  // Discard Confirmation State & Refs
  const [discardConfirmTarget, setDiscardConfirmTarget] = useState(false);
  const downloadModalOpenRef = useRef(false);
  const isDirtyRef = useRef(false);
  const discardConfirmRef = useRef(false);

  useEffect(() => {
    discardConfirmRef.current = discardConfirmTarget;
  }, [discardConfirmTarget]);

  useEffect(() => {
    downloadModalOpenRef.current = downloadModalOpen;
    if (downloadModalOpen) {
      isDirtyRef.current = downloadDates.start !== '' || downloadDates.end !== '';
    } else {
      isDirtyRef.current = false;
    }
  });

  const handleCancelModal = () => {
    if (downloadModalOpenRef.current && isDirtyRef.current) {
      setDiscardConfirmTarget(true);
    } else {
      setDownloadModalOpen(false);
      setDownloadDates({ start: '', end: '' });
    }
  };

  // Handle ESC key to close all popups
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (discardConfirmRef.current) {
          setDiscardConfirmTarget(false);
          return;
        }

        if (downloadModalOpenRef.current && isDirtyRef.current) {
          setDiscardConfirmTarget(true);
          return;
        }

        setDownloadModalOpen(false);
        setDownloadDates({ start: '', end: '' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Resize State
  const [colWidths, setColWidths] = useState({});
  const handleResizeStart = (e, colKey) => {
    e.preventDefault();
    const startX = e.pageX;
    const startWidth = colWidths[colKey] || e.target.parentElement.offsetWidth;
    const handleMouseMove = (moveEvent) => {
      const newWidth = Math.max(80, startWidth + (moveEvent.pageX - startX));
      setColWidths(prev => ({ ...prev, [colKey]: newWidth }));
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const actionTypes = useMemo(() => {
    const types = new Set(MOCK_AUDIT_LOGS.map(log => log.action_type));
    return ['All Actions', ...Array.from(types).sort()];
  }, []);

  const filteredLogs = useMemo(() => {
    let filtered = MOCK_AUDIT_LOGS;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.user_name.toLowerCase().includes(query) ||
        log.description.toLowerCase().includes(query) ||
        log.target_resource.toLowerCase().includes(query)
      );
    }
    
    if (actionFilter !== 'All Actions') {
      filtered = filtered.filter(log => log.action_type === actionFilter);
    }
    
    // Sort by Date Descending
    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [searchQuery, actionFilter]);

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(d);
  };

  const getActionColor = (action) => {
    if (action.includes('APPROVE') || action.includes('CREATE')) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
    if (action.includes('REJECT') || action.includes('DELETE')) return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20';
    if (action.includes('REQUEST') || action.includes('RETRY')) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
    return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
  };

  const handleDownloadSubmit = () => {
    if (!downloadDates.start || !downloadDates.end) return;
    
    const start = new Date(downloadDates.start);
    const end = new Date(downloadDates.end);
    end.setHours(23, 59, 59, 999);

    const logsToDownload = filteredLogs.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate >= start && logDate <= end;
    });

    if (logsToDownload.length === 0) {
      alert("No logs found in this date range.");
      return;
    }

    const headers = ["ID", "User ID", "Username", "Action Type", "Target Resource", "Status", "Description", "Created At"];
    const csvContent = [
      headers.join(","),
      ...logsToDownload.map(log => 
        [log.id, log.user_id, log.user_name, log.action_type, log.target_resource, log.status, `"${log.description}"`, log.created_at].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_trail_${downloadDates.start}_to_${downloadDates.end}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadModalOpen(false);
    setDownloadDates({ start: '', end: '' });
  };

  return (
    <div className="flex flex-col gap-6 h-full animate-in slide-in-from-right-8 fade-in duration-300 fill-mode-both items-start w-full">
      {/* Header Summary */}
      <div className="shrink-0 w-full bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card p-4 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Audit Trail</h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Track and trace system-wide user actions and workflows.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex flex-col items-end">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] uppercase font-semibold tracking-wider">Total Records</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{filteredLogs.length}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-card shadow-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-theme flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search user, resource, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[13px] border border-gray-200 dark:border-theme rounded-input bg-white dark:bg-surface text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-opacity"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="pl-8 pr-8 py-2 text-[13px] border border-gray-200 dark:border-theme rounded-input bg-white dark:bg-surface text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 appearance-none font-medium cursor-pointer"
              >
                {actionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => setDownloadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-[13px] font-medium rounded-input transition-opacity shadow-sm shadow-indigo-500/20"
            >
              <Download size={14} /> Download
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-sm z-10 shadow-sm">
              <tr>
                <ResizableTh width={colWidths.time} onResize={(e) => handleResizeStart(e, 'time')} className="px-4 py-3 text-[12px] font-bold text-slate-600 dark:text-slate-300 border-b border-gray-200 dark:border-theme">
                  Date / Time
                </ResizableTh>
                <ResizableTh width={colWidths.user} onResize={(e) => handleResizeStart(e, 'user')} className="px-4 py-3 text-[12px] font-bold text-slate-600 dark:text-slate-300 border-b border-gray-200 dark:border-theme">
                  User
                </ResizableTh>
                <ResizableTh width={colWidths.action} onResize={(e) => handleResizeStart(e, 'action')} className="px-4 py-3 text-[12px] font-bold text-slate-600 dark:text-slate-300 border-b border-gray-200 dark:border-theme">
                  Action Type
                </ResizableTh>
                <ResizableTh width={colWidths.target} onResize={(e) => handleResizeStart(e, 'target')} className="px-4 py-3 text-[12px] font-bold text-slate-600 dark:text-slate-300 border-b border-gray-200 dark:border-theme">
                  Target Resource
                </ResizableTh>
                <ResizableTh width={colWidths.status} onResize={(e) => handleResizeStart(e, 'status')} className="px-4 py-3 text-[12px] font-bold text-slate-600 dark:text-slate-300 border-b border-gray-200 dark:border-theme">
                  Status
                </ResizableTh>
                <ResizableTh width={colWidths.description} onResize={(e) => handleResizeStart(e, 'description')} className="px-4 py-3 text-[12px] font-bold text-slate-600 dark:text-slate-300 border-b border-gray-200 dark:border-theme">
                  Description
                </ResizableTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-theme">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-opacity group">
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2 text-[13px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        <Calendar size={13} className="text-slate-400" />
                        {formatDate(log.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{log.user_name}</span>
                        <span className="text-[11px] text-slate-500 font-mono mt-0.5">ID: {log.user_id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-flex items-center px-2 py-1 text-[11px] font-bold rounded border ${getActionColor(log.action_type)} whitespace-nowrap`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                        {log.target_resource}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-flex items-center px-2 py-1 text-[10px] font-bold rounded border whitespace-nowrap ${
                        log.status === 'SUCCESS' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' :
                        log.status === 'FAILED' ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' :
                        'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed block break-words">
                        {log.description}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center text-[13px] text-slate-500 dark:text-slate-400">
                    No audit records found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination Stub */}
        <div className="p-3 border-t border-gray-100 dark:border-theme flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
          <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">
            Showing {filteredLogs.length} of {MOCK_AUDIT_LOGS.length} records
          </span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 text-[12px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-card border border-gray-200 dark:border-theme rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-opacity disabled:opacity-50" disabled>
              Previous
            </button>
            <button className="px-3 py-1.5 text-[12px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-card border border-gray-200 dark:border-theme rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-opacity disabled:opacity-50" disabled>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Download Modal */}
      {downloadModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-card w-[400px] rounded-modal shadow-modal overflow-hidden border border-gray-100 dark:border-theme animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-theme flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Download size={16} className="text-indigo-500" /> Download Audit Log
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 dark:text-gray-300 mb-2">Start Date <span className="text-rose-500">*</span></label>
                <input 
                  type="date"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-theme rounded-input text-[13px] bg-white dark:bg-surface dark:text-gray-100 outline-none focus:ring-1 focus:border-indigo-400 focus:ring-indigo-500/20"
                  value={downloadDates.start}
                  onChange={e => setDownloadDates({...downloadDates, start: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 dark:text-gray-300 mb-2">End Date <span className="text-rose-500">*</span></label>
                <input 
                  type="date"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-theme rounded-input text-[13px] bg-white dark:bg-surface dark:text-gray-100 outline-none focus:ring-1 focus:border-indigo-400 focus:ring-indigo-500/20"
                  value={downloadDates.end}
                  onChange={e => setDownloadDates({...downloadDates, end: e.target.value})}
                />
              </div>
            </div>
            <div className="px-5 py-4 bg-transparent dark:bg-transparent/50 border-t border-gray-100 dark:border-theme flex justify-end gap-3">
              <button 
                onClick={handleCancelModal}
                className="px-4 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-input hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-opacity"
              >
                Cancel
              </button>
              <button 
                onClick={handleDownloadSubmit}
                disabled={!downloadDates.start || !downloadDates.end}
                className="px-4 py-2 text-[13px] font-medium text-white bg-indigo-500 hover:bg-indigo-600 border border-indigo-600 shadow-indigo-500/20 rounded-input transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Confirmation Modal */}
      {discardConfirmTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-card w-[400px] rounded-modal shadow-modal overflow-hidden border border-gray-100 dark:border-theme animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-4 text-rose-500">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-[16px] font-bold text-gray-800 dark:text-gray-100 mb-2">Discard Changes?</h3>
              <p className="text-[13px] text-gray-600 dark:text-gray-400">
                You have unsaved changes. Are you sure you want to discard them?
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-theme flex items-center justify-center gap-3">
              <button 
                onClick={() => setDiscardConfirmTarget(false)}
                className="px-4 py-2 w-full text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-input hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-opacity"
              >
                No, keep editing
              </button>
              <button 
                onClick={() => {
                  setDownloadModalOpen(false);
                  setDownloadDates({ start: '', end: '' });
                  setDiscardConfirmTarget(false);
                }}
                className="px-4 py-2 w-full text-[13px] font-medium text-white bg-rose-500 border border-rose-600 rounded-input hover:bg-rose-600 shadow-sm transition-opacity"
              >
                Yes, discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
