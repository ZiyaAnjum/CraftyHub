import React from 'react';

const STATUS_CONFIG = {
  placed: { label: 'New / Placed', style: 'bg-amber-50 text-amber-800 border-amber-200/80' },
  Received: { label: 'Received', style: 'bg-amber-50 text-amber-800 border-amber-200/80' },
  confirmed: { label: 'Confirmed', style: 'bg-sky-50 text-sky-800 border-sky-200/80' },
  Confirmed: { label: 'Confirmed', style: 'bg-sky-50 text-sky-800 border-sky-200/80' },
  in_progress: { label: 'In Progress', style: 'bg-purple-50 text-purple-800 border-purple-200' },
  'In Progress': { label: 'In Progress', style: 'bg-purple-50 text-purple-800 border-purple-200' },
  ready: { label: 'Ready', style: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  Ready: { label: 'Ready', style: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  delivered: { label: 'Delivered', style: 'bg-stone-100 text-stone-700 border-stone-300' },
  Delivered: { label: 'Delivered', style: 'bg-stone-100 text-stone-700 border-stone-300' },
  cancelled: { label: 'Cancelled', style: 'bg-rose-50 text-rose-700 border-rose-200' },
  Cancelled: { label: 'Cancelled', style: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export function StatusBadge({ status = 'placed', className = '' }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    style: 'bg-stone-50 text-stone-700 border-stone-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.style} shadow-xs tracking-wide ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {config.label}
    </span>
  );
}
