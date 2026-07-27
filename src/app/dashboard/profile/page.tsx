'use client';

import React, { useState, useEffect } from 'react';
import { User, Key, CheckCircle2, Lock, Mail, Camera } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setProfilePictureUrl(data.user.profilePictureUrl || '');
        }
      });
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profilePictureUrl,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setMessage('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      if (data.user) setUser(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return <div className="py-20 text-center text-xs text-slate-400">Loading user profile...</div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center">
          <User className="mr-2 h-6 w-6 text-teal-400" /> User Profile & Security
        </h1>
        <p className="text-xs text-slate-400 mt-1">Manage your account credentials, avatar, and password</p>
      </div>

      {message && (
        <div className="rounded-xl bg-teal-950/60 p-3.5 text-xs text-teal-300 border border-teal-800/50 flex items-center">
          <CheckCircle2 className="h-4 w-4 mr-2 text-teal-400" />
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-rose-950/60 p-3 text-xs text-rose-300 border border-rose-800/50">
          {error}
        </div>
      )}

      {/* Main Profile Settings Form */}
      <form onSubmit={handleUpdateProfile} className="space-y-6 text-xs">
        {/* Core Account Details Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center space-x-4 pb-4 border-b border-slate-800">
            <div className="relative">
              {profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt="Profile Avatar"
                  className="h-16 w-16 rounded-full object-cover border-2 border-teal-500 shadow-md"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-600 text-white font-extrabold text-xl shadow-md">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{user.username}</h3>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Username (Read-Only)</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  disabled
                  value={user.username}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 pl-10 pr-4 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email Address (Read-Only)</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 pl-10 pr-4 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Profile Picture Image URL (Optional)</label>
              <div className="relative">
                <Camera className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="url"
                  value={profilePictureUrl}
                  onChange={(e) => setProfilePictureUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Change Password Card */}
        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-slate-100 text-sm flex items-center text-teal-400 border-b border-slate-800 pb-2">
            <Key className="mr-2 h-4 w-4" /> Change Password
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" isLoading={isSubmitting} className="bg-teal-600 hover:bg-teal-500 py-3 px-8">
            Save Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
