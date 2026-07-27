'use client';

import React from 'react';
import Providers from '../providers';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { FloatingChatDrawer } from '@/components/assistant/FloatingChatDrawer';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 transition-colors">
            {children}
          </main>
        </div>
        <FloatingChatDrawer />
      </div>
    </Providers>
  );
}
