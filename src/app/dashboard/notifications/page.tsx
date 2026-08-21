'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, Check, Trash2, ShieldAlert, FileText, PieChart } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageTitle, MutedText } from '@/components/ui/Typography';
import { formatDate } from '@/lib/utils';
import { useAppStore } from '@/store/useStore';

export default function NotificationsPage() {
  const { setUnreadNotificationsCount } = useAppStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        const count = data.notifications.filter((n: any) => !n.isRead).length;
        setUnreadNotificationsCount(count);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const markSingleRead = async (id: string, isAlreadyRead: boolean) => {
    if (isAlreadyRead) return;

    // Optimistic UI update
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    setNotifications(updated);
    const newCount = updated.filter((n) => !n.isRead).length;
    setUnreadNotificationsCount(newCount);

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    // Optimistic UI update
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    setUnreadNotificationsCount(0);

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    setUnreadNotificationsCount(updated.filter((n) => !n.isRead).length);

    try {
      await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'Budget Exceeded':
        return <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />;
      case 'Budget Reminder':
        return <PieChart className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case 'Low Balance':
        return <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />;
      case 'Invoice Due':
        return <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Bell className="h-4 w-4 text-teal-600 dark:text-teal-400" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <PageTitle>Notification Center</PageTitle>
          <MutedText className="mt-1 font-medium">Real-time alerts for budget limits, cash reserves, and invoice due dates</MutedText>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllRead} variant="secondary" size="sm" className="font-semibold text-xs">
            <Check className="mr-1.5 h-4 w-4 text-teal-600 dark:text-teal-400" /> Mark All as Read
          </Button>
        )}
      </div>

      <Card className="p-6 space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">No notifications logged yet.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markSingleRead(n.id, n.isRead)}
              className={`p-4 rounded-xl transition-all duration-300 flex items-start space-x-3.5 cursor-pointer ${
                n.isRead
                  ? 'bg-slate-50/70 dark:bg-slate-900/40 border-l-4 border-l-slate-300 dark:border-l-slate-800 border border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-400'
                  : 'bg-teal-50/70 dark:bg-teal-950/40 border-l-4 border-l-teal-500 border border-teal-200 dark:border-teal-800/60 text-slate-900 dark:text-slate-100 shadow-sm'
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-950 p-2 shadow-sm border border-slate-200/80 dark:border-slate-800 mt-0.5">
                {getIconForType(n.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-teal-500 shrink-0 inline-block shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                    )}
                    <span className={`font-extrabold text-sm ${n.isRead ? 'text-slate-700 dark:text-slate-300 font-bold' : 'text-slate-900 dark:text-slate-100 font-black'}`}>
                      {n.type}
                    </span>
                    {!n.isRead && (
                      <Badge variant="info" className="text-[10px] py-0 px-1.5">Unread</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <MutedText className="text-[11px]">{formatDate(n.createdAt)}</MutedText>
                    <button
                      onClick={(e) => deleteNotification(n.id, e)}
                      title="Delete notification"
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className={`text-xs font-medium leading-relaxed ${n.isRead ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {n.message}
                </p>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
