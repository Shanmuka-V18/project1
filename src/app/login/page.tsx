'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageTitle, MutedText, FormLabel } from '@/components/ui/Typography';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
      }
    } catch (err: any) {
      setError('Network error. Please try again later.');
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
          <PageTitle className="mt-4">Welcome Back</PageTitle>
          <MutedText className="mt-1.5 font-medium">Log in to access your personal AI Financial & CA Assistant workspace</MutedText>
        </div>

        {error && (
          <div className="flex items-center space-x-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 p-3 text-xs font-semibold text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/50">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div>
            <FormLabel className="mb-1.5">Email Address</FormLabel>
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <FormLabel>Password</FormLabel>
              <Link href="/forgot-password" className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 py-3 pl-10 pr-4 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:border-teal-600 focus:outline-none font-semibold"
              />
            </div>
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full bg-teal-600 hover:bg-teal-500 py-3 text-white font-bold">
            Sign In to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>

        <div className="text-center text-xs">
          <span className="text-slate-600 dark:text-slate-400 font-medium">Don't have an account? </span>
          <Link href="/signup" className="font-bold text-teal-700 dark:text-teal-400 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
