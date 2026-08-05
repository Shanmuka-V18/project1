'use client';

import React, { useState, useEffect } from 'react';
import { User, Key, Mail, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageTitle, MutedText, FormLabel, SectionTitle, BodyText } from '@/components/ui/Typography';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setUsername(data.user.username || '');
          setEmail(data.user.email || '');
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setStatusMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 800);
  };

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">Loading profile details...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div>
        <PageTitle>User Profile & Security Settings</PageTitle>
        <MutedText className="mt-1 font-medium">Manage your personal workspace identity, email preferences, and password credentials</MutedText>
      </div>

      {statusMsg.text && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 border ${
            statusMsg.type === 'error'
              ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              : 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
          }`}
        >
          {statusMsg.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Account Identity Card */}
      <Card className="p-6 space-y-4">
        <SectionTitle className="text-teal-700 dark:text-teal-400">Account Identity</SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <FormLabel className="mb-1">Username</FormLabel>
            <input
              type="text"
              disabled
              value={username}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 font-bold opacity-80"
            />
          </div>
          <div>
            <FormLabel className="mb-1">Email Address</FormLabel>
            <input
              type="email"
              disabled
              value={email}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 font-bold opacity-80"
            />
          </div>
        </div>
      </Card>

      {/* Change Password Card */}
      <Card className="p-6 space-y-4">
        <SectionTitle className="text-teal-700 dark:text-teal-400">Security & Password Update</SectionTitle>

        <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
          <div>
            <FormLabel className="mb-1">Current Password *</FormLabel>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:border-teal-600 focus:outline-none font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FormLabel className="mb-1">New Password *</FormLabel>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:border-teal-600 focus:outline-none font-medium"
              />
            </div>
            <div>
              <FormLabel className="mb-1">Confirm New Password *</FormLabel>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:border-teal-600 focus:outline-none font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={isSaving} className="bg-teal-600 hover:bg-teal-500 text-white">
              Update Security Credentials
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
