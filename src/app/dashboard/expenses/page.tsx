'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Trash2, Edit2, Upload, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import Papa from 'papaparse';

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

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Rent');
  const [customCategory, setCustomCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [vendor, setVendor] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank' | 'Card'>('Bank');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CSV Import State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter, paymentFilter, search]);

  const fetchExpenses = async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (categoryFilter !== 'All') params.append('category', categoryFilter);
    if (paymentFilter !== 'All') params.append('paymentMethod', paymentFilter);
    if (search) params.append('search', search);

    try {
      const res = await fetch(`/api/expenses?${params.toString()}`);
      const data = await res.json();
      if (data.expenses) setExpenses(data.expenses);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setAmount('');
    setCategory('Rent');
    setCustomCategory('');
    setSubcategory('');
    setVendor('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Bank');
    setNotes('');
    setIsRecurring(false);
    setIsModalOpen(true);
  };

  const openEditModal = (exp: any) => {
    setEditingId(exp.id);
    setAmount(String(exp.amount));
    setCategory(exp.category);
    setSubcategory(exp.subcategory || '');
    setVendor(exp.vendor || '');
    setDate(new Date(exp.date).toISOString().split('T')[0]);
    setPaymentMethod(exp.paymentMethod);
    setNotes(exp.notes || '');
    setIsRecurring(exp.isRecurring);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalCategory = category === 'Custom' ? customCategory : category;

    const payload = {
      amount: parseFloat(amount),
      category: finalCategory,
      subcategory,
      vendor,
      date,
      paymentMethod,
      notes,
      isRecurring,
    };

    try {
      const url = editingId ? `/api/expenses/${editingId}` : '/api/expenses';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchExpenses();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense entry?')) return;
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    fetchExpenses();
  };

  // Handle CSV Parsing
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setCsvPreview(results.data.slice(0, 10));
        },
      });
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) return;
    setIsImporting(true);

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await fetch('/api/expenses/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: results.data }),
          });
          if (res.ok) {
            setIsCsvModalOpen(false);
            setCsvFile(null);
            setCsvPreview([]);
            fetchExpenses();
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsImporting(false);
        }
      },
    });
  };

  const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Expense Tracker</h1>
          <p className="text-xs text-slate-400 mt-1">Categorized spending, recurring subscriptions, and CSV bulk uploads</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => setIsCsvModalOpen(true)} variant="secondary">
            <FileSpreadsheet className="mr-2 h-4 w-4 text-teal-400" /> Import CSV
          </Button>
          <Button onClick={openCreateModal} variant="danger">
            <Plus className="mr-2 h-4 w-4" /> Add New Expense
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-rose-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filtered Expenses</p>
          <h3 className="text-2xl font-bold text-rose-400 mt-2">{formatCurrency(totalAmount)}</h3>
        </Card>
        <Card className="border-l-4 border-l-teal-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Transactions</p>
          <h3 className="text-2xl font-bold text-teal-300 mt-2">{expenses.length} Records</h3>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recurring Expenses</p>
          <h3 className="text-2xl font-bold text-amber-300 mt-2">
            {expenses.filter((e) => e.isRecurring).length} Subscriptions
          </h3>
        </Card>
      </div>

      {/* Toolbar Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category, vendor, notes..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-slate-400">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-teal-500"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Payment:</span>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-teal-500"
              >
                <option value="All">All Methods</option>
                <option value="Bank">Bank</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Expenses Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Recurring</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading expense records...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400">{formatDate(exp.date)}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant="expense">{exp.category}</Badge>
                      {exp.subcategory && <span className="block text-[10px] text-slate-400 mt-0.5">{exp.subcategory}</span>}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-100">{exp.vendor || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-slate-300">{exp.paymentMethod}</td>
                    <td className="py-3.5 px-4">
                      {exp.isRecurring ? (
                        <span className="inline-flex items-center text-amber-400 font-semibold">
                          <RefreshCw className="mr-1 h-3 w-3 animate-spin-slow" /> Monthly
                        </span>
                      ) : (
                        <span className="text-slate-500">One-off</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-400">
                      -{formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openEditModal(exp)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-teal-400"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Expense Entry' : 'Add New Expense'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Amount (₹)</label>
            <input
              type="number"
              required
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 15000"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-100 focus:border-teal-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="Custom">+ Custom Category</option>
              </select>
            </div>

            {category === 'Custom' && (
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Custom Category Name</label>
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Category Name"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-100 focus:border-teal-500 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Vendor / Payee</label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. AWS, DLF Properties"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-100 focus:border-teal-500"
              >
                <option value="Bank">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-100 focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Subcategory (Optional)</label>
            <input
              type="text"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="e.g. Office Rent, Cloud Billing"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Notes (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Expense details..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="isRecurringExpense"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-rose-600 focus:ring-rose-500"
            />
            <label htmlFor="isRecurringExpense" className="text-slate-300 font-medium">
              Recurring Subscription / Monthly Outflow
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} variant="danger">
              Save Expense Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* CSV Bulk Import Modal */}
      <Modal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="CSV Bulk Expense Import"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-400">
            Upload a CSV file containing columns: <code className="text-teal-400 font-mono">amount, category, vendor, date, paymentMethod</code>
          </p>

          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/60 p-6">
            <Upload className="h-8 w-8 text-teal-400 mb-2" />
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvFileChange}
              className="text-xs text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-teal-300 hover:file:bg-slate-700"
            />
          </div>

          {csvPreview.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-200 mb-2">Parsed Preview ({csvPreview.length} items sample):</h4>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-2 text-[11px] text-slate-300">
                {csvPreview.map((row, i) => (
                  <div key={i} className="py-1 border-b border-slate-900 flex justify-between">
                    <span>{row.vendor || row.category}</span>
                    <span className="font-bold text-rose-400">₹{row.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsCsvModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCsvImport}
              isLoading={isImporting}
              disabled={!csvFile}
              className="bg-teal-600 hover:bg-teal-500 text-white"
            >
              Import Expenses
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
