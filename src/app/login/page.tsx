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

  // 18 Soft Floating Particles
  const particles = [
    { top: '15%', left: '12%', size: 4, delay: '0s' },
    { top: '25%', left: '82%', size: 6, delay: '1.5s' },
    { top: '45%', left: '8%', size: 3, delay: '3.2s' },
    { top: '65%', left: '88%', size: 5, delay: '0.8s' },
    { top: '80%', left: '18%', size: 4, delay: '4.1s' },
    { top: '20%', left: '48%', size: 3, delay: '2.4s' },
    { top: '75%', left: '60%', size: 5, delay: '1.2s' },
    { top: '35%', left: '92%', size: 4, delay: '3.7s' },
    { top: '85%', left: '78%', size: 3, delay: '0.5s' },
    { top: '10%', left: '72%', size: 5, delay: '2.9s' },
    { top: '55%', left: '14%', size: 4, delay: '1.9s' },
    { top: '30%', left: '22%', size: 3, delay: '4.5s' },
    { top: '70%', left: '32%', size: 4, delay: '2.1s' },
    { top: '90%', left: '42%', size: 5, delay: '3.0s' },
    { top: '18%', left: '35%', size: 3, delay: '1.1s' },
    { top: '62%', left: '75%', size: 4, delay: '4.8s' },
    { top: '40%', left: '85%', size: 3, delay: '2.7s' },
    { top: '82%', left: '8%', size: 5, delay: '0.3s' },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#020617] px-4 py-12 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-300">

      {/* ========================================================================
          AI FINTECH AURORA FLOW BACKGROUND (100% VISUAL UPGRADE)
          ======================================================================== */}

      {/* 1. Large Heavily Blurred Atmospheric Aurora Glow Sources */}
      <div className="absolute -top-44 -left-44 h-[550px] w-[550px] rounded-full bg-teal-500/20 dark:bg-teal-500/30 blur-[150px] animate-aurora-1 pointer-events-none" />
      <div className="absolute -bottom-44 -right-44 h-[600px] w-[600px] rounded-full bg-cyan-500/18 dark:bg-cyan-500/25 blur-[160px] animate-aurora-2 pointer-events-none" />
      <div className="absolute top-1/4 -right-24 h-[480px] w-[480px] rounded-full bg-indigo-500/18 dark:bg-indigo-600/25 blur-[140px] animate-aurora-3 pointer-events-none" />
      <div className="absolute bottom-1/4 -left-24 h-[480px] w-[480px] rounded-full bg-emerald-500/15 dark:bg-emerald-500/22 blur-[140px] animate-aurora-4 pointer-events-none" />

      {/* 2. Flowing Light Ribbons / Digital Energy Waves */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden animate-ribbon-wave opacity-15 dark:opacity-20">
        <svg className="w-full h-full" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M-100 300C300 150 700 450 1100 200C1300 75 1500 250 1600 350"
            stroke="url(#ribbonGrad1)"
            strokeWidth="1.5"
            strokeDasharray="8 6"
          />
          <path
            d="M-100 650C250 800 650 500 1050 750C1250 850 1500 600 1600 500"
            stroke="url(#ribbonGrad2)"
            strokeWidth="1.5"
          />
          <defs>
            <linearGradient id="ribbonGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ribbonGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
              <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.7" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 3. Soft Floating AI/Financial Particles (18 particles) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-teal-400 dark:bg-cyan-300 animate-particle-soft"
            style={{
              top: p.top,
              left: p.left,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: p.delay,
              boxShadow: '0 0 10px rgba(20, 184, 166, 0.6)',
            }}
          />
        ))}
      </div>

      {/* 4. Central Aura Immediately Behind Login Card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-teal-500/25 via-cyan-500/20 to-indigo-500/25 blur-3xl opacity-50 dark:opacity-70 pointer-events-none" />

      {/* ========================================================================
          MAIN LOGIN CARD (100% UNCHANGED COMPONENTS & STRUCTURE)
          ======================================================================== */}
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
