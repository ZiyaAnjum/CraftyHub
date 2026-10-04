import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function Skeleton({ className = '' }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`relative overflow-hidden bg-stone-200/60 rounded ${className}`}>
      {!shouldReduceMotion && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: 'linear',
          }}
        />
      )}
    </div>
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

export function GiftCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-soft flex flex-col justify-between">
      <div>
        <Skeleton className="aspect-[4/3] w-full rounded-none" />
        <div className="p-5 space-y-3">
          <Skeleton className="h-5 w-3/4 rounded-md" />
          <Skeleton className="h-3.5 w-full rounded" />
          <Skeleton className="h-3.5 w-2/3 rounded" />
        </div>
      </div>
      <div className="px-5 pb-5 pt-3 border-t border-stone-100 flex items-center justify-between">
        <Skeleton className="h-6 w-20 rounded" />
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
    </div>
  );
}

