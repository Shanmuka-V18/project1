'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Trash2, AlertTriangle, FileText, DollarSign, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { useAppStore } from '@/store/useStore';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setUnreadNotificationsCount } = useAppStore();

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

  const markSingleRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchNotifications();
  };

  const deleteNotif = async (id: string) => {
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
    fetchNotifications();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center">
            <Bell className="mr-2 h-6 w-6 text-teal-400" /> Notifications Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">Budget alerts, invoice due dates, low balance warnings, and report notifications</p>
        </div>
        <Button onClick={markAllRead} variant="secondary" size="sm">
          <CheckCircle2 className="mr-1.5 h-4 w-4 text-teal-400" /> Mark All as Read
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-slate-800">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No notifications found.</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 flex items-start justify-between space-x-4 transition-colors ${
                  n.isRead ? 'bg-slate-900/40 text-slate-400' : 'bg-teal-950/20 text-slate-200 border-l-4 border-l-teal-500'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    {n.type.includes('Budget') ? (
                      <AlertTriangle className="h-5 w-5 text-amber-400" />
                    ) : n.type.includes('Invoice') ? (
                      <FileText className="h-5 w-5 text-teal-400" />
                    ) : n.type.includes('Balance') ? (
                      <DollarSign className="h-5 w-5 text-rose-400" />
                    ) : (
                      <Calendar className="h-5 w-5 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-200">{n.type}</span>
                      {!n.isRead && <Badge variant="info">New</Badge>}
                      <span className="text-[10px] text-slate-500">{formatDate(n.createdAt)}</span>
                    </div>
                    <p className="text-xs mt-1 text-slate-300">{n.message}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={() => markSingleRead(n.id)}
                      className="rounded p-1.5 text-xs text-teal-400 hover:bg-slate-800"
                    >
                      Read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotif(n.id)}
                    className="rounded p-1.5 text-xs text-slate-500 hover:bg-slate-800 hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
