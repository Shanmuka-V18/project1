'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  Plus,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CustomChartTooltip } from '@/components/ui/ChartTooltip';
import { PageTitle, MutedText, StatLabel, TableHeading } from '@/components/ui/Typography';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#0d9488', '#2563eb', '#d97706', '#db2777', '#7c3aed', '#dc2626', '#059669'];

/**
 * Animated Number Count-Up Component (GPU-friendly requestAnimationFrame tweening)
 * Animates numeric values from 0 to final target over ~1000ms with ease-out cubic curve.
 * Respects prefers-reduced-motion.
 */
function AnimatedNumber({ value, isCurrency = true }: { value: number; isCurrency?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      return;
    }

    let startTimestamp: number | null = null;
    const duration = 1000;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(easedProgress * value));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [value]);

  return <>{isCurrency ? formatCurrency(displayValue) : displayValue}</>;
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const { summary, trendData = [], categoryBreakdown = [], recentTransactions = [], aiInsight } = data || {};

  const formattedCategoryBreakdown = categoryBreakdown.map((item: any, index: number) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <div className="relative space-y-8 animate-in fade-in duration-300">

      {/* ========================================================================
          AURORA MESH AMBIENT BACKGROUND (Dashboard Scoped, Low Opacity 5-8%)
          ======================================================================== */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#2dd4bf]/10 dark:bg-[#2dd4bf]/12 blur-3xl animate-dashboard-aurora-1 pointer-events-none" />
      <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-[#4f46e5]/10 dark:bg-[#4f46e5]/12 blur-3xl animate-dashboard-aurora-2 pointer-events-none" />
      <div className="absolute -bottom-24 left-1/3 h-96 w-96 rounded-full bg-[#10b981]/10 dark:bg-[#10b981]/12 blur-3xl animate-dashboard-aurora-1 pointer-events-none" style={{ animationDelay: '5s' }} />

      {/* Header Banner & Quick Actions */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <PageTitle>Financial Overview</PageTitle>
          <MutedText className="mt-1 font-medium">Real-time performance and financial health analytics</MutedText>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard/income">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
              <Plus className="mr-1.5 h-4 w-4" /> Add Income
            </Button>
          </Link>
          <Link href="/dashboard/expenses">
            <Button size="sm" className="bg-rose-600 hover:bg-rose-500 text-white font-semibold">
              <Plus className="mr-1.5 h-4 w-4" /> Add Expense
            </Button>
          </Link>
          <Link href="/dashboard/invoices/new">
            <Button size="sm" className="bg-teal-600 hover:bg-teal-500 text-white font-semibold">
              <FileText className="mr-1.5 h-4 w-4" /> New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* AI Financial Insight Banner */}
      {aiInsight && (
        <Card className="relative z-10 bg-gradient-to-r from-teal-500/10 via-teal-600/5 to-indigo-500/10 border-teal-500/30 p-5 rounded-2xl shadow-sm">
          <div className="flex items-start space-x-3.5">
            <div className="rounded-xl bg-teal-500/20 p-2.5 text-teal-600 dark:text-teal-400 shrink-0 shadow-[0_0_12px_rgba(20,184,166,0.3)] animate-pulse">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-teal-800 dark:text-teal-300">AI Assistant Summary</h4>
              <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">{aiInsight}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Summary KPI Cards Grid */}
      <div className="relative z-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Income */}
        <Card className="p-5 hover:shadow-lg transition-all duration-300 border-l-4 border-l-emerald-500 hover:-translate-y-1 hover:border-emerald-500/50">
          <div className="flex items-center justify-between">
            <StatLabel>Total Income (Month)</StatLabel>
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              <AnimatedNumber value={summary?.totalIncome || 0} />
            </h3>
            <p className="mt-1.5 flex items-center text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" /> +12.4% vs last month
            </p>
          </div>
        </Card>

        {/* Total Expense */}
        <Card className="p-5 hover:shadow-lg transition-all duration-300 border-l-4 border-l-rose-500 hover:-translate-y-1 hover:border-rose-500/50">
          <div className="flex items-center justify-between">
            <StatLabel>Total Expenses (Month)</StatLabel>
            <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-600 dark:text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              <AnimatedNumber value={summary?.totalExpense || 0} />
            </h3>
            <p className="mt-1.5 flex items-center text-xs font-bold text-rose-700 dark:text-rose-400">
              <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" /> -4.1% vs last month
            </p>
          </div>
        </Card>

        {/* Net Profit */}
        <Card className="p-5 hover:shadow-lg transition-all duration-300 border-l-4 border-l-teal-500 hover:-translate-y-1 hover:border-teal-500/50">
          <div className="flex items-center justify-between">
            <StatLabel>Net Operating Profit</StatLabel>
            <div className="rounded-xl bg-teal-500/10 p-2.5 text-teal-600 dark:text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.2)]">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-black ${(summary?.netProfit || 0) >= 0 ? 'text-teal-700 dark:text-teal-300' : 'text-rose-700 dark:text-rose-400'}`}>
              <AnimatedNumber value={summary?.netProfit || 0} />
            </h3>
            <p className="mt-1.5 flex items-center text-xs font-bold text-teal-700 dark:text-teal-400">
              <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" /> Net Profit Margin: {summary?.totalIncome > 0 ? Math.round(((summary?.netProfit || 0) / summary?.totalIncome) * 100) : 0}%
            </p>
          </div>
        </Card>

        {/* Health Score */}
        <Card className="p-5 hover:shadow-lg transition-all duration-300 border-l-4 border-l-indigo-500 hover:-translate-y-1 hover:border-indigo-500/50">
          <div className="flex items-center justify-between">
            <StatLabel>Financial Health Score</StatLabel>
            <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-600 dark:text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              <AnimatedNumber value={summary?.healthScore || 0} isCurrency={false} /> <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/ 100</span>
            </h3>
            <Badge variant={summary?.healthScore >= 80 ? 'success' : summary?.healthScore >= 60 ? 'warning' : 'expense'}>
              {summary?.healthRating || 'Good'}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Analytics Charts Row */}
      <div className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trend Area Chart (6 Months) */}
        <Card className="lg:col-span-2 p-6 shadow-sm">
          <CardHeader className="px-0 pt-0 pb-4">
            <CardTitle>Income vs Expense Trend</CardTitle>
            <CardDescription>6-month historical monthly cash flow comparison</CardDescription>
          </CardHeader>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomChartTooltip />} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#expenseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Expense Category Breakdown Donut */}
        <Card className="p-6 shadow-sm">
          <CardHeader className="px-0 pt-0 pb-4">
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Category distribution for current month</CardDescription>
          </CardHeader>
          <div className="h-72 w-full">
            {formattedCategoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={formattedCategoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {formattedCategoryBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip formatter={(v: number) => formatCurrency(v)} />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(val) => <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{val}</span>}
                  />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                No expense data recorded this month
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <Card className="relative z-10 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <CardTitle>Recent Financial Activity</CardTitle>
            <CardDescription className="mt-0.5">Latest transactions recorded across income and expenses</CardDescription>
          </div>
          <Link href="/dashboard/income">
            <Button variant="ghost" size="sm" className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700">
              View All Activity →
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-3 px-3 font-semibold">Type</th>
                <th className="py-3 px-3 font-semibold">Category / Source</th>
                <th className="py-3 px-3 font-semibold">Date</th>
                <th className="py-3 px-3 font-semibold">Method</th>
                <th className="py-3 px-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {recentTransactions.map((tx: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="py-3 px-3">
                    <Badge variant={tx.type === 'Income' ? 'success' : 'expense'}>
                      {tx.type}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                    {tx.category || tx.source || 'General'}
                  </td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-medium">
                    {formatDate(tx.date)}
                  </td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-medium">
                    {tx.paymentMethod || 'UPI'}
                  </td>
                  <td className={`py-3 px-3 text-right font-bold ${tx.type === 'Income' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                    {tx.type === 'Income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
