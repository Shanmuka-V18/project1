'use client';

import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle, CheckCircle2, PieChart, Trash2, User, Briefcase, Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import {
  BudgetType,
  PERSONAL_CATEGORIES,
  BUSINESS_CATEGORIES,
  getPredefinedCategories,
  resetCategoryOnBudgetTypeChange,
  validateCustomCategory,
} from '@/lib/budget-utils';

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [customCategories, setCustomCategories] = useState<Record<BudgetType, string[]>>({
    personal: [],
    business: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'personal' | 'business'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetType, setBudgetType] = useState<BudgetType>('personal');
  const [category, setCategory] = useState<string>('House Rent');
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('');
  const [monthlyLimit, setMonthlyLimit] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
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
      if (data.customCategories) setCustomCategories(data.customCategories);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBudgetTypeChange = (newType: BudgetType) => {
    setBudgetType(newType);
    setCategory(resetCategoryOnBudgetTypeChange(newType));
    setCustomCategoryInput('');
    setFormError('');
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    let finalCategory = category;

    if (category === 'Other') {
      const existingForType = [
        ...getPredefinedCategories(budgetType),
        ...(customCategories[budgetType] || []),
      ];

      const validation = validateCustomCategory(customCategoryInput, existingForType);
      if (!validation.isValid) {
        setFormError(validation.error || 'Invalid custom category.');
        return;
      }
      finalCategory = validation.normalizedName!;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budgetType,
          category: finalCategory,
          monthlyLimit: parseFloat(monthlyLimit),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        setMonthlyLimit('');
        setCustomCategoryInput('');
        setFormError('');
        fetchBudgets();
      } else {
        setFormError(data.error || 'Failed to save budget limit.');
      }
    } catch (e: any) {
      setFormError(e.message || 'Error saving budget limit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Are you sure you want to remove this category budget?')) return;
    await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' });
    fetchBudgets();
  };

  const filteredBudgets = budgets.filter((b) => {
    if (typeFilter === 'all') return true;
    return (b.budgetType || 'business') === typeFilter;
  });

  const totalBudgeted = filteredBudgets.reduce((acc, curr) => acc + curr.monthlyLimit, 0);
  const totalActualSpent = filteredBudgets.reduce((acc, curr) => acc + curr.actualSpent, 0);
  const totalExceeded = filteredBudgets.filter((b) => b.status === 'exceeded').length;

  // Build combined options list for current budgetType in modal
  const predefinedList = getPredefinedCategories(budgetType);
  const userCustomList = customCategories[budgetType] || [];
  // Exclude 'Other' from predefined, append user custom options, then 'Other' at end
  const combinedCategoryOptions = [
    ...predefinedList.filter((c) => c !== 'Other'),
    ...userCustomList.filter((c) => !predefinedList.includes(c as any)),
    'Other',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Monthly Budget Planner</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Set personal & business category targets, track actual spending, and receive alerts</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-teal-600 hover:bg-teal-500 text-white">
          <Plus className="mr-2 h-4 w-4" /> Set Category Budget
        </Button>
      </div>

      {/* Type Filter Toolbar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Filter Budget Type:</span>
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                All ({budgets.length})
              </button>
              <button
                onClick={() => setTypeFilter('personal')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  typeFilter === 'personal'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Personal ({budgets.filter((b) => b.budgetType === 'personal').length})
              </button>
              <button
                onClick={() => setTypeFilter('business')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  typeFilter === 'business'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Business ({budgets.filter((b) => (b.budgetType || 'business') === 'business').length})
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-teal-500">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Monthly Budget</p>
          <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-300 mt-2">{formatCurrency(totalBudgeted)}</h3>
        </Card>
        <Card className="border-l-4 border-l-rose-500">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actual Spent so far</p>
          <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">{formatCurrency(totalActualSpent)}</h3>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Budget Exceeded Alerts</p>
          <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-300 mt-2">{totalExceeded} Categories</h3>
        </Card>
      </div>

      {/* Budget Category Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {isLoading ? (
          <div className="col-span-2 py-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading budget tracking...</div>
        ) : filteredBudgets.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-xs text-slate-500 dark:text-slate-400">
            No category budgets set for this view yet. Click "Set Category Budget" to get started!
          </div>
        ) : (
          filteredBudgets.map((b) => (
            <Card key={b.id} className="relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{b.category}</h4>
                  <Badge variant={b.budgetType === 'personal' ? 'info' : 'neutral'}>
                    {b.budgetType === 'personal' ? (
                      <span className="flex items-center"><User className="mr-1 h-3 w-3" /> Personal</span>
                    ) : (
                      <span className="flex items-center"><Briefcase className="mr-1 h-3 w-3" /> Business</span>
                    )}
                  </Badge>
                  <Badge variant={b.status === 'exceeded' ? 'expense' : b.status === 'warning' ? 'warning' : 'income'}>
                    {b.percentage}% Used
                  </Badge>
                </div>
                <button
                  onClick={() => handleDeleteBudget(b.id)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="my-3 flex items-baseline justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Spent: <span className="font-bold text-slate-900 dark:text-slate-200">{formatCurrency(b.actualSpent)}</span>
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Target: <span className="font-semibold text-slate-800 dark:text-slate-300">{formatCurrency(b.monthlyLimit)}</span>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
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
                  <span className="flex items-center text-rose-600 dark:text-rose-400 font-medium">
                    <AlertTriangle className="mr-1 h-3.5 w-3.5" /> Exceeded limit by {formatCurrency(Math.abs(b.remaining))}
                  </span>
                ) : b.status === 'warning' ? (
                  <span className="flex items-center text-amber-600 dark:text-amber-400 font-medium">
                    <AlertTriangle className="mr-1 h-3.5 w-3.5" /> Approaching budget limit ({b.percentage}%)
                  </span>
                ) : (
                  <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> {formatCurrency(b.remaining)} remaining
                  </span>
                )}
                <span className="text-slate-400 dark:text-slate-500 text-[10px]">Rollover: Enabled</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add / Edit Budget Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Set Category Budget">
        <form onSubmit={handleSaveBudget} className="space-y-4 text-xs">
          {formError && (
            <div className="rounded-xl bg-rose-100 dark:bg-rose-950/60 p-3 text-xs text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/50">
              {formError}
            </div>
          )}

          {/* 1. Budget Type Selection (Radio / Toggle) */}
          <div>
            <label className="block text-slate-800 dark:text-slate-300 font-bold mb-1.5">
              Budget Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleBudgetTypeChange('personal')}
                className={`flex items-center justify-center space-x-2 rounded-xl p-3 text-xs font-bold border transition-all ${
                  budgetType === 'personal'
                    ? 'bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border-teal-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <User className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span>Personal Budget</span>
              </button>

              <button
                type="button"
                onClick={() => handleBudgetTypeChange('business')}
                className={`flex items-center justify-center space-x-2 rounded-xl p-3 text-xs font-bold border transition-all ${
                  budgetType === 'business'
                    ? 'bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border-teal-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Briefcase className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span>Business Budget</span>
              </button>
            </div>
          </div>

          {/* 2. Expense Category Dropdown (Depends on Budget Type) */}
          <div>
            <label className="block text-slate-800 dark:text-slate-300 font-semibold mb-1">
              Expense Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setFormError('');
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:border-teal-500"
            >
              {combinedCategoryOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 3. Custom Category via "Other" */}
          {category === 'Other' && (
            <div className="animate-in fade-in duration-200">
              <label className="block text-slate-800 dark:text-slate-300 font-semibold mb-1">
                Custom Category Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customCategoryInput}
                onChange={(e) => {
                  setCustomCategoryInput(e.target.value);
                  setFormError('');
                }}
                placeholder="Coffee, Petrol, Gym, Insurance, Stationery..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-teal-500 focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                This custom category will be saved and available for future budget and expense entries under {budgetType}.
              </p>
            </div>
          )}

          {/* Monthly Spending Limit */}
          <div>
            <label className="block text-slate-800 dark:text-slate-300 font-semibold mb-1">
              Monthly Spending Limit (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              step="any"
              min="1"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-teal-600 hover:bg-teal-500 text-white">
              Save Budget Limit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
