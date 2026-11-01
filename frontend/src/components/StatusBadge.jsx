import React from 'react';

const STATUS_CONFIG = {
  placed: { label: 'New / Placed', style: 'bg-amber-50 text-amber-800 border-amber-200/80' },
  Received: { label: 'Received', style: 'bg-amber-50 text-amber-800 border-amber-200/80' },
  confirmed: { label: 'Confirmed', style: 'bg-sky-50 text-sky-800 border-sky-200/80' },
  Confirmed: { label: 'Confirmed', style: 'bg-sky-50 text-sky-800 border-sky-200/80' },
  in_progress: { label: 'In Progress', style: 'bg-purple-50 text-purple-800 border-purple-200' },
  'In Progress': { label: 'In Progress', style: 'bg-purple-50 text-purple-800 border-purple-200' },
  draft_shared: { label: 'Draft Shared', style: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  'Draft Shared': { label: 'Draft Shared', style: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  changes_requested: { label: 'Changes Requested', style: 'bg-amber-50 text-amber-800 border-amber-200/80' },
  'Changes Requested': { label: 'Changes Requested', style: 'bg-amber-50 text-amber-800 border-amber-200/80' },
  ready: { label: 'Ready', style: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  Ready: { label: 'Ready', style: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  delivered: { label: 'Delivered', style: 'bg-stone-100 text-stone-700 border-stone-300' },
  Delivered: { label: 'Delivered', style: 'bg-stone-100 text-stone-700 border-stone-300' },
  cancelled: { label: 'Cancelled', style: 'bg-rose-50 text-rose-700 border-rose-200' },
  Cancelled: { label: 'Cancelled', style: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const VIDEO_STATUS_LABELS = {
  placed: 'Order Received',
  Received: 'Order Received',
  confirmed: 'Confirmed & Scheduled',
  Confirmed: 'Confirmed & Scheduled',
  in_progress: 'In Production',
  'In Progress': 'In Production',
  draft_shared: 'Draft Shared',
  'Draft Shared': 'Draft Shared',
  changes_requested: 'Changes Requested',
  'Changes Requested': 'Changes Requested',
  ready: 'Final Video Ready',
  Ready: 'Final Video Ready',
  delivered: 'Delivered',
  Delivered: 'Delivered',
  cancelled: 'Cancelled',
  Cancelled: 'Cancelled',
};

export const GIFT_ORDER_STEPS = [
  { key: 'placed', label: 'Placed', desc: 'Order received' },
  { key: 'confirmed', label: 'Confirmed', desc: 'Crafting scheduled' },
  { key: 'in_progress', label: 'In Progress', desc: 'Artisans crafting' },
  { key: 'ready', label: 'Ready', desc: 'Ready for pickup/dispatch' },
  { key: 'delivered', label: 'Delivered', desc: 'Delivered / Completed' },
];

export const VIDEO_ORDER_STEPS = [
  { key: 'placed', label: 'Order Received', desc: 'Order received' },
  { key: 'confirmed', label: 'Confirmed & Scheduled', desc: 'Production scheduled' },
  { key: 'in_progress', label: 'In Production', desc: 'Video in production' },
  { key: 'draft_shared', label: 'Draft Shared', desc: 'Draft shared for review' },
  { key: 'ready', label: 'Final Video Ready', desc: 'Ready for download' },
  { key: 'delivered', label: 'Delivered', desc: 'Delivered / Completed' },
];

export const VIDEO_ORDER_STEPS_CHANGES = [
  { key: 'placed', label: 'Order Received', desc: 'Order received' },
  { key: 'confirmed', label: 'Confirmed & Scheduled', desc: 'Production scheduled' },
  { key: 'in_progress', label: 'In Production', desc: 'Video in production' },
  { key: 'changes_requested', label: 'Changes Requested', desc: 'Revisions in progress' },
  { key: 'ready', label: 'Final Video Ready', desc: 'Ready for download' },
  { key: 'delivered', label: 'Delivered', desc: 'Delivered / Completed' },
];

export function getOrderMilestoneSteps(orderType, status) {
  if (orderType === 'video') {
    return status === 'changes_requested' ? VIDEO_ORDER_STEPS_CHANGES : VIDEO_ORDER_STEPS;
  }
  return GIFT_ORDER_STEPS;
}

export function getOrderStepIndex(orderType, status) {
  if (status === 'cancelled') return -1;
  const steps = getOrderMilestoneSteps(orderType, status);
  const foundIdx = steps.findIndex((s) => s.key === status);
  if (foundIdx !== -1) return foundIdx;

  if (orderType === 'video') {
    if (status === 'draft_shared' || status === 'changes_requested') return 3;
    if (status === 'ready') return 4;
    if (status === 'delivered') return 5;
  }
  return 0;
}

export function StatusBadge({ status = 'placed', orderType = 'gift', className = '' }) {
  const isVideo = orderType === 'video';
  const label = isVideo && VIDEO_STATUS_LABELS[status]
    ? VIDEO_STATUS_LABELS[status]
    : (STATUS_CONFIG[status]?.label || status);

  const style = STATUS_CONFIG[status]?.style || 'bg-stone-50 text-stone-700 border-stone-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style} shadow-xs tracking-wide ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {label}
    </span>
  );
}
