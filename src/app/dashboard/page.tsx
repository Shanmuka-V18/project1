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
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div>
          <MutedText>Loading your financial dashboard...</MutedText>
        </div>
      </div>
    );
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
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 hover:scale-105 transition-all">
              <Plus className="mr-1.5 h-4 w-4" /> Add Income
            </Button>
          </Link>
          <Link href="/dashboard/expenses">
            <Button size="sm" variant="danger" className="hover:scale-105 transition-all">
              <Plus className="mr-1.5 h-4 w-4" /> Add Expense
            </Button>
          </Link>
          <Link href="/dashboard/invoices/new">
            <Button size="sm" variant="secondary" className="hover:scale-105 transition-all">
              <FileText className="mr-1.5 h-4 w-4 text-teal-600 dark:text-teal-400" /> Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* AI Financial Insight Banner */}
      {aiInsight && (
        <div className="relative z-10 overflow-hidden flex items-start space-x-4 rounded-2xl border border-teal-500/40 bg-gradient-to-r from-teal-50/90 dark:from-teal-950/60 via-white dark:via-slate-900 to-white dark:to-slate-900 p-4 shadow-lg glow-teal transition-all hover:border-teal-500/60">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600/20 dark:bg-teal-600/30 text-teal-700 dark:text-teal-300 border border-teal-500/40 shadow-sm animate-pulse">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-extrabold text-teal-800 dark:text-teal-300 uppercase tracking-wider">AI Financial Insight</span>
              <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 animate-spin-slow" />
            </div>
            <p className="mt-1 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">{aiInsight}</p>
          </div>
        </div>
      )}

      {/* Summary KPI Cards with Numeric Count-Up & Icon Glow Hover */}
      <div className="relative z-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Income */}
        <Card className="group border-l-4 border-l-emerald-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-500/40">
          <div className="flex items-center justify-between">
            <StatLabel>Total Income</StatLabel>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 transition-all duration-300 group-hover:scale-110 shadow-sm">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
              <AnimatedNumber value={summary?.totalIncome || 0} />
            </h2>
            <MutedText className="mt-1 flex items-center font-medium">
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mr-0.5" /> Current month cash inflows
            </MutedText>
          </div>
        </Card>

        {/* Total Expense */}
        <Card className="group border-l-4 border-l-rose-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-500/10 hover:border-rose-500/40">
          <div className="flex items-center justify-between">
            <StatLabel>Total Expense</StatLabel>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 transition-all duration-300 group-hover:scale-110 shadow-sm">
              <TrendingDown className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-extrabold text-rose-700 dark:text-rose-400">
              <AnimatedNumber value={summary?.totalExpense || 0} />
            </h2>
            <MutedText className="mt-1 flex items-center font-medium">
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 mr-0.5" /> Current month cash outflows
            </MutedText>
          </div>
        </Card>

        {/* Net Profit */}
        <Card className="group border-l-4 border-l-teal-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-teal-500/10 hover:border-teal-500/40">
          <div className="flex items-center justify-between">
            <StatLabel>Net Profit</StatLabel>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 transition-all duration-300 group-hover:scale-110 shadow-sm">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className={`text-2xl font-extrabold ${summary?.netProfit >= 0 ? 'text-teal-700 dark:text-teal-300' : 'text-rose-700 dark:text-rose-400'}`}>
              <AnimatedNumber value={summary?.netProfit || 0} />
            </h2>
            <MutedText className="mt-1 font-medium">Income minus expenses</MutedText>
          </div>
        </Card>

        {/* Health Score */}
        <Card className="group border-l-4 border-l-amber-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/10 hover:border-amber-500/40">
          <div className="flex items-center justify-between">
            <StatLabel>Health Score</StatLabel>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 transition-all duration-300 group-hover:scale-110 shadow-sm">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h2 className="text-2xl font-extrabold text-amber-700 dark:text-amber-300">
              <AnimatedNumber value={summary?.healthScore || 0} isCurrency={false} />
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/100</span>
            </h2>
            <Badge variant={summary?.healthScore >= 70 ? 'success' : 'warning'}>
              {summary?.healthRating || 'Fair'}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Income vs Expense Trend Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Income vs Expense Trend</CardTitle>
              <CardDescription>Monthly comparison over the last 6 months</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip content={<CustomChartTooltip />} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#059669" fillOpacity={1} fill="url(#incomeGrad)" isAnimationActive animationDuration={1000} animationEasing="ease-out" />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#dc2626" fillOpacity={1} fill="url(#expenseGrad)" isAnimationActive animationDuration={1000} animationEasing="ease-out" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Category Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>Current month by category</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            {formattedCategoryBreakdown.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                No expense entries for this month
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  {/* Outer theme-aware ring border */}
                  <Pie
                    data={[{ value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={82}
                    outerRadius={84.5}
                    dataKey="value"
                    isAnimationActive={false}
                    stroke="none"
                    legendType="none"
                    className="fill-slate-900 dark:fill-slate-100"
                  />
                  <Pie
                    data={formattedCategoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive
                    animationDuration={900}
                    animationEasing="ease-out"
                  >
                    {formattedCategoryBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                </RePieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <div className="relative z-10">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent Financial Transactions</CardTitle>
              <CardDescription>Latest income and expense entries</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/dashboard/income">
                <Button size="sm" variant="ghost">View All Income</Button>
              </Link>
              <Link href="/dashboard/expenses">
                <Button size="sm" variant="ghost">View All Expenses</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4"><TableHeading>Type</TableHeading></th>
                    <th className="py-3 px-4"><TableHeading>Source / Vendor</TableHeading></th>
                    <th className="py-3 px-4"><TableHeading>Category</TableHeading></th>
                    <th className="py-3 px-4"><TableHeading>Payment Method</TableHeading></th>
                    <th className="py-3 px-4"><TableHeading>Date</TableHeading></th>
                    <th className="py-3 px-4 text-right"><TableHeading>Amount</TableHeading></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {recentTransactions.map((tx: any, idx: number) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors duration-150"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <td className="py-3 px-4">
                        <Badge variant={tx.type === 'Income' ? 'income' : 'expense'}>
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {tx.source || tx.vendor || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{tx.category}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{tx.paymentMethod}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{formatDate(tx.date)}</td>
                      <td className={`py-3 px-4 text-right font-extrabold ${tx.type === 'Income' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                        {tx.type === 'Income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
