'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, Check, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageTitle, MutedText, SectionTitle, BodyText } from '@/components/ui/Typography';
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
        setUnreadNotificationsCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    });
    fetchNotifications();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <PageTitle>Notification Center</PageTitle>
          <MutedText className="mt-1 font-medium">Real-time alerts for budget limits, low balance, and invoice payment reminders</MutedText>
        </div>
        <Button onClick={markAllRead} variant="secondary" size="sm">
          <Check className="mr-1.5 h-4 w-4 text-teal-600 dark:text-teal-400" /> Mark All as Read
        </Button>
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
              className={`p-4 rounded-xl border transition-all flex items-start space-x-3.5 ${
                n.isRead
                  ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  : 'bg-teal-50/60 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800/40 text-slate-900 dark:text-slate-100 shadow-sm'
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800/50 mt-0.5">
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{n.type}</span>
                  <MutedText>{formatDate(n.createdAt)}</MutedText>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{n.message}</p>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
