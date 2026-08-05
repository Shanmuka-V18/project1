'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageTitle, MutedText, FormLabel, TableHeading, StatLabel } from '@/components/ui/Typography';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function IncomePage() {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('Salary');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Bank');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchIncomes();
  }, []);

  const fetchIncomes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/income');
      const data = await res.json();
      if (data.incomes) setIncomes(data.incomes);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          source,
          category,
          date,
          paymentMethod,
          notes,
          isRecurring,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        setAmount('');
        setSource('');
        setNotes('');
        fetchIncomes();
      } else {
        setFormError(data.error || 'Failed to add income record.');
      }
    } catch (e: any) {
      setFormError(e.message || 'Error creating income record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income record?')) return;
    await fetch(`/api/income/${id}`, { method: 'DELETE' });
    fetchIncomes();
  };

  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <PageTitle>Income Tracker</PageTitle>
          <MutedText className="mt-1 font-medium">Log revenue streams, track payment methods, and manage recurring inflows</MutedText>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add New Income
        </Button>
      </div>

      {/* KPI Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <StatLabel>Total Tracked Income</StatLabel>
          <h3 className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-2">{formatCurrency(totalIncome)}</h3>
        </Card>
        <Card className="border-l-4 border-l-teal-500">
          <StatLabel>Total Income Entries</StatLabel>
          <h3 className="text-2xl font-extrabold text-teal-700 dark:text-teal-300 mt-2">{incomes.length} Records</h3>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <StatLabel>Recurring Revenue Streams</StatLabel>
          <h3 className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 mt-2">
            {incomes.filter((i) => i.isRecurring).length} Streams
          </h3>
        </Card>
      </div>

      {/* Income Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4"><TableHeading>Source</TableHeading></th>
                <th className="py-3 px-4"><TableHeading>Category</TableHeading></th>
                <th className="py-3 px-4"><TableHeading>Payment Method</TableHeading></th>
                <th className="py-3 px-4"><TableHeading>Date</TableHeading></th>
                <th className="py-3 px-4"><TableHeading>Recurring</TableHeading></th>
                <th className="py-3 px-4 text-right"><TableHeading>Amount</TableHeading></th>
                <th className="py-3 px-4 text-center"><TableHeading>Actions</TableHeading></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">Loading income entries...</td>
                </tr>
              ) : incomes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">No income records found. Click "Add New Income" to log revenue.</td>
                </tr>
              ) : (
                incomes.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">{inc.source}</td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{inc.category}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{inc.paymentMethod}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{formatDate(inc.date)}</td>
                    <td className="py-3.5 px-4">
                      {inc.isRecurring ? <Badge variant="info">Monthly</Badge> : <Badge variant="neutral">One-time</Badge>}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700 dark:text-emerald-400">
                      +{formatCurrency(inc.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDelete(inc.id)}
                        className="rounded p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Income Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Income Record">
        <form onSubmit={handleAddIncome} className="space-y-4 text-xs">
          {formError && (
            <div className="rounded-xl bg-rose-100 dark:bg-rose-950/60 p-3 text-xs text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/50 font-medium">
              {formError}
            </div>
          )}

          <div>
            <FormLabel className="mb-1">Income Source *</FormLabel>
            <input
              type="text"
              required
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Client Payment, Freelance Project, Salary"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-teal-600 focus:outline-none font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel className="mb-1">Amount (₹) *</FormLabel>
              <input
                type="number"
                required
                step="any"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50000"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-teal-600 focus:outline-none font-medium"
              />
            </div>
            <div>
              <FormLabel className="mb-1">Category *</FormLabel>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:border-teal-600 font-medium"
              >
                <option value="Salary">Salary</option>
                <option value="Freelance">Freelance</option>
                <option value="Business Revenue">Business Revenue</option>
                <option value="Investments">Investments</option>
                <option value="Rental Income">Rental Income</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel className="mb-1">Date *</FormLabel>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:border-teal-600 font-medium"
              />
            </div>
            <div>
              <FormLabel className="mb-1">Payment Method *</FormLabel>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:border-teal-600 font-medium"
              >
                <option value="Bank">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>

          <div>
            <FormLabel className="mb-1">Notes (Optional)</FormLabel>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-teal-600 focus:outline-none font-medium"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="isRecurringInc"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="isRecurringInc" className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Is this a recurring monthly income?
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              Save Income Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
