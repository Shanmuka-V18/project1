'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request');
      setMessage(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
        <div>
          <Link href="/login" className="inline-flex items-center text-xs text-teal-400 hover:underline mb-4">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to login
          </Link>
          <h2 className="text-xl font-bold text-slate-100">Reset your password</h2>
          <p className="mt-1 text-xs text-slate-400">Enter your email address and we'll send reset instructions.</p>
        </div>

        {message && (
          <div className="flex items-start space-x-2.5 rounded-xl bg-teal-950/60 p-3.5 text-xs text-teal-300 border border-teal-800/50">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-rose-950/60 p-3 text-xs text-rose-300 border border-rose-800/50">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full py-3">
            Send Reset Instructions
          </Button>
        </form>
      </div>
    </div>
  );
}
