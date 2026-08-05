import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'income' | 'expense' | 'warning' | 'info' | 'neutral' | 'success';
}

export function Badge({ children, variant = 'neutral', className, ...props }: BadgeProps) {
  const variants = {
    income: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/50 font-semibold',
    expense: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/50 font-semibold',
    warning: 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800/50 font-semibold',
    info: 'bg-teal-100 dark:bg-teal-950/60 text-teal-900 dark:text-teal-300 border border-teal-300 dark:border-teal-800/50 font-semibold',
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold',
    success: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
