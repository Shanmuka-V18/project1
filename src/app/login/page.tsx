'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@financialassistant.ai');
    setPassword('password123');
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@financialassistant.ai', password: 'password123' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Demo login failed');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand Banner */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-xl glow-teal">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-100 tracking-tight">AI Financial & CA Assistant</h2>
          <p className="mt-2 text-xs text-slate-400">Sign in to your private financial workspace</p>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-950/60 p-3 text-xs text-rose-300 border border-rose-800/50">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <Link href="/forgot-password" className="text-xs text-teal-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full py-3">
            <span>Sign In to Dashboard</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>

        <div className="relative border-t border-slate-800 pt-4">
          <button
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700 py-2.5 text-xs font-semibold text-teal-300 border border-teal-500/30 transition-all"
          >
            <ShieldCheck className="mr-2 h-4 w-4 text-teal-400" />
            Quick Demo One-Click Login
          </button>
        </div>

        <p className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link href="/signup" className="font-semibold text-teal-400 hover:underline">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}
