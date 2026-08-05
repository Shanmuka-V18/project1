'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingDown, Upload, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageTitle, MutedText, FormLabel, TableHeading, StatLabel } from '@/components/ui/Typography';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Form states
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState('Office Supplies');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CSV Import state
  const [csvContent, setCsvContent] = useState('');
  const [importStatus, setImportStatus] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      if (data.expenses) setExpenses(data.expenses);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          vendor,
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
        setVendor('');
        setNotes('');
        fetchExpenses();
      } else {
        setFormError(data.error || 'Failed to add expense record.');
      }
    } catch (e: any) {
      setFormError(e.message || 'Error creating expense record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCSVImport = async () => {
    if (!csvContent.trim()) {
      setImportStatus('Please paste valid CSV content.');
      return;
    }

    try {
      const res = await fetch('/api/expenses/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData: csvContent }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportStatus(`Successfully imported ${data.importedCount} expense records!`);
        setTimeout(() => {
          setIsImportModalOpen(false);
          setCsvContent('');
          setImportStatus('');
          fetchExpenses();
        }, 1200);
      } else {
        setImportStatus(data.error || 'CSV import failed.');
      }
    } catch (e: any) {
      setImportStatus(e.message || 'CSV Import Error.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense entry?')) return;
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    fetchExpenses();
  };

  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <PageTitle>Expense Tracker</PageTitle>
          <MutedText className="mt-1 font-medium">Categorize spending outlays, vendor details, subscriptions, and import CSV reports</MutedText>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => setIsImportModalOpen(true)} variant="secondary">
            <Upload className="mr-2 h-4 w-4 text-teal-600 dark:text-teal-400" /> Import CSV
          </Button>
          <Button onClick={() => setIsModalOpen(true)} variant="danger">
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-rose-500">
          <StatLabel>Total Monthly Outflow</StatLabel>
          <h3 className="text-2xl font-extrabold text-rose-700 dark:text-rose-400 mt-2">{formatCurrency(totalExpense)}</h3>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <StatLabel>Tracked Expenses</StatLabel>
          <h3 className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 mt-2">{expenses.length} Entries</h3>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <StatLabel>Recurring Subscriptions</StatLabel>
          <h3 className="text-2xl font-extrabold text-purple-700 dark:text-purple-400 mt-2">
            {expenses.filter((e) => e.isRecurring).length} Active
          </h3>
        </Card>
      </div>

      {/* Expense Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4"><TableHeading>Vendor / Title</TableHeading></th>
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
                  <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">Loading expense entries...</td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">No expense entries logged. Click "Add Expense" or "Import CSV" to start.</td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">{exp.vendor || exp.notes || 'Expense'}</td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{exp.category}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{exp.paymentMethod}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{formatDate(exp.date)}</td>
                    <td className="py-3.5 px-4">
                      {exp.isRecurring ? <Badge variant="warning">Subscription</Badge> : <Badge variant="neutral">One-time</Badge>}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-rose-700 dark:text-rose-400">
                      -{formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDelete(exp.id)}
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

      {/* Add Expense Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log New Expense">
        <form onSubmit={handleAddExpense} className="space-y-4 text-xs">
          {formError && (
            <div className="rounded-xl bg-rose-100 dark:bg-rose-950/60 p-3 text-xs text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/50 font-medium">
              {formError}
            </div>
          )}

          <div>
            <FormLabel className="mb-1">Vendor / Description *</FormLabel>
            <input
              type="text"
              required
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g. AWS Cloud, Office Rent, Coffee Machine"
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
                placeholder="15000"
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
                <option value="Rent">Rent</option>
                <option value="Utilities">Utilities</option>
                <option value="Salaries">Salaries</option>
                <option value="Marketing">Marketing</option>
                <option value="Software">Software</option>
                <option value="Taxes">Taxes</option>
                <option value="Travel">Travel</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Food & Groceries">Food & Groceries</option>
                <option value="Entertainment">Entertainment</option>
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
                <option value="UPI">UPI</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Card">Credit Card</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <FormLabel className="mb-1">Notes (Optional)</FormLabel>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Receipt info, tax notes..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-teal-600 focus:outline-none font-medium"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="isRecurringExp"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="isRecurringExp" className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Is this a recurring monthly subscription/outflow?
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} variant="danger">
              Save Expense Entry
            </Button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Import Expenses via CSV">
        <div className="space-y-4 text-xs">
          <MutedText>
            Paste your CSV content below with columns: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">date, amount, category, vendor, paymentMethod</span>.
          </MutedText>

          {importStatus && (
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/40 text-teal-900 dark:text-teal-200 font-medium">
              {importStatus}
            </div>
          )}

          <textarea
            rows={6}
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            placeholder="2026-08-01, 15000, Software, AWS Hosting, Card&#10;2026-08-02, 3500, Travel, Uber Ride, UPI"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-slate-900 dark:text-slate-100 font-mono text-xs focus:border-teal-600 focus:outline-none"
          />

          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="ghost" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCSVImport} className="bg-teal-600 text-white">Import Expenses</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
