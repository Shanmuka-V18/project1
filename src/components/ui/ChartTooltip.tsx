'use client';

import React from 'react';
import { formatCurrency } from '@/lib/utils';

export interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  currency?: boolean;
}

export function CustomChartTooltip({ active, payload, label, currency = true }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-xl text-xs z-50 pointer-events-none transition-colors">
      {label && <p className="font-bold text-slate-800 dark:text-slate-200 mb-1.5 border-b border-slate-100 dark:border-slate-800 pb-1">{label}</p>}
      <div className="space-y-1">
        {payload.map((item, index) => {
          const color = item.color || item.fill || '#14b8a6';
          const name = item.name || item.dataKey;
          const val = item.value;

          return (
            <div key={index} className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="font-semibold text-slate-700 dark:text-slate-300">{name}:</span>
              <span className="font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                {currency && typeof val === 'number' ? formatCurrency(val) : val}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
