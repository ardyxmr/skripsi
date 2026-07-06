import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../lib/api';
import { makeCrud } from '../lib/crud';
import { isAuthed } from '../lib/auth';
import { LIVE_CACHE_EVENT } from '../lib/liveCache';

const NodeContext = createContext();
const RESOURCE = '/nodes';

// RAM% from the snapshot: ram_usage_mb / (total_memory bytes → MB).
const ramPct = (usedMb, totalBytes) => {
  if (usedMb == null || !totalBytes) return null;
  return Math.round((usedMb / (totalBytes / 1024 / 1024)) * 100);
};

// Operational status (provider_nodes.status) → display label.
const opLabel = (s) => {
  if (s === 'online') return 'Online';
  if (s === 'offline') return 'Offline';
  if (s === 'maintenance') return 'Maintenance';
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Unknown';
};

export function normalizeNode(row = {}) {
  return {
    ...row,
    name: row.nodeName ?? row.name ?? '',
    description: row.description ?? '',
    provider: row.providerName ?? row.provider ?? '',
    rawNode: row.providerNodeName ?? row.rawNode ?? '',     // e.g. pve01 (admin-only)
    cpuPct: row.cpuUtilization != null ? Math.round(row.cpuUtilization) : null,
    ramPct: ramPct(row.ramUsageMb, row.totalMemory),
    operational: opLabel(row.operationalStatus),
    status: row.status ?? '',                               // governance: Active|Inactive|Provider Offline|Missing
    lastSyncAt: row.lastSyncAt ?? null,
    lastUpdated: row.updatedAt ?? row.lastUpdated ?? '',
  };
}

export function NodeProvider({ children }) {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // silent:true skips the loading/error churn — used by the background live refresh so a node's
  // status stays fresh without flashing the skeleton.
  const refetch = useCallback(async ({ silent = false } = {}) => {
    if (!silent) { setLoading(true); setError(null); }
    try {
      const rows = await api.get(RESOURCE);
      setNodes((rows || []).map(normalizeNode));
    } catch (e) {
      if (!silent) setError(e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthed()) refetch(); // wait for auth — DataBootstrap re-fetches on login
  }, [refetch]);

  // Keep node status live app-wide: a node's operational health follows its provider (a disconnected
  // provider takes its nodes Offline), so ride the LiveDataPoller heartbeat (~10s), gated on '/inventory'.
  useEffect(() => {
    const onLive = (e) => { if (e?.detail?.path === '/inventory' && isAuthed()) refetch({ silent: true }); };
    window.addEventListener(LIVE_CACHE_EVENT, onLive);
    return () => window.removeEventListener(LIVE_CACHE_EVENT, onLive);
  }, [refetch]);

  const { create, update, remove } = makeCrud(RESOURCE, setNodes, refetch, normalizeNode);

  // Scoped re-sync — refresh status + utilization snapshot, then re-pull the list.
  const sync = useCallback(async (id) => {
    const updated = await api.post(`${RESOURCE}/${id}/sync`);
    await refetch();
    return updated;
  }, [refetch]);

  return (
    <NodeContext.Provider
      value={{ nodes, setNodes, loading, error, refetch, create, update, remove, sync }}
    >
      {children}
    </NodeContext.Provider>
  );
}

export function useNodeContext() {
  const context = useContext(NodeContext);
  if (!context) {
    throw new Error('useNodeContext must be used within a NodeProvider');
  }
  return context;
}
