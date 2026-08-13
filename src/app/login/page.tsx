'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageTitle, MutedText, FormLabel } from '@/components/ui/Typography';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
        setIsSuccess(true);
        // Short smooth transition before dashboard redirect
        setTimeout(() => {
          router.push('/dashboard');
        }, 300);
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError('Network error. Please try again later.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 text-slate-900 dark:text-slate-100 overflow-hidden login-grid-bg transition-colors duration-300">
      {/* Moving Ambient Glowing Orbs */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-teal-500/10 dark:bg-teal-500/15 blur-3xl animate-login-orb-1 pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/10 dark:bg-teal-400/10 blur-3xl animate-login-orb-2 pointer-events-none" />

      {/* Floating Dot Particles */}
      <div className="absolute top-1/4 left-1/5 h-2 w-2 rounded-full bg-teal-500/30 dark:bg-teal-400/40 animate-login-particle pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 h-1.5 w-1.5 rounded-full bg-cyan-500/30 dark:bg-emerald-400/40 animate-login-particle pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Main Login Card Container */}
      <div
        className={cn(
          'relative z-10 w-full max-w-md space-y-7 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/85 p-8 backdrop-blur-xl shadow-2xl shadow-teal-500/10 dark:shadow-teal-950/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-teal-500/20 hover:border-teal-500/30',
          isSuccess && 'opacity-0 scale-95 duration-300 pointer-events-none'
        )}
      >
        {/* Header Section */}
        <div className="text-center">
          {/* Logo */}
          <div
            className="login-entrance-item mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-xl glow-teal transition-transform hover:scale-105"
            style={{ animationDelay: '0ms' }}
          >
            <Sparkles className="h-7 w-7" />
          </div>

          {/* Welcome Heading */}
          <div className="login-entrance-item" style={{ animationDelay: '100ms' }}>
            <PageTitle className="mt-4 text-2xl font-extrabold tracking-tight">Welcome Back</PageTitle>
          </div>

          {/* Subtitle */}
          <div className="login-entrance-item" style={{ animationDelay: '180ms' }}>
            <MutedText className="mt-1.5 font-medium">Log in to access your personal AI Financial & CA Assistant workspace</MutedText>
          </div>
        </div>

        {/* Error Alert Message */}
        {error && (
          <div className="flex items-center space-x-2 rounded-2xl bg-rose-100 dark:bg-rose-950/60 p-3.5 text-xs font-semibold text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/50 animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Email Field */}
          <div className="login-entrance-item" style={{ animationDelay: '260ms' }}>
            <FormLabel className="mb-1.5">Email Address</FormLabel>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-2xl border border-slate-300 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 py-3.5 pl-10 pr-4 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:bg-white dark:focus:bg-slate-900 focus:outline-none font-semibold transition-all duration-200 shadow-sm"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="login-entrance-item" style={{ animationDelay: '340ms' }}>
            <div className="flex items-center justify-between mb-1.5">
              <FormLabel>Password</FormLabel>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline transition-colors login-entrance-item"
                style={{ animationDelay: '420ms' }}
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-300 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 py-3.5 pl-10 pr-4 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:bg-white dark:focus:bg-slate-900 focus:outline-none font-semibold transition-all duration-200 shadow-sm"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="login-entrance-item" style={{ animationDelay: '500ms' }}>
            <Button
              type="submit"
              disabled={isLoading || isSuccess}
              className="w-full bg-teal-600 hover:bg-teal-500 py-3.5 text-white font-bold rounded-2xl shadow-lg shadow-teal-600/20 hover:-translate-y-0.5 hover:shadow-teal-500/25 active:translate-y-0 transition-all duration-200"
            >
              {isLoading ? (
                <span className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Authenticating...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </form>

        {/* Signup Footer Link */}
        <div className="text-center text-xs login-entrance-item" style={{ animationDelay: '580ms' }}>
          <span className="text-slate-600 dark:text-slate-400 font-medium">Don't have an account? </span>
          <Link href="/signup" className="font-bold text-teal-700 dark:text-teal-400 hover:underline transition-colors">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
