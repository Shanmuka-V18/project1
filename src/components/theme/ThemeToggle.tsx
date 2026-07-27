'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Theme"
        className="flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
      >
        {theme === 'light' ? (
          <Sun className="h-5 w-5 text-amber-500" />
        ) : theme === 'dark' ? (
          <Moon className="h-5 w-5 text-teal-400" />
        ) : (
          <Monitor className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-1.5 shadow-xl animate-in fade-in duration-150 z-50">
          <button
            onClick={() => {
              setTheme('light');
              setIsOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
              theme === 'light'
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center">
              <Sun className="mr-2 h-4 w-4 text-amber-500" /> Light
            </span>
            {theme === 'light' && <Check className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />}
          </button>

          <button
            onClick={() => {
              setTheme('dark');
              setIsOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center">
              <Moon className="mr-2 h-4 w-4 text-teal-500" /> Dark
            </span>
            {theme === 'dark' && <Check className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />}
          </button>

          <button
            onClick={() => {
              setTheme('system');
              setIsOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
              theme === 'system'
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center">
              <Monitor className="mr-2 h-4 w-4 text-slate-400" /> System
            </span>
            {theme === 'system' && <Check className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />}
          </button>
        </div>
      )}
    </div>
  );
}
