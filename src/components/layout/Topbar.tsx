'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, User, LogOut, Key, Bot } from 'lucide-react';
import { useAppStore } from '@/store/useStore';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { MutedText, FormLabel, BodyText } from '@/components/ui/Typography';

export function Topbar() {
  const router = useRouter();
  const { toggleAiDrawer, unreadNotificationsCount, setUnreadNotificationsCount } = useAppStore();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});

    fetchNotifications();
  }, []);

  const fetchNotifications = () => {
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications) {
          setNotifications(data.notifications.slice(0, 4));
          setUnreadNotificationsCount(data.unreadCount || 0);
        }
      })
      .catch(() => {});
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const markAllAsRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    });
    fetchNotifications();
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-6 backdrop-blur-md transition-colors">
      {/* Search Input */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
        <input
          type="text"
          placeholder="Search transactions, invoices, GST..."
          className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60 py-2 pl-9 pr-4 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 font-medium"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Quick Launch AI Button */}
        <button
          onClick={toggleAiDrawer}
          className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:from-teal-500 hover:to-teal-600 transition-all glow-teal"
        >
          <Bot className="h-4 w-4" />
          <span className="hidden sm:inline">Ask AI Assistant</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
            className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Bell className="h-5 w-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {isNotifMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-4 shadow-2xl animate-in fade-in duration-150 z-50">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Notifications</span>
                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-teal-700 dark:text-teal-400 hover:underline font-semibold"
                  >
                    Mark read
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-600 dark:text-slate-400 py-4 text-center">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`rounded-xl p-2.5 text-xs transition-colors ${
                        n.isRead
                          ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                          : 'bg-teal-50 dark:bg-teal-950/40 text-slate-900 dark:text-slate-100 border border-teal-200 dark:border-teal-800/30'
                      }`}
                    >
                      <span className="font-bold block text-teal-800 dark:text-teal-300">{n.type}</span>
                      <p className="mt-1 font-medium">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setIsNotifMenuOpen(false)}
                  className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline"
                >
                  View All Notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center space-x-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-1.5 pr-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white font-bold text-xs">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{user?.username || 'User'}</span>
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-2 shadow-2xl animate-in fade-in duration-150 z-50">
              <div className="p-3 border-b border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{user?.username}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
              <div className="py-1 space-y-1">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <User className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                  My Profile
                </Link>
                <Link
                  href="/dashboard/profile"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Key className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                  Change Password
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                >
                  <LogOut className="mr-2 h-4 w-4 text-rose-600 dark:text-rose-400" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
