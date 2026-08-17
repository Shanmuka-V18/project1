'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Download, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, FileText, Filter, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageTitle, MutedText, FormLabel, TableHeading, StatLabel, SectionTitle, BodyText } from '@/components/ui/Typography';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ReportsPage() {
  const [pnlData, setPnlData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'this-month' | 'last-month' | 'year' | 'all-time' | 'custom'>('this-month');

  // Custom Date Range State
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');

  useEffect(() => {
    if (period !== 'custom') {
      fetchPnL(period);
    }
  }, [period]);

  const fetchPnL = async (targetPeriod: string, fromStr?: string, toStr?: string) => {
    setIsLoading(true);
    try {
      let url = `/api/reports/pnl?period=${targetPeriod}`;
      if (targetPeriod === 'custom' && fromStr && toStr) {
        url += `&from=${fromStr}&to=${toStr}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setPnlData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: 'this-month' | 'last-month' | 'year' | 'all-time' | 'custom') => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      setCustomFrom('');
      setCustomTo('');
      setAppliedFrom('');
      setAppliedTo('');
    }
  };

  const handleGenerateCustomReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFrom || !customTo || customTo < customFrom) return;
    setAppliedFrom(customFrom);
    setAppliedTo(customTo);
    fetchPnL('custom', customFrom, customTo);
  };

  // Custom Range Validation
  const isCustomValid = Boolean(customFrom && customTo && customTo >= customFrom);
  const isCustomError = Boolean(customFrom && customTo && customTo < customFrom);

  const pdfUrl = period === 'custom' && appliedFrom && appliedTo
    ? `/api/reports/pnl/pdf?period=custom&from=${appliedFrom}&to=${appliedTo}`
    : `/api/reports/pnl/pdf?period=${period}`;

  if (isLoading && !pnlData) {
    return <div className="py-20 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">Generating Profit & Loss Report...</div>;
  }

  const {
    periodLabel = 'Current Month',
    comparisonLabel = 'vs Previous Month',
    hasPrevData = false,
    currentMonth = {},
    comparison = {},
    breakdown = {},
  } = pnlData || {};

  const revenue = currentMonth.revenue || 0;
  const expenses = currentMonth.expenses || 0;
  const netIncome = currentMonth.netIncome || 0;
  const profitMargin = currentMonth.profitMargin || 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <PageTitle>Profit & Loss (P&L) Statement</PageTitle>
          <MutedText className="mt-1 font-medium">Automated financial performance summary and period-over-period revenue growth comparison</MutedText>
        </div>
        <div className="flex items-center space-x-3">
          <a href={pdfUrl} download>
            <Button className="bg-teal-600 hover:bg-teal-500 text-white" disabled={period === 'custom' && (!appliedFrom || !appliedTo)}>
              <Download className="mr-2 h-4 w-4" /> Download P&L Statement
            </Button>
          </a>
        </div>
      </div>

      {/* Period Filter Toolbar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Reporting Period:</span>
            <div className="flex flex-wrap items-center rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 gap-1">
              <button
                onClick={() => handlePeriodChange('this-month')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  period === 'this-month' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Current Month
              </button>
              <button
                onClick={() => handlePeriodChange('last-month')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  period === 'last-month' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Previous Month
              </button>
              <button
                onClick={() => handlePeriodChange('year')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  period === 'year' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Full Year
              </button>
              <button
                onClick={() => handlePeriodChange('all-time')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  period === 'all-time' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => handlePeriodChange('custom')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  period === 'custom' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Custom Range
              </button>
            </div>
          </div>
        </div>

        {/* Custom Range Date Inputs Panel */}
        {period === 'custom' && (
          <form onSubmit={handleGenerateCustomReport} className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-end gap-4 text-xs">
              <div>
                <FormLabel className="mb-1 block">From Date</FormLabel>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 focus:border-teal-500 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <FormLabel className="mb-1 block">To Date</FormLabel>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 focus:border-teal-500 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={!isCustomValid || isLoading}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2 text-xs"
              >
                Generate Report
              </Button>
            </div>

            {/* Validation Error Message */}
            {isCustomError && (
              <div className="flex items-center space-x-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold animate-in fade-in">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>To Date must be on or after From Date</span>
              </div>
            )}
          </form>
        )}
      </Card>

      {/* KPI Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Revenue Card */}
        <Card className="border-l-4 border-l-emerald-500">
          <StatLabel>{periodLabel} Revenue</StatLabel>
          <h3 className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-2">{formatCurrency(revenue)}</h3>
          <div className="mt-2 flex items-center text-xs font-semibold">
            {period === 'all-time' ? (
              <span className="text-slate-500 dark:text-slate-400">Total cumulative revenue</span>
            ) : !hasPrevData ? (
              <span className="text-slate-500 dark:text-slate-400">Baseline period (No prior data {comparisonLabel})</span>
            ) : comparison.revenueGrowth >= 0 ? (
              <span className="flex items-center text-emerald-700 dark:text-emerald-400">
                <ArrowUpRight className="h-4 w-4 mr-0.5" /> +{comparison.revenueGrowth}% {comparisonLabel}
              </span>
            ) : (
              <span className="flex items-center text-rose-700 dark:text-rose-400">
                <ArrowDownRight className="h-4 w-4 mr-0.5" /> {comparison.revenueGrowth}% {comparisonLabel}
              </span>
            )}
          </div>
        </Card>

        {/* Operating Expenses Card */}
        <Card className="border-l-4 border-l-rose-500">
          <StatLabel>{periodLabel} Expenses</StatLabel>
          <h3 className="text-2xl font-extrabold text-rose-700 dark:text-rose-400 mt-2">{formatCurrency(expenses)}</h3>
          <div className="mt-2 flex items-center text-xs font-semibold">
            {period === 'all-time' ? (
              <span className="text-slate-500 dark:text-slate-400">Total cumulative expenses</span>
            ) : !hasPrevData ? (
              <span className="text-slate-500 dark:text-slate-400">Baseline period (No prior data {comparisonLabel})</span>
            ) : comparison.expenseGrowth <= 0 ? (
              <span className="flex items-center text-emerald-700 dark:text-emerald-400">
                <ArrowDownRight className="h-4 w-4 mr-0.5" /> {comparison.expenseGrowth}% Reduced Outflow ({comparisonLabel})
              </span>
            ) : (
              <span className="flex items-center text-rose-700 dark:text-rose-400">
                <ArrowUpRight className="h-4 w-4 mr-0.5" /> +{comparison.expenseGrowth}% Increased Expense ({comparisonLabel})
              </span>
            )}
          </div>
        </Card>

        {/* Net Profit Card */}
        <Card className="border-l-4 border-l-teal-500">
          <StatLabel>{periodLabel} Net Profit</StatLabel>
          <h3 className={`text-2xl font-extrabold mt-2 ${netIncome >= 0 ? 'text-teal-700 dark:text-teal-300' : 'text-rose-700 dark:text-rose-400'}`}>
            {formatCurrency(netIncome)}
          </h3>
          <div className="mt-2">
            <Badge variant={netIncome >= 0 ? 'success' : 'expense'}>
              Margin: {profitMargin}%
            </Badge>
          </div>
        </Card>
      </div>

      {/* P&L Statement Details Table */}
      <Card className="p-6">
        <SectionTitle className="mb-4 text-teal-700 dark:text-teal-400">{periodLabel} P&L Income Statement</SectionTitle>

        <div className="space-y-4 text-xs">
          {/* Revenue Section */}
          <div className="space-y-2">
            <div className="flex justify-between font-bold border-b border-slate-200 dark:border-slate-800 pb-2 text-slate-900 dark:text-slate-100 text-sm">
              <span>Operating Revenue & Inflows</span>
              <span className="text-emerald-700 dark:text-emerald-400">{formatCurrency(revenue)}</span>
            </div>
            {breakdown.incomeCategories && Object.keys(breakdown.incomeCategories).length > 0 ? (
              Object.entries(breakdown.incomeCategories).map(([cat, val]: any) => (
                <div key={cat} className="flex justify-between pl-4 text-slate-700 dark:text-slate-300 font-medium">
                  <span>{cat}</span>
                  <span className="font-semibold">{formatCurrency(val)}</span>
                </div>
              ))
            ) : (
              <div className="pl-4 text-slate-500 dark:text-slate-400 font-medium italic">No revenue entries recorded for this period</div>
            )}
          </div>

          {/* Expenses Section */}
          <div className="space-y-2 pt-4">
            <div className="flex justify-between font-bold border-b border-slate-200 dark:border-slate-800 pb-2 text-slate-900 dark:text-slate-100 text-sm">
              <span>Operating Expenses & Outflows</span>
              <span className="text-rose-700 dark:text-rose-400">-{formatCurrency(expenses)}</span>
            </div>
            {breakdown.expenseCategories && Object.keys(breakdown.expenseCategories).length > 0 ? (
              Object.entries(breakdown.expenseCategories).map(([cat, val]: any) => (
                <div key={cat} className="flex justify-between pl-4 text-slate-700 dark:text-slate-300 font-medium">
                  <span>{cat}</span>
                  <span className="font-semibold">-{formatCurrency(val)}</span>
                </div>
              ))
            ) : (
              <div className="pl-4 text-slate-500 dark:text-slate-400 font-medium italic">No expense entries recorded for this period</div>
            )}
          </div>

          {/* Net Profit Summary Row */}
          <div className="pt-4 border-t-2 border-slate-300 dark:border-slate-700 flex justify-between font-extrabold text-base text-slate-900 dark:text-slate-100">
            <span>Net Operating Income (EBITDA)</span>
            <span className={netIncome >= 0 ? 'text-teal-700 dark:text-teal-300' : 'text-rose-700 dark:text-rose-400'}>
              {formatCurrency(netIncome)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
