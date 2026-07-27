'use client';

import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle, CheckCircle2, PieChart, ArrowUpRight, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';

const CATEGORIES = [
  'Rent',
  'Utilities',
  'Salaries',
  'Travel',
  'Marketing',
  'Software',
  'Taxes',
  'Loan Repayment',
  'Misc',
];

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState('Rent');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/budgets');
      const data = await res.json();
      if (data.budgets) setBudgets(data.budgets);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          monthlyLimit: parseFloat(monthlyLimit),
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setMonthlyLimit('');
        fetchBudgets();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Are you sure you want to remove this category budget?')) return;
    await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' });
    fetchBudgets();
  };

  const totalBudgeted = budgets.reduce((acc, curr) => acc + curr.monthlyLimit, 0);
  const totalActualSpent = budgets.reduce((acc, curr) => acc + curr.actualSpent, 0);
  const totalExceeded = budgets.filter((b) => b.status === 'exceeded').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Monthly Budget Planner</h1>
          <p className="text-xs text-slate-400 mt-1">Set category targets, track actual expenditures, and receive real-time alerts</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-teal-600 hover:bg-teal-500 text-white">
          <Plus className="mr-2 h-4 w-4" /> Set Category Budget
        </Button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-teal-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Monthly Budget</p>
          <h3 className="text-2xl font-bold text-teal-300 mt-2">{formatCurrency(totalBudgeted)}</h3>
        </Card>
        <Card className="border-l-4 border-l-rose-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Actual Spent so far</p>
          <h3 className="text-2xl font-bold text-rose-400 mt-2">{formatCurrency(totalActualSpent)}</h3>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Budget Exceeded Alerts</p>
          <h3 className="text-2xl font-bold text-amber-300 mt-2">{totalExceeded} Categories</h3>
        </Card>
      </div>

      {/* Budget Category Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {isLoading ? (
          <div className="col-span-2 py-12 text-center text-xs text-slate-400">Loading budget tracking...</div>
        ) : budgets.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-xs text-slate-400">
            No category budgets set for this month yet. Click "Set Category Budget" to get started!
          </div>
        ) : (
          budgets.map((b) => (
            <Card key={b.id} className="relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-slate-100 text-sm">{b.category}</h4>
                  <Badge variant={b.status === 'exceeded' ? 'expense' : b.status === 'warning' ? 'warning' : 'income'}>
                    {b.percentage}% Used
                  </Badge>
                </div>
                <button
                  onClick={() => handleDeleteBudget(b.id)}
                  className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="my-3 flex items-baseline justify-between text-xs">
                <span className="text-slate-400">
                  Spent: <span className="font-bold text-slate-200">{formatCurrency(b.actualSpent)}</span>
                </span>
                <span className="text-slate-400">
                  Target: <span className="font-semibold text-slate-300">{formatCurrency(b.monthlyLimit)}</span>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    b.status === 'exceeded'
                      ? 'bg-rose-500 shadow-rose-950/60'
                      : b.status === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, b.percentage)}%` }}
                />
              </div>

              {/* Status Message */}
              <div className="mt-3 flex items-center justify-between text-[11px]">
                {b.status === 'exceeded' ? (
                  <span className="flex items-center text-rose-400 font-medium">
                    <AlertTriangle className="mr-1 h-3.5 w-3.5" /> Exceeded limit by {formatCurrency(Math.abs(b.remaining))}
                  </span>
                ) : b.status === 'warning' ? (
                  <span className="flex items-center text-amber-400 font-medium">
                    <AlertTriangle className="mr-1 h-3.5 w-3.5" /> Approaching budget limit ({b.percentage}%)
                  </span>
                ) : (
                  <span className="flex items-center text-emerald-400 font-medium">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> {formatCurrency(b.remaining)} remaining
                  </span>
                )}
                <span className="text-slate-500 text-[10px]">Rollover: Enabled</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add / Edit Budget Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Set Category Budget">
        <form onSubmit={handleSaveBudget} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Expense Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-100 focus:border-teal-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Monthly Spending Limit (₹)</label>
            <input
              type="number"
              required
              step="any"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-teal-600 hover:bg-teal-500">
              Save Budget Limit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
