import React from 'react';

export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-stone-200/70 via-stone-100 to-stone-200/70 rounded ${className}`}
    />
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white/80 border border-stone-200/80 rounded-2xl p-5 shadow-soft space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-28 rounded-md" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
      </div>
      <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>
    </div>
  );
}
