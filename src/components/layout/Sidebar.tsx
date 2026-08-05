'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  PieChart,
  FileText,
  Calculator,
  BarChart3,
  ShieldCheck,
  Bot,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, toggleSidebar, unreadNotificationsCount } = useAppStore();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Income Tracker', href: '/dashboard/income', icon: TrendingUp },
    { label: 'Expense Tracker', href: '/dashboard/expenses', icon: TrendingDown },
    { label: 'Budget Planner', href: '/dashboard/budget', icon: PieChart },
    { label: 'Invoices', href: '/dashboard/invoices', icon: FileText },
    { label: 'GST Calculator', href: '/dashboard/gst', icon: Calculator },
    { label: 'P&L Reports', href: '/dashboard/reports', icon: BarChart3 },
    { label: 'Health Score', href: '/dashboard/health-score', icon: ShieldCheck },
    { label: 'AI Assistant', href: '/dashboard/assistant', icon: Bot, badge: 'AI' },
    {
      label: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell,
      count: unreadNotificationsCount > 0 ? unreadNotificationsCount : null,
    },
    { label: 'Profile', href: '/dashboard/profile', icon: User },
  ];

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-all duration-300 z-30',
        isSidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        <Link href="/dashboard" className="flex items-center space-x-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-lg glow-teal">
            <Sparkles className="h-5 w-5" />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm tracking-wide">FINANCIAL AI</span>
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400">CA ASSISTANT</span>
            </div>
          )}
        </Link>
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150',
                isActive
                  ? 'bg-teal-50 dark:bg-teal-600/20 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-500/30'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100',
                  !isSidebarOpen && 'mx-auto'
                )}
              />
              {isSidebarOpen && <span className="ml-3 truncate">{item.label}</span>}
              {isSidebarOpen && item.badge && (
                <span className="ml-auto rounded-full bg-teal-100 dark:bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-500/40">
                  {item.badge}
                </span>
              )}
              {isSidebarOpen && item.count && (
                <span className="ml-auto rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile Snippet */}
      {isSidebarOpen && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center space-x-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 p-2.5 border border-slate-200 dark:border-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-white font-bold text-xs">
              FA
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Demo User</span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate">demo@financialassistant.ai</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
