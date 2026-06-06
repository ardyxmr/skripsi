import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Layers, Box, Play, Database, Network, Grid, Search, CheckCircle2, RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { mockDiscoveredNodes, mockDiscoveredTemplates, mockDiscoveredNetworks, mockDiscoveredDatastores } from './providerData';


export default function ProviderDiscovery({ isOpen, provider, onClose }) {
  const [resourceNavSelection, setResourceNavSelection] = useState('nodes');
  const [resourceSearch, setResourceSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const discoveryDrawer = { isOpen, provider };

  return createPortal(
    <>
      <div className={`fixed inset-y-0 right-0 w-[950px] bg-slate-50 dark:bg-[#0f172a] shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out flex flex-col ${discoveryDrawer.isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {discoveryDrawer.isOpen && (
          <div className="flex flex-col h-full h-screen overflow-hidden">
            <div className="flex items-center justify-between p-5 bg-white dark:bg-card border-b border-slate-200 dark:border-theme shrink-0">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[16px] flex items-center gap-2">
                <Layers size={18} className="text-blue-600 dark:text-blue-400" /> Discovery Explorer
              </h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">Interactive view of synced resources from {discoveryDrawer.provider?.name || 'Provider'}</p>
            </div>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <X size={18} />
            </button>
          </div>
          
          {discoveryDrawer.provider && (
            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-row animate-in fade-in duration-300 relative">
              
              {/* Left Panel - Master/Details & Navigation */}
              <div className="w-[340px] shrink-0 bg-white dark:bg-card border-r border-slate-200 dark:border-theme overflow-y-auto custom-scrollbar p-5 flex flex-col gap-6">
                
                {/* Context Info */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Provider</div>
                    <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{discoveryDrawer.provider.name}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Connection Status</div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${discoveryDrawer.provider.connectionStatus === 'Connected' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                      {discoveryDrawer.provider.connectionStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Discovery Status</div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${discoveryDrawer.provider.discoveryStatus === 'Success' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' : discoveryDrawer.provider.discoveryStatus === 'Failed' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' : discoveryDrawer.provider.discoveryStatus === 'Running' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-slate-100 text-slate-700 dark:bg-surface dark:text-slate-400'}`}>
                      {discoveryDrawer.provider.discoveryStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Last Discovery</div>
                    <div className="text-[13px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Clock size={14} className="text-slate-400"/> {discoveryDrawer.provider.lastDiscovery || 'Never'}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Next Discovery</div>
                    <div className="text-[13px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Clock size={14} className="text-slate-400"/> {discoveryDrawer.provider.nextDiscovery ? discoveryDrawer.provider.nextDiscovery : 'Manual Only'}</div>
                  </div>
                </div>

                {/* Discovery Health */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-theme pb-1">Discovery Health</h3>
                  <div className={`p-3 border rounded-card flex items-start gap-3 ${discoveryDrawer.provider.discoveryStatus === 'Success' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300' : discoveryDrawer.provider.discoveryStatus === 'Failed' ? 'bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 text-rose-800 dark:text-rose-300' : discoveryDrawer.provider.discoveryStatus === 'Running' ? 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 text-amber-800 dark:text-amber-300' : discoveryDrawer.provider.discoveryStatus === 'Partial' ? 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 text-amber-800 dark:text-amber-300' : 'bg-slate-50 border-slate-200 dark:bg-surface dark:border-theme text-slate-800 dark:text-slate-300'}`}>
                    <div className="mt-0.5">
                      {discoveryDrawer.provider.discoveryStatus === 'Success' && <CheckCircle2 size={16} />}
                      {discoveryDrawer.provider.discoveryStatus === 'Running' && <RefreshCw size={16} className="animate-spin" />}
                      {(discoveryDrawer.provider.discoveryStatus === 'Failed' || discoveryDrawer.provider.discoveryStatus === 'Partial') && <AlertTriangle size={16} />}
                      {(discoveryDrawer.provider.discoveryStatus === 'Never Run' || !discoveryDrawer.provider.discoveryStatus) && <Box size={16} />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold uppercase tracking-wider">{discoveryDrawer.provider.discoveryStatus || 'Never Run'}</span>
                      <span className="text-[13px] opacity-90 mt-0.5">
                        {discoveryDrawer.provider.discoveryStatus === 'Success' && '✓ Discovery completed successfully'}
                        {discoveryDrawer.provider.discoveryStatus === 'Running' && '⟳ Discovery currently running'}
                        {discoveryDrawer.provider.discoveryStatus === 'Failed' && '⚠ Discovery failed during last execution'}
                        {discoveryDrawer.provider.discoveryStatus === 'Partial' && '⚠ Discovery partially completed'}
                        {(discoveryDrawer.provider.discoveryStatus === 'Never Run' || !discoveryDrawer.provider.discoveryStatus) && 'No discovery has been executed yet'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Last Discovery Result */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-theme pb-1">Last Discovery Result</h3>
                  <div className="bg-slate-50 dark:bg-surface border border-slate-200 dark:border-theme rounded-card p-3 flex flex-col gap-2">
                    {discoveryDrawer.provider.discoveryResult && discoveryDrawer.provider.discoveryResult.length > 0 ? (
                      discoveryDrawer.provider.discoveryResult.map((result, idx) => (
                        <div key={idx} className={`text-[12px] font-medium flex items-center gap-2 ${result.includes('✓') ? 'text-emerald-600 dark:text-emerald-400' : result.includes('⚠') ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {result}
                        </div>
                      ))
                    ) : (
                      <div className="text-[12px] text-slate-500 italic">No results available</div>
                    )}
                  </div>
                </div>

                {/* Resource Navigation UI */}
                <div className="flex flex-col gap-2 mt-2">
                  <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-theme pb-1">Resources</h3>
                  <div className="flex flex-col space-y-1">
                    <button 
                      onClick={() => { setResourceNavSelection('nodes'); setResourceSearch(''); }}
                      className={`w-full text-left px-3 py-2.5 rounded-md flex items-center justify-between text-[13px] font-medium transition-colors ${resourceNavSelection === 'nodes' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                      <div className="flex items-center gap-2.5">
                        <Play size={10} className={`transition-all ${resourceNavSelection === 'nodes' ? 'fill-current text-blue-500 dark:text-blue-400 opacity-100' : 'opacity-0 w-0'}`} />
                        <Box size={16} className={resourceNavSelection === 'nodes' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} /> 
                        <span className={resourceNavSelection === 'nodes' ? 'font-bold' : ''}>Nodes</span>
                      </div>
                      <span className="text-[12px] bg-white dark:bg-card px-2 py-0.5 rounded-full border border-slate-200 dark:border-theme shadow-sm">{discoveryDrawer.provider.nodes}</span>
                    </button>
                    <button 
                      onClick={() => { setResourceNavSelection('templates'); setResourceSearch(''); }}
                      className={`w-full text-left px-3 py-2.5 rounded-md flex items-center justify-between text-[13px] font-medium transition-colors ${resourceNavSelection === 'templates' ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                      <div className="flex items-center gap-2.5">
                        <Play size={10} className={`transition-all ${resourceNavSelection === 'templates' ? 'fill-current text-teal-500 dark:text-teal-400 opacity-100' : 'opacity-0 w-0'}`} />
                        <Database size={16} className={resourceNavSelection === 'templates' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'} /> 
                        <span className={resourceNavSelection === 'templates' ? 'font-bold' : ''}>Templates</span>
                      </div>
                      <span className="text-[12px] bg-white dark:bg-card px-2 py-0.5 rounded-full border border-slate-200 dark:border-theme shadow-sm">{discoveryDrawer.provider.templates}</span>
                    </button>
                    <button 
                      onClick={() => { setResourceNavSelection('networks'); setResourceSearch(''); }}
                      className={`w-full text-left px-3 py-2.5 rounded-md flex items-center justify-between text-[13px] font-medium transition-colors ${resourceNavSelection === 'networks' ? 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                      <div className="flex items-center gap-2.5">
                        <Play size={10} className={`transition-all ${resourceNavSelection === 'networks' ? 'fill-current text-purple-500 dark:text-purple-400 opacity-100' : 'opacity-0 w-0'}`} />
                        <Network size={16} className={resourceNavSelection === 'networks' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'} /> 
                        <span className={resourceNavSelection === 'networks' ? 'font-bold' : ''}>Networks</span>
                      </div>
                      <span className="text-[12px] bg-white dark:bg-card px-2 py-0.5 rounded-full border border-slate-200 dark:border-theme shadow-sm">{discoveryDrawer.provider.networks}</span>
                    </button>
                    <button 
                      onClick={() => { setResourceNavSelection('datastores'); setResourceSearch(''); }}
                      className={`w-full text-left px-3 py-2.5 rounded-md flex items-center justify-between text-[13px] font-medium transition-colors ${resourceNavSelection === 'datastores' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                      <div className="flex items-center gap-2.5">
                        <Play size={10} className={`transition-all ${resourceNavSelection === 'datastores' ? 'fill-current text-amber-500 dark:text-amber-400 opacity-100' : 'opacity-0 w-0'}`} />
                        <Grid size={16} className={resourceNavSelection === 'datastores' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'} /> 
                        <span className={resourceNavSelection === 'datastores' ? 'font-bold' : ''}>Datastores</span>
                      </div>
                      <span className="text-[12px] bg-white dark:bg-card px-2 py-0.5 rounded-full border border-slate-200 dark:border-theme shadow-sm">{discoveryDrawer.provider.datastores}</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Panel */}
              <div className="flex-1 bg-slate-50/50 dark:bg-transparent overflow-y-auto custom-scrollbar flex flex-col relative">
                
                <div className="p-6 flex flex-col gap-4 animate-in fade-in duration-300">
                      {/* Header & Search */}
                      <div className="flex items-center justify-between bg-white dark:bg-card p-4 rounded-card border border-slate-200 dark:border-theme shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[16px] font-bold text-slate-800 dark:text-slate-200 capitalize">
                      {resourceNavSelection === 'nodes' ? 'Discovered Nodes' : 
                       resourceNavSelection === 'templates' ? 'Discovered Templates' : 
                       resourceNavSelection === 'networks' ? 'Discovered Networks' : 'Discovered Datastores'}
                    </span>
                    <span className="text-[12px] text-slate-500 mt-0.5">
                      {resourceNavSelection === 'nodes' ? mockDiscoveredNodes.length : 
                       resourceNavSelection === 'templates' ? mockDiscoveredTemplates.length : 
                       resourceNavSelection === 'networks' ? mockDiscoveredNetworks.length : 
                       mockDiscoveredDatastores.length} Resources
                    </span>
                  </div>
                  <div className="relative w-[280px]">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder={`Search ${resourceNavSelection}...`}
                      value={resourceSearch}
                      onChange={(e) => setResourceSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-[13px] border border-slate-200 dark:border-theme rounded-md bg-slate-50 dark:bg-surface focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Data Table */}
                <div className="bg-white dark:bg-card border border-slate-200 dark:border-theme rounded-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead className="bg-slate-50/80 dark:bg-surface border-b border-slate-200 dark:border-theme">
                      <tr>
                        {resourceNavSelection === 'nodes' && (
                          <>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Node Name</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">CPU</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Memory</th>
                          </>
                        )}
                        {resourceNavSelection === 'templates' && (
                          <>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Template Name</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Node</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                          </>
                        )}
                        {resourceNavSelection === 'networks' && (
                          <>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Network Name</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Provider Network</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">CIDR</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                          </>
                        )}
                        {resourceNavSelection === 'datastores' && (
                          <>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Datastore</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Type</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Capacity / Usage</th>
                            <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {resourceNavSelection === 'nodes' && mockDiscoveredNodes.filter(item => item.name.toLowerCase().includes(resourceSearch.toLowerCase())).map((item, idx) => (
                        <tr key={idx} className="table-row-optimized border-b border-slate-100 dark:border-theme last:border-0 group">
                          <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                          <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${item.status === 'Online' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400'}`}>{item.status}</span></td>
                          <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{item.cpu}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{item.memory}</td>
                        </tr>
                      ))}
                      {resourceNavSelection === 'templates' && mockDiscoveredTemplates.filter(item => item.name.toLowerCase().includes(resourceSearch.toLowerCase())).map((item, idx) => (
                        <tr key={idx} className="table-row-optimized border-b border-slate-100 dark:border-theme last:border-0 group">
                          <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{item.node}</td>
                          <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${item.status === 'Available' ? 'bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400' : 'bg-slate-50 border border-slate-200 text-slate-700 dark:bg-surface dark:border-theme dark:text-slate-400'}`}>{item.status}</span></td>
                        </tr>
                      ))}
                      {resourceNavSelection === 'networks' && mockDiscoveredNetworks.filter(item => item.name.toLowerCase().includes(resourceSearch.toLowerCase())).map((item, idx) => (
                        <tr key={idx} className="table-row-optimized border-b border-slate-100 dark:border-theme last:border-0 group">
                          <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{item.providerNetwork}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{item.cidr}</td>
                          <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${item.status === 'Available' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-slate-50 border border-slate-200 text-slate-700 dark:bg-surface dark:border-theme dark:text-slate-400'}`}>{item.status}</span></td>
                        </tr>
                      ))}
                      {resourceNavSelection === 'datastores' && mockDiscoveredDatastores.filter(item => item.name.toLowerCase().includes(resourceSearch.toLowerCase())).map((item, idx) => (
                        <tr key={idx} className="table-row-optimized border-b border-slate-100 dark:border-theme last:border-0 group">
                          <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{item.type}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{item.capacity} <span className="text-slate-400 mx-1">/</span> {item.usage}</td>
                          <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${item.status === 'Available' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : item.status === 'Warning' ? 'bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400' : 'bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400'}`}>{item.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Empty State / Not Found */}
                  {((resourceNavSelection === 'nodes' && mockDiscoveredNodes.filter(i => i.name.toLowerCase().includes(resourceSearch.toLowerCase())).length === 0) ||
                    (resourceNavSelection === 'templates' && mockDiscoveredTemplates.filter(i => i.name.toLowerCase().includes(resourceSearch.toLowerCase())).length === 0) ||
                    (resourceNavSelection === 'networks' && mockDiscoveredNetworks.filter(i => i.name.toLowerCase().includes(resourceSearch.toLowerCase())).length === 0) ||
                    (resourceNavSelection === 'datastores' && mockDiscoveredDatastores.filter(i => i.name.toLowerCase().includes(resourceSearch.toLowerCase())).length === 0)) && (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50/30 dark:bg-surface/20">
                      <Search size={32} className="opacity-30 mb-3" />
                      <p className="text-[14px]">No resources found matching "{resourceSearch}"</p>
                    </div>
                  )}
                </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Backdrops */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm z-[90] animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}
    </>,
    document.body
  );
}
