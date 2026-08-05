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

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <PageTitle>Financial Overview</PageTitle>
          <MutedText className="mt-1 font-medium">Real-time performance and financial health analytics</MutedText>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard/income">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
              <Plus className="mr-1.5 h-4 w-4" /> Add Income
            </Button>
          </Link>
          <Link href="/dashboard/expenses">
            <Button size="sm" variant="danger">
              <Plus className="mr-1.5 h-4 w-4" /> Add Expense
            </Button>
          </Link>
          <Link href="/dashboard/invoices/new">
            <Button size="sm" variant="secondary">
              <FileText className="mr-1.5 h-4 w-4 text-teal-600 dark:text-teal-400" /> Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* AI Insight Banner */}
      {aiInsight && (
        <div className="flex items-start space-x-4 rounded-2xl border border-teal-500/40 bg-gradient-to-r from-teal-50 dark:from-teal-950/60 via-white dark:via-slate-900 to-white dark:to-slate-900 p-4 shadow-lg glow-teal transition-colors">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600/20 dark:bg-teal-600/30 text-teal-700 dark:text-teal-300 border border-teal-500/40">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider">AI Financial Insight</span>
            <p className="mt-1 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">{aiInsight}</p>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Income */}
        <Card className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <StatLabel>Total Income</StatLabel>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">{formatCurrency(summary?.totalIncome || 0)}</h2>
            <MutedText className="mt-1 flex items-center font-medium">
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mr-0.5" /> Current month cash inflows
            </MutedText>
          </div>
        </Card>

        {/* Total Expense */}
        <Card className="border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <StatLabel>Total Expense</StatLabel>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-extrabold text-rose-700 dark:text-rose-400">{formatCurrency(summary?.totalExpense || 0)}</h2>
            <MutedText className="mt-1 flex items-center font-medium">
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 mr-0.5" /> Current month cash outflows
            </MutedText>
          </div>
        </Card>

        {/* Net Profit */}
        <Card className="border-l-4 border-l-teal-500">
          <div className="flex items-center justify-between">
            <StatLabel>Net Profit</StatLabel>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className={`text-2xl font-extrabold ${summary?.netProfit >= 0 ? 'text-teal-700 dark:text-teal-300' : 'text-rose-700 dark:text-rose-400'}`}>
              {formatCurrency(summary?.netProfit || 0)}
            </h2>
            <MutedText className="mt-1 font-medium">Income minus expenses</MutedText>
          </div>
        </Card>

        {/* Health Score */}
        <Card className="border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <StatLabel>Health Score</StatLabel>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h2 className="text-2xl font-extrabold text-amber-700 dark:text-amber-300">{summary?.healthScore || 0}<span className="text-xs font-normal text-slate-500 dark:text-slate-400">/100</span></h2>
            <Badge variant={summary?.healthScore >= 70 ? 'success' : 'warning'}>
              {summary?.healthRating || 'Fair'}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                <Area type="monotone" dataKey="income" name="Income" stroke="#059669" fillOpacity={1} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#dc2626" fillOpacity={1} fill="url(#expenseGrad)" />
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
            {categoryBreakdown.length === 0 ? (
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
                    className="fill-slate-900 dark:fill-slate-100"
                  />
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                {recentTransactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
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
  );
}
