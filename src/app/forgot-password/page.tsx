'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageTitle, MutedText, FormLabel } from '@/components/ui/Typography';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || 'Password reset link sent to your email.');
      } else {
        setError(data.error || 'Failed to process request.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg glow-teal">
            <Sparkles className="h-6 w-6" />
          </div>
          <PageTitle className="mt-4">Reset Password</PageTitle>
          <MutedText className="mt-1.5 font-medium">Enter your email address to receive password reset instructions</MutedText>
        </div>

        {message && (
          <div className="flex items-center space-x-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/50">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 p-3 text-xs font-semibold text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/50">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <FormLabel className="mb-1">Email Address</FormLabel>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 py-3 pl-10 pr-4 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:border-teal-600 focus:outline-none font-semibold"
              />
            </div>
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full bg-teal-600 hover:bg-teal-500 py-3 text-white font-bold">
            Send Reset Instructions
          </Button>
        </form>

        <div className="text-center text-xs">
          <Link href="/login" className="inline-flex items-center font-bold text-teal-700 dark:text-teal-400 hover:underline">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
