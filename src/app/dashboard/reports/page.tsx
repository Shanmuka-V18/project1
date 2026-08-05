'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Download, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageTitle, MutedText, FormLabel, TableHeading, StatLabel, SectionTitle, BodyText } from '@/components/ui/Typography';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ReportsPage() {
  const [pnlData, setPnlData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/pnl')
      .then((res) => res.json())
      .then((data) => {
        setPnlData(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">Generating Profit & Loss Report...</div>;
  }

  const { currentMonth = {}, comparison = {}, breakdown = {} } = pnlData || {};

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <PageTitle>Profit & Loss (P&L) Statement</PageTitle>
          <MutedText className="mt-1 font-medium">Automated financial performance summary and period-over-period revenue growth comparison</MutedText>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-500 text-white">
          <Download className="mr-2 h-4 w-4" /> Download P&L Statement
        </Button>
      </div>

      {/* KPI Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Revenue */}
        <Card className="border-l-4 border-l-emerald-500">
          <StatLabel>Gross Operating Revenue</StatLabel>
          <h3 className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-2">{formatCurrency(currentMonth.revenue || 0)}</h3>
          <div className="mt-2 flex items-center text-xs font-semibold">
            {comparison.revenueGrowth >= 0 ? (
              <span className="flex items-center text-emerald-700 dark:text-emerald-400">
                <ArrowUpRight className="h-4 w-4 mr-0.5" /> +{comparison.revenueGrowth}% MoM Growth
              </span>
            ) : (
              <span className="flex items-center text-rose-700 dark:text-rose-400">
                <ArrowDownRight className="h-4 w-4 mr-0.5" /> {comparison.revenueGrowth}% MoM Decline
              </span>
            )}
          </div>
        </Card>

        {/* Operating Expenses */}
        <Card className="border-l-4 border-l-rose-500">
          <StatLabel>Total Operating Expenses</StatLabel>
          <h3 className="text-2xl font-extrabold text-rose-700 dark:text-rose-400 mt-2">{formatCurrency(currentMonth.expenses || 0)}</h3>
          <div className="mt-2 flex items-center text-xs font-semibold">
            {comparison.expenseGrowth <= 0 ? (
              <span className="flex items-center text-emerald-700 dark:text-emerald-400">
                <ArrowDownRight className="h-4 w-4 mr-0.5" /> {comparison.expenseGrowth}% Reduced Outflow
              </span>
            ) : (
              <span className="flex items-center text-rose-700 dark:text-rose-400">
                <ArrowUpRight className="h-4 w-4 mr-0.5" /> +{comparison.expenseGrowth}% Increased Expense
              </span>
            )}
          </div>
        </Card>

        {/* Net Operating Income */}
        <Card className="border-l-4 border-l-teal-500">
          <StatLabel>Net Profit / Margin</StatLabel>
          <h3 className={`text-2xl font-extrabold mt-2 ${currentMonth.netIncome >= 0 ? 'text-teal-700 dark:text-teal-300' : 'text-rose-700 dark:text-rose-400'}`}>
            {formatCurrency(currentMonth.netIncome || 0)}
          </h3>
          <div className="mt-2">
            <Badge variant={currentMonth.netIncome >= 0 ? 'success' : 'expense'}>
              Margin: {currentMonth.profitMargin || 0}%
            </Badge>
          </div>
        </Card>
      </div>

      {/* P&L Statement Details Table */}
      <Card className="p-6">
        <SectionTitle className="mb-4 text-teal-700 dark:text-teal-400">Monthly P&L Income Statement</SectionTitle>

        <div className="space-y-4 text-xs">
          {/* Revenue Section */}
          <div className="space-y-2">
            <div className="flex justify-between font-bold border-b border-slate-200 dark:border-slate-800 pb-2 text-slate-900 dark:text-slate-100 text-sm">
              <span>Operating Revenue & Inflows</span>
              <span className="text-emerald-700 dark:text-emerald-400">{formatCurrency(currentMonth.revenue || 0)}</span>
            </div>
            {breakdown.incomeCategories &&
              Object.entries(breakdown.incomeCategories).map(([cat, val]: any) => (
                <div key={cat} className="flex justify-between pl-4 text-slate-700 dark:text-slate-300 font-medium">
                  <span>{cat}</span>
                  <span className="font-semibold">{formatCurrency(val)}</span>
                </div>
              ))}
          </div>

          {/* Expenses Section */}
          <div className="space-y-2 pt-4">
            <div className="flex justify-between font-bold border-b border-slate-200 dark:border-slate-800 pb-2 text-slate-900 dark:text-slate-100 text-sm">
              <span>Operating Expenses & Outflows</span>
              <span className="text-rose-700 dark:text-rose-400">-{formatCurrency(currentMonth.expenses || 0)}</span>
            </div>
            {breakdown.expenseCategories &&
              Object.entries(breakdown.expenseCategories).map(([cat, val]: any) => (
                <div key={cat} className="flex justify-between pl-4 text-slate-700 dark:text-slate-300 font-medium">
                  <span>{cat}</span>
                  <span className="font-semibold">-{formatCurrency(val)}</span>
                </div>
              ))}
          </div>

          {/* Net Profit Summary Row */}
          <div className="pt-4 border-t-2 border-slate-300 dark:border-slate-700 flex justify-between font-extrabold text-base text-slate-900 dark:text-slate-100">
            <span>Net Operating Income (EBITDA)</span>
            <span className={currentMonth.netIncome >= 0 ? 'text-teal-700 dark:text-teal-300' : 'text-rose-700 dark:text-rose-400'}>
              {formatCurrency(currentMonth.netIncome || 0)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
