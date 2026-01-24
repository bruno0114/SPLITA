import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const SkeletonBlock: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div
    className={`relative overflow-hidden rounded-2xl bg-slate-200/70 dark:bg-white/5 animate-pulse ${className}`}
  />
);

export default SkeletonBlock;
