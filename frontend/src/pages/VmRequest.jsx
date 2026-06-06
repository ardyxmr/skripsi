import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export default function VmRequest() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // States
  const [step, setStep] = useState(1);
  const [env, setEnv] = useState(location.state?.env || '');
  const [provider, setProvider] = useState(location.state?.provider || '');
  const [node, setNode] = useState(location.state?.node || '');
  
  // Configuration States
  const [vmPrefix, setVmPrefix] = useState(location.state?.vmPrefix || 'APP');
  const [vmCount, setVmCount] = useState(location.state?.vmCount || 1);
  const [tier, setTier] = useState(location.state?.tierId || 'bronze');
  const [network, setNetwork] = useState(location.state?.network || 'vlan-dev-01');
  const [datastore, setDatastore] = useState(location.state?.datastore || 'vmdata');
  const [os, setOs] = useState(location.state?.catalogId || '');
  const [description, setDescription] = useState(location.state?.description || '');
  const [isHardening, setIsHardening] = useState(false);
  
  // Custom Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Reset dependent fields when parent changes (protect initial mount)
  const isMountedEnv = useRef(false);
  useEffect(() => { 
    if (isMountedEnv.current) { setProvider(''); setNode(''); }
    else { isMountedEnv.current = true; }
  }, [env]);
  
  const isMountedProv = useRef(false);
  useEffect(() => { 
    if (isMountedProv.current) { setNode(''); }
    else { isMountedProv.current = true; }
  }, [provider]);

  // Unsaved changes protection
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (step > 1 || env !== '') {
        e.preventDefault();
        e.returnValue = ''; // Standard for most browsers
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [step, env]);

  // Derived Values
  const generateVmNames = () => {
    const names = [];
    const count = parseInt(vmCount, 10) || 0;
    for (let i = 1; i <= count; i++) {
      names.push(`${vmPrefix}${i.toString().padStart(2, '0')}`);
    }
    return names;
  };

  const generatedNames = generateVmNames();

  const getTierDetails = (t) => {
    switch(t) {
      case 'bronze': return { cpu: 1, ram: 1, disk: 50 };
      case 'silver': return { cpu: 2, ram: 4, disk: 100 };
      case 'gold': return { cpu: 3, ram: 8, disk: 200 };
      default: return { cpu: 1, ram: 1, disk: 50 };
    }
  };

  const tierDetails = getTierDetails(tier);
  const totalCpu = tierDetails.cpu * (parseInt(vmCount) || 1);
  const totalRam = tierDetails.ram * (parseInt(vmCount) || 1);
  const totalDisk = tierDetails.disk * (parseInt(vmCount) || 1);

  const envData = [
    { id: 'development', label: 'Development', duration: '30 Days', permanent: false, bg: 'bg-amber-50 dark:bg-amber-900/20', fg: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-700/50' },
    { id: 'staging', label: 'Staging', duration: '60 Days', permanent: false, bg: 'bg-indigo-50 dark:bg-indigo-900/20', fg: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-700/50' },
    { id: 'production', label: 'Production', duration: 'Lifetime', permanent: true, bg: 'bg-emerald-50 dark:bg-emerald-900/20', fg: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-700/50' }
  ];

  const selectedEnvData = envData.find(e => e.id === env);

  // Mock Data for Providers & Nodes
  const providerData = {
    'development': [{ id: 'proxmox-lab', label: 'Proxmox LAB' }, { id: 'proxmox-dc1', label: 'Proxmox DC1' }],
    'staging': [{ id: 'proxmox-dc1', label: 'Proxmox DC1' }],
    'production': [{ id: 'proxmox-dc1', label: 'Proxmox DC1' }]
  };

  const nodeData = {
    'proxmox-lab': [{ id: 'lab-pve01', label: 'lab-pve01' }],
    'proxmox-dc1': [{ id: 'pve01', label: 'pve01' }, { id: 'pve02', label: 'pve02' }, { id: 'pve03', label: 'pve03' }]
  };

  const handleNext = (nextStep) => {
    if (nextStep === 2 && (!env || !provider)) return;
    if (nextStep === 3 && (!node || !vmPrefix || !vmCount || !os)) return;
    setStep(nextStep);
  };

  const handleSubmit = () => {
    setShowConfirmModal(true);
  };

  const executeSubmit = async () => {
    try {
      const response = await fetch('/api/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          env, vmPrefix, vmCount, tier, diskSize: tierDetails.disk, network, os, description, isHardening, generatedNames
        })
      });
      
      const result = await response.json();
      if (result.success) {
        navigate('/catalog', { state: { globalToast: 'Provision Request submitted. Pending Approval.' } });
      } else {
        alert('Submission failed: ' + (result.error || 'Unknown error'));
        setShowConfirmModal(false);
      }
    } catch (err) {
      console.error(err);
      // Since API is mocked, we simulate success for demo
      navigate('/catalog', { state: { globalToast: 'Provision Request submitted. Pending Approval.' } });
    }
  };

  return (
    <div className="max-w-[700px] animate-in fade-in slide-in-from-bottom-4 duration-500 mx-auto">
      {/* Wizard Steps */}
      <div className="flex items-center gap-0 mb-8 bg-white dark:bg-card p-2 rounded-card shadow-card border border-gray-100 dark:border-theme">
        {[
          { num: 1, label: 'Environment' },
          { num: 2, label: 'Configuration' },
          { num: 3, label: 'Review' }
        ].map((s, idx) => (
          <React.Fragment key={s.num}>
            <div className={`flex items-center gap-2 text-[12px] flex-1 px-3 py-2 rounded-xl transition-opacity duration-300 ${step === s.num ? 'bg-teal-50 dark:bg-teal-900/30' : step > s.num ? 'opacity-90' : 'opacity-50'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0
                ${step === s.num ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm' : 
                  step > s.num ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-surface text-gray-400 dark:text-gray-500'}`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <div className={`${step === s.num ? 'text-teal-700 dark:text-teal-400 font-bold' : step > s.num ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                {s.label}
              </div>
            </div>
            {idx < 2 && <div className="w-4 h-px bg-gray-200 dark:bg-slate-600 mx-1 shrink-0"></div>}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white dark:bg-card border border-gray-100 dark:border-theme rounded-card p-6 shadow-card">
        {step === 1 && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-1.5 text-[14px] font-medium text-gray-800 dark:text-gray-100">Select deployment environment</div>
            <div className="text-[12px] text-gray-500 dark:text-gray-400 mb-5">Environment determines lifecycle and expiration policy.</div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {envData.map(e => (
                <div 
                  key={e.id}
                  onClick={() => setEnv(e.id)}
                  className={`text-center p-5 bg-white dark:bg-card border rounded-xl cursor-pointer transition-[transform,box-shadow] duration-200 hover:shadow-md hover:scale-[1.02] ${env === e.id ? 'border-teal-500 shadow-md ring-2 ring-teal-500/20 bg-teal-50/10 dark:bg-teal-900/10' : 'border-gray-200 dark:border-theme'}`}
                >
                  <div className="text-[15px] font-semibold text-gray-800 dark:text-gray-100 mb-2">{e.label}</div>
                  <div className={`text-[11px] px-3 py-1 rounded-full inline-block font-medium ${e.bg} ${e.fg} ${e.border} border`}>
                    {e.duration}
                  </div>
                </div>
              ))}
            </div>

            {selectedEnvData && (
              <div className="bg-gray-50 dark:bg-surface rounded-xl p-4 border border-gray-200 dark:border-theme flex gap-3 animate-in fade-in duration-300 mb-6">
                <div className="text-teal-600 dark:text-teal-400 shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 mb-1">{selectedEnvData.label} Environment</div>
                  <div className="text-[12px] text-gray-600 dark:text-gray-400">
                    {selectedEnvData.permanent 
                      ? "Permanent VM. No automatic expiration." 
                      : `Expires automatically after ${selectedEnvData.duration}. Renewal request can be submitted before expiration.`}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Provider</label>
                <select 
                  disabled={!env}
                  className="w-full p-2.5 border border-gray-200 dark:border-theme rounded-lg text-[13px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-gray-50 dark:bg-surface dark:text-gray-100 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
                  value={provider} 
                  onChange={e => setProvider(e.target.value)}
                >
                  <option value="" disabled>Select Provider...</option>
                  {env && providerData[env]?.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
              {/* Node selection has been moved to Step 2 */}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-100 dark:border-theme">
              <button 
                disabled={!env || !provider}
                onClick={() => handleNext(2)} 
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white px-6 py-2.5 text-[13px] font-medium rounded-lg shadow-md shadow-teal-500/20 transition-[transform,opacity,box-shadow] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg disabled:hover:shadow-none disabled:hover:-translate-y-0 hover:-translate-y-0.5"
              >
                Next Step →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-[14px] font-semibold text-gray-800 dark:text-gray-100 mb-4">VM Configuration</div>
            
            {/* Deployment Context */}
            <div className="bg-gray-50 dark:bg-blue-900/10 border border-gray-200 dark:border-blue-900/30 rounded-xl p-4 mb-6">
              <div className="text-[11px] font-bold text-gray-500 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                Deployment Context
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <div>
                  <div className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Environment</div>
                  <div className="w-full p-2.5 border border-gray-200 dark:border-theme rounded-lg text-[13px] bg-gray-50 dark:bg-surface text-gray-800 dark:text-gray-100 capitalize">{env}</div>
                </div>
                <div>
                  <div className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Provider</div>
                  <div className="w-full p-2.5 border border-gray-200 dark:border-theme rounded-lg text-[13px] bg-gray-50 dark:bg-surface text-gray-800 dark:text-gray-100">{providerData[env]?.find(p => p.id === provider)?.label || provider}</div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Node</label>
                  <select 
                    className="w-full p-2.5 border border-gray-200 dark:border-theme rounded-lg text-[13px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-gray-50 dark:bg-surface dark:text-gray-100 appearance-none cursor-pointer" 
                    value={node} 
                    onChange={e => setNode(e.target.value)}
                  >
                    <option value="" disabled>Select Node...</option>
                    {provider && nodeData[provider]?.map(n => (
                      <option key={n.id} value={n.id}>{n.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">VM Name Prefix</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 border border-gray-200 dark:border-theme rounded-lg text-[13px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-gray-50 dark:bg-surface dark:text-gray-100" 
                  value={vmPrefix} 
                  onChange={e => setVmPrefix(e.target.value.toUpperCase())} 
                  placeholder="e.g. APP, WEB, DB"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Number of Instances</label>
                <input 
                  type="number" 
                  className="w-full p-2.5 border border-gray-200 dark:border-theme rounded-lg text-[13px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-gray-50 dark:bg-surface dark:text-gray-100" 
                  value={vmCount} 
                  onChange={e => setVmCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))} 
                  min="1" max="20"
                />
              </div>
            </div>

            {/* Naming Preview */}
            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-3 mb-6">
              <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mb-1.5 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                Generated Names Preview
              </div>
              <div className="flex flex-wrap gap-2">
                {generatedNames.map((name, i) => (
                  <span key={i} className="text-[12px] bg-white dark:bg-card border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-mono shadow-sm">
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Catalog</label>
                <select 
                  className="w-full p-2.5 border border-gray-200 dark:border-theme rounded-lg text-[13px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-gray-50 dark:bg-surface dark:text-gray-100 appearance-none cursor-pointer" 
                  value={os} 
                  onChange={e => setOs(e.target.value)}
                >
                  <option value="" disabled>Select Catalog...</option>
                  <option value="ubuntu-22.04">Ubuntu 22.04 LTS</option>
                  <option value="debian-12">Debian 12</option>
                  <option value="centos-9">CentOS Stream 9</option>
                  <option value="win-2022">Windows Server 2022</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Compute Tier</label>
                <select 
                  className="w-full p-2.5 border border-gray-200 dark:border-theme rounded-lg text-[13px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-gray-50 dark:bg-surface dark:text-gray-100 appearance-none cursor-pointer" 
                  value={tier} 
                  onChange={e => setTier(e.target.value)}
                >
                  <option value="bronze">Bronze — 1 vCPU / 1 GB RAM / 50 GB Disk</option>
                  <option value="silver">Silver — 2 vCPU / 4 GB RAM / 100 GB Disk</option>
                  <option value="gold">Gold — 3 vCPU / 8 GB RAM / 200 GB Disk</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Network</label>
                <select 
                  className="w-full p-2.5 border border-gray-200 dark:border-theme rounded-lg text-[13px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-gray-50 dark:bg-surface dark:text-gray-100 appearance-none cursor-pointer" 
                  value={network} 
                  onChange={e => setNetwork(e.target.value)}
                >
                  <option value="vlan-prod-01">vlan-prod-01 (10.10.1.0/24)</option>
                  <option value="vlan-dev-01">vlan-dev-01 (10.10.2.0/24)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Datastore</label>
                <select 
                  className="w-full p-2.5 border border-gray-200 dark:border-theme rounded-lg text-[13px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-gray-50 dark:bg-surface dark:text-gray-100 appearance-none cursor-pointer" 
                  value={datastore} 
                  onChange={e => setDatastore(e.target.value)}
                >
                  <option value="vmdata">vmdata (SSD)</option>
                  <option value="local-lvm">local-lvm</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-theme pt-5 mb-5">
              <div className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 mb-3">Additional Configuration</div>
              <div className="mb-4">
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Description (Optional)</label>
                <textarea 
                  rows="2" 
                  className="w-full p-2.5 border border-gray-200 dark:border-theme rounded-lg text-[13px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-gray-50 dark:bg-surface dark:text-gray-100" 
                  placeholder="Purpose of this VM, Business Justification..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
              
              <div className="bg-gray-50 dark:bg-surface border border-gray-200 dark:border-theme rounded-xl p-4 flex items-start gap-3">
                <div className="mt-0.5">
                  <input 
                    type="checkbox" 
                    id="hardening"
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer" 
                    checked={isHardening} 
                    onChange={e => setIsHardening(e.target.checked)} 
                  /> 
                </div>
                <div>
                  <label htmlFor="hardening" className="text-[13px] font-medium text-gray-800 dark:text-gray-200 cursor-pointer hover:text-teal-600 dark:hover:text-teal-400">
                    Enable Security Hardening
                  </label>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1">Ansible will execute security baseline configuration after VM provisioning.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6 pt-4 border-t border-gray-100 dark:border-theme">
              <button onClick={() => handleNext(1)} className="bg-white dark:bg-card text-gray-700 dark:text-gray-200 px-5 py-2.5 text-[13px] font-medium rounded-lg border border-gray-200 dark:border-theme hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm">← Back</button>
              <button 
                onClick={() => handleNext(3)} 
                disabled={!node || !vmPrefix || !vmCount || !os}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white px-6 py-2.5 text-[13px] font-medium rounded-lg shadow-md shadow-teal-500/20 transition-[transform,opacity,box-shadow] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg disabled:hover:shadow-none hover:-translate-y-0.5 disabled:hover:-translate-y-0"
              >
                Review Request →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-[14px] font-semibold text-gray-800 dark:text-gray-100 mb-4">Review Your Request</div>
            
            <div className="bg-gray-50 dark:bg-blue-900/10 border border-gray-200 dark:border-blue-900/30 rounded-xl p-5 mb-5 shadow-inner">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-6">
                {[
                  ['Environment', <span className="capitalize">{env}</span>],
                  ['Provider', providerData[env]?.find(p => p.id === provider)?.label || provider],
                  ['Node', nodeData[provider]?.find(n => n.id === node)?.label || node],
                  ['Catalog', os],
                  ['Compute Tier', <span className="capitalize">{tier}</span>],
                  ['Network', network],
                  ['Datastore', datastore],
                  ['VM Name Prefix', vmPrefix],
                  ['Instances', vmCount],
                  ['Security Hardening', isHardening ? <span className="text-emerald-600 font-bold">YES</span> : <span className="text-gray-500 font-bold">NO</span>],
                  ['Description', description || <span className="text-gray-400 italic">No description provided</span>]
                ].map(([k, v], i) => (
                  <div key={i} className="flex flex-col">
                    <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{k}</div>
                    <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200 mt-1">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              {/* Cost/Resource Estimation */}
              <div className="bg-white dark:bg-card border border-teal-100 dark:border-teal-900/50 rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-teal-50 dark:bg-teal-900/20 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                <div className="relative z-10">
                  <div className="text-[13px] font-semibold text-teal-800 dark:text-teal-400 mb-3 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    Total Resource Estimation
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-teal-50/50 dark:bg-teal-900/10 rounded-lg p-2">
                      <div className="text-[18px] font-bold text-teal-700 dark:text-teal-300">{totalCpu}</div>
                      <div className="text-[10px] uppercase text-teal-600/70 font-semibold mt-0.5">vCPU</div>
                    </div>
                    <div className="bg-teal-50/50 dark:bg-teal-900/10 rounded-lg p-2">
                      <div className="text-[18px] font-bold text-teal-700 dark:text-teal-300">{totalRam}</div>
                      <div className="text-[10px] uppercase text-teal-600/70 font-semibold mt-0.5">GB RAM</div>
                    </div>
                    <div className="bg-teal-50/50 dark:bg-teal-900/10 rounded-lg p-2">
                      <div className="text-[18px] font-bold text-teal-700 dark:text-teal-300">{totalDisk}</div>
                      <div className="text-[10px] uppercase text-teal-600/70 font-semibold mt-0.5">GB Disk</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Generated Names Box */}
              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 shadow-sm">
                 <div className="text-[13px] font-semibold text-blue-800 dark:text-blue-400 mb-3 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Generated VM Names
                  </div>
                  <div className="flex flex-wrap gap-1.5 h-[64px] overflow-y-auto pr-2 custom-scrollbar">
                    {generatedNames.map((name, i) => (
                      <span key={i} className="text-[12px] bg-white dark:bg-card border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-mono shadow-sm">
                        {name}
                      </span>
                    ))}
                  </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200/60 dark:border-amber-700/50 rounded-xl p-4 text-[13px] text-amber-800 dark:text-amber-300 mb-5 shadow-sm flex items-start gap-3">
              <span className="text-amber-500 dark:text-amber-400 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </span>
              <div>This request will be submitted for manager approval before provisioning begins. Status will change to <strong className="font-semibold">Pending Approval</strong>.</div>
            </div>

            <div className="flex justify-between border-t border-gray-100 dark:border-theme pt-4">
              <button onClick={() => handleNext(2)} className="bg-white dark:bg-card text-gray-700 dark:text-gray-200 px-5 py-2.5 text-[13px] font-medium rounded-lg border border-gray-200 dark:border-theme hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm">← Back</button>
              <button onClick={handleSubmit} className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white px-6 py-2.5 text-[13px] font-medium rounded-lg shadow-md shadow-teal-500/20 transition-[transform,opacity,box-shadow] hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                Submit Provision Request
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-card w-[400px] rounded-modal shadow-modal overflow-hidden border border-gray-100 dark:border-theme animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-theme">
              <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-teal-500" />
                Confirm Provision Request
              </h3>
            </div>
            <div className="p-5">
              <p className="text-[13px] text-gray-600 dark:text-gray-300">
                Are you sure you want to submit this VM request?
              </p>
            </div>
            <div className="px-5 py-4 bg-transparent dark:bg-transparent/50 border-t border-gray-100 dark:border-theme flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-card border border-gray-200 dark:border-theme rounded-input hover:bg-gray-100 dark:hover:bg-slate-700/50 shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={executeSubmit}
                className="px-4 py-2 text-[13px] font-medium text-white bg-teal-500 border border-teal-600 rounded-input hover:bg-teal-600 transition-colors shadow-sm shadow-teal-500/20"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
