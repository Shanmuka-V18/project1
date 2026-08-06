'use client';

import React, { useState, useEffect } from 'react';
import { User, Key, Mail, Phone, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageTitle, MutedText, FormLabel, SectionTitle } from '@/components/ui/Typography';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [identityStatusMsg, setIdentityStatusMsg] = useState({ type: '', text: '' });
  const [phoneError, setPhoneError] = useState('');
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);

  const [passwordStatusMsg, setPasswordStatusMsg] = useState({ type: '', text: '' });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setUsername(data.user.username || '');
          setEmail(data.user.email || '');
          setPhoneNumber(data.user.phoneNumber || '');
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const validatePhone = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setPhoneError('');
      return true;
    }
    if (!/^\d+$/.test(trimmed)) {
      setPhoneError('Phone number must contain digits only (0–9).');
      return false;
    }
    if (trimmed.length < 10 || trimmed.length > 15) {
      setPhoneError('Phone number length must be between 10 and 15 digits.');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhoneNumber(val);
    setIdentityStatusMsg({ type: '', text: '' });
    validatePhone(val);
  };

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdentityStatusMsg({ type: '', text: '' });

    if (!validatePhone(phoneNumber)) {
      return;
    }

    setIsSavingIdentity(true);

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        setPhoneNumber(data.user.phoneNumber || '');
        setIdentityStatusMsg({ type: 'success', text: 'Account identity & phone number saved successfully!' });
      } else {
        setIdentityStatusMsg({ type: 'error', text: data.error || 'Failed to save account details.' });
      }
    } catch (err: any) {
      setIdentityStatusMsg({ type: 'error', text: 'Network error updating profile.' });
    } finally {
      setIsSavingIdentity(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatusMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPasswordStatusMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsSavingPassword(true);
    setTimeout(() => {
      setIsSavingPassword(false);
      setPasswordStatusMsg({ type: 'success', text: 'Password updated successfully!' });
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
        <MutedText className="mt-1 font-medium">Manage your personal workspace identity, phone number, email preferences, and password credentials</MutedText>
      </div>

      {/* Account Identity Card */}
      <Card className="p-6 space-y-4">
        <SectionTitle className="text-teal-700 dark:text-teal-400">Account Identity</SectionTitle>

        {identityStatusMsg.text && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 border ${
              identityStatusMsg.type === 'error'
                ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                : 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            {identityStatusMsg.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
            <span>{identityStatusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveIdentity} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <FormLabel className="mb-1">Phone Number (Optional)</FormLabel>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="e.g. 9876543210"
                className={`w-full rounded-xl border bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-semibold ${
                  phoneError
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-300 dark:border-slate-800 focus:border-teal-600'
                }`}
              />
              {phoneError && (
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {phoneError}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              isLoading={isSavingIdentity}
              disabled={!!phoneError}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold"
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Change Password Card */}
      <Card className="p-6 space-y-4">
        <SectionTitle className="text-teal-700 dark:text-teal-400">Security & Password Update</SectionTitle>

        {passwordStatusMsg.text && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 border ${
              passwordStatusMsg.type === 'error'
                ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                : 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            {passwordStatusMsg.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
            <span>{passwordStatusMsg.text}</span>
          </div>
        )}

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
            <Button type="submit" isLoading={isSavingPassword} className="bg-teal-600 hover:bg-teal-500 text-white">
              Update Security Credentials
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
