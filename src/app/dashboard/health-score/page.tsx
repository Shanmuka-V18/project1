'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, TrendingUp, AlertCircle, CheckCircle2, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CustomChartTooltip } from '@/components/ui/ChartTooltip';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function HealthScorePage() {
  const [healthData, setHealthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health-score')
      .then((res) => res.json())
      .then((data) => {
        setHealthData(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-slate-500 dark:text-slate-400">Calculating your composite Financial Health Score...</div>;
  }

  const { currentScore = 0, rating = 'Fair', factors = {}, suggestions = [], trendHistory = [], metrics = {} } = healthData || {};

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Financial Health Score</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Composite 0–100 score evaluating savings rate, expense ratio, budget adherence, and stability</p>
      </div>

      {/* Main Score Gauge Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <Card className="lg:col-span-5 p-8 flex flex-col items-center justify-center text-center glow-teal border-t-4 border-t-teal-500">
          <div className="relative flex items-center justify-center h-44 w-44 rounded-full bg-gradient-to-b from-teal-500/20 to-white dark:to-slate-900 border-8 border-teal-500 shadow-2xl">
            <div className="flex flex-col items-center">
              <span className="text-5xl font-extrabold text-teal-600 dark:text-teal-300 tracking-tight">{currentScore}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mt-1">Out of 100</span>
            </div>
          </div>
          <div className="mt-6 space-y-1">
            <Badge variant={currentScore >= 70 ? 'success' : 'warning'} className="px-4 py-1 text-sm">
              {rating} Health
            </Badge>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Evaluated against monthly income & budget compliance</p>
          </div>
        </Card>

        {/* Contributing Factors Breakdown Grid */}
        <Card className="lg:col-span-7 p-6 space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center text-teal-600 dark:text-teal-400">
            <Award className="mr-2 h-4 w-4" /> Score Factor Breakdown
          </h3>

          <div className="space-y-3 text-xs">
            {/* Savings Rate Factor */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Savings Rate (25 Pts Max)</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Current savings rate: {metrics.savingsRate}%</span>
              </div>
              <span className="font-extrabold text-teal-600 dark:text-teal-300 text-base">{factors.savingsRateScore}/25</span>
            </div>

            {/* Expense Ratio Factor */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Expense-to-Income Ratio (25 Pts Max)</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Controlled outflows relative to gross income</span>
              </div>
              <span className="font-extrabold text-teal-600 dark:text-teal-300 text-base">{factors.expenseRatioScore}/25</span>
            </div>

            {/* Budget Adherence Factor */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Budget Adherence (25 Pts Max)</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{metrics.exceededBudgets} out of {metrics.activeBudgets} budgets exceeded</span>
              </div>
              <span className="font-extrabold text-teal-600 dark:text-teal-300 text-base">{factors.budgetAdherenceScore}/25</span>
            </div>

            {/* Emergency Reserve Factor */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Emergency Reserve Buffer (15 Pts Max)</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Liquidity cushion for cash flow protection</span>
              </div>
              <span className="font-extrabold text-teal-600 dark:text-teal-300 text-base">{factors.emergencyFundScore}/15</span>
            </div>

            {/* Income Consistency Factor */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Income Consistency (10 Pts Max)</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Regularity of monthly inflows</span>
              </div>
              <span className="font-extrabold text-teal-600 dark:text-teal-300 text-base">{factors.incomeConsistencyScore}/10</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Historical Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-4 w-4 text-teal-600 dark:text-teal-400" /> Historical Score Trend
          </CardTitle>
          <CardDescription>6-Month Health Score Trajectory</CardDescription>
        </CardHeader>
        <div className="h-64 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendHistory}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
              <Tooltip content={<CustomChartTooltip currency={false} />} />
              <Area type="monotone" dataKey="score" name="Health Score" stroke="#14b8a6" fill="url(#scoreGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Actionable AI Recommendations */}
      <Card className="p-6">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-4 flex items-center text-teal-600 dark:text-teal-400 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Sparkles className="mr-2 h-4 w-4" /> Actionable Recommendations to Elevate Your Score
        </h3>
        <div className="space-y-3 text-xs">
          {suggestions.map((s: string, i: number) => (
            <div key={i} className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <span className="text-slate-800 dark:text-slate-200 leading-relaxed">{s}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
