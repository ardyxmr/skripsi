import React from 'react';

/**
 * Shared status pill / badge.
 *
 * Consolidates the status-color logic that was duplicated across Inventory,
 * Approvals, ProviderDiscovery and NodeExplorer. Each view used the same small
 * vocabulary of semantic colors (emerald=good, rose=bad, amber=warning,
 * orange=reverted, blue=in-progress, gray/slate=neutral) but re-spelled the
 * Tailwind classes inline.
 *
 * Usage:
 *   <StatusPill status="Active" />                       // tone derived from the word
 *   <StatusPill status={req.status} dot shape="full" />  // Approvals-style
 *   <StatusPill status={r.discoveredStatus} variant="soft" uppercase /> // Discovery-style
 *   <StatusPill tone="success" label="Running" variant="soft" />        // explicit tone
 *
 * Props:
 *  - status:   status string; resolved to a tone via statusTone() unless `tone` is given
 *  - tone:     explicit semantic tone (success|danger|warning|revert|info|neutral)
 *  - label / children: text to display (defaults to `status`)
 *  - variant:  'solid' (filled, default) | 'soft' (outlined, used by the explorers)
 *  - dot:      show a leading status dot
 *  - uppercase: uppercase + wide tracking (explorer style)
 *  - shape:    'md' (rounded-md, default) | 'full' (rounded-full) | 'sm' (rounded)
 *  - size:     'xs' (text-[10px], default) | 'sm' (text-[11px])
 *  - pad:      padding classes (default 'px-2.5 py-1'); override for tighter chips
 *  - weight:   font-weight class (default 'font-bold'); the Settings tables use 'font-medium'
 *  - className: extra classes (e.g. shadow-sm, animate-pulse)
 */

// Per-tone color classes for each variant + the dot.
const PALETTE = {
  success: {
    solid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    soft: 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  danger: {
    solid: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
    soft: 'bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
  warning: {
    solid: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    soft: 'bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  revert: {
    solid: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
    soft: 'bg-orange-50 border border-orange-200 text-orange-700 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
  info: {
    solid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    soft: 'bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  // Violet — an in-progress MUTATION of an existing VM (resize/edit/add-disk), distinct from
  // Provisioning's blue (creating a NEW VM).
  updating: {
    solid: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
    soft: 'bg-violet-50 border border-violet-200 text-violet-700 dark:bg-violet-500/10 dark:border-violet-500/20 dark:text-violet-400',
    dot: 'bg-violet-500',
  },
  neutral: {
    solid: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    soft: 'bg-slate-50 border border-slate-200 text-slate-700 dark:bg-surface dark:border-theme dark:text-slate-400',
    dot: 'bg-gray-400',
  },
  // Brown — distinct from amber(warning); used for a stopped (powered-off) VM.
  stopped: {
    solid: 'bg-[#efe3d3] text-[#7c4a21] dark:bg-[#3a2a1a] dark:text-[#c49a6c]',
    soft: 'bg-[#f5ece0] border border-[#e2d2bb] text-[#7c4a21] dark:bg-[#2a1e12] dark:border-[#574125] dark:text-[#c49a6c]',
    dot: 'bg-[#8a5a2b]',
  },
};

// Map a status word to a semantic tone. Covers the full vocabulary across the
// app (VM lifecycle, approval workflow, provider/discovery, published rows).
const TONE_BY_STATUS = {
  // good
  Active: 'success', Running: 'success', Connected: 'success', Approved: 'success', Ready: 'success', Enabled: 'success', Online: 'success',
  // bad
  Failed: 'danger', Expired: 'danger', Missing: 'danger', Rejected: 'danger', Disconnected: 'danger',
  Offline: 'danger', 'Offline / Missing': 'danger', 'Provider Offline': 'danger', 'Node Offline': 'danger', 'Template Missing': 'danger',
  // warning
  Pending: 'warning', 'Low Capacity': 'warning', Unknown: 'warning',
  // reverted
  Reverted: 'revert',
  // in-progress
  Provisioning: 'info', Updating: 'updating', Deleting: 'danger',
  // stopped (brown)
  Stopped: 'stopped',
  // neutral
  Deleted: 'neutral', Disabled: 'neutral', Inactive: 'neutral',
};

export function statusTone(status) {
  return TONE_BY_STATUS[status] || 'neutral';
}

const SHAPES = { md: 'rounded-md', full: 'rounded-full', sm: 'rounded' };
const SIZES = { xs: 'text-[10px]', sm: 'text-[11px]' };

export default function StatusPill({
  status,
  tone,
  label,
  children,
  variant = 'solid',
  dot = false,
  uppercase = false,
  shape = 'md',
  size = 'xs',
  pad = 'px-2.5 py-1',
  weight = 'font-bold',
  className = '',
}) {
  const p = PALETTE[tone || statusTone(status)] || PALETTE.neutral;
  const classes = [
    'inline-flex items-center gap-1.5',
    weight,
    SHAPES[shape] || SHAPES.md,
    SIZES[size] || SIZES.xs,
    pad,
    uppercase ? 'uppercase tracking-wider' : '',
    p[variant] || p.solid,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />}
      {children ?? label ?? status}
    </span>
  );
}
