'use client';

import React from 'react';
import { formatCurrency } from '@/lib/utils';

export interface CustomChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  currency?: boolean;
}

export function CustomChartTooltip({
  active,
  payload,
  label,
  currency = true,
}: CustomChartTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-xl text-xs text-slate-900 dark:text-slate-100 z-50">
        {label && <p className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1 mb-2">{label}</p>}
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => {
            const name = entry.name || entry.dataKey || 'Value';
            const value = entry.value;
            const color = entry.color || entry.fill || '#14b8a6';

            return (
              <div key={`item-${index}`} className="flex items-center justify-between space-x-4">
                <span className="flex items-center font-semibold text-slate-700 dark:text-slate-300">
                  <span
                    className="mr-2 h-2.5 w-2.5 rounded-full inline-block"
                    style={{ backgroundColor: color }}
                  />
                  {name}:
                </span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">
                  {currency ? formatCurrency(value) : value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
