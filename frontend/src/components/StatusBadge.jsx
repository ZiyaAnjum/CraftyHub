import React from 'react';

const STATUS_STYLES = {
  Received: 'bg-amber-50 text-amber-800 border-amber-200/80',
  Confirmed: 'bg-blue-50 text-blue-800 border-blue-200/80',
  'In Progress': 'bg-blush-50 text-blush-700 border-blush-200',
  Ready: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Delivered: 'bg-stone-100 text-stone-700 border-stone-300',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function StatusBadge({ status = 'Received' }) {
  const style = STATUS_STYLES[status] || 'bg-stone-50 text-stone-700 border-stone-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} shadow-xs tracking-wide`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {status}
    </span>
  );
}
