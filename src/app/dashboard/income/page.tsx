'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Trash2, Edit2, TrendingUp, CheckCircle, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function IncomePage() {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('Consulting');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank' | 'Card'>('Bank');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchIncomes();
  }, [categoryFilter, paymentFilter, search]);

  const fetchIncomes = async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (categoryFilter !== 'All') params.append('category', categoryFilter);
    if (paymentFilter !== 'All') params.append('paymentMethod', paymentFilter);
    if (search) params.append('search', search);

    try {
      const res = await fetch(`/api/income?${params.toString()}`);
      const data = await res.json();
      if (data.incomes) setIncomes(data.incomes);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setAmount('');
    setSource('');
    setCategory('Consulting');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Bank');
    setNotes('');
    setIsRecurring(false);
    setIsModalOpen(true);
  };

  const openEditModal = (inc: any) => {
    setEditingId(inc.id);
    setAmount(String(inc.amount));
    setSource(inc.source);
    setCategory(inc.category);
    setDate(new Date(inc.date).toISOString().split('T')[0]);
    setPaymentMethod(inc.paymentMethod);
    setNotes(inc.notes || '');
    setIsRecurring(inc.isRecurring);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      amount: parseFloat(amount),
      source,
      category,
      date,
      paymentMethod,
      notes,
      isRecurring,
    };

    try {
      const url = editingId ? `/api/income/${editingId}` : '/api/income';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchIncomes();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income entry?')) return;
    await fetch(`/api/income/${id}`, { method: 'DELETE' });
    fetchIncomes();
  };

  const totalAmount = incomes.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Income Management</h1>
          <p className="text-xs text-slate-400 mt-1">Track all revenue streams, freelance payments, and recurring retainers</p>
        </div>
        <Button onClick={openCreateModal} className="bg-emerald-600 hover:bg-emerald-500 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add New Income
        </Button>
      </div>

      {/* Summary Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filtered Total Revenue</p>
          <h3 className="text-2xl font-bold text-emerald-400 mt-2">{formatCurrency(totalAmount)}</h3>
        </Card>
        <Card className="border-l-4 border-l-teal-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Income Entries</p>
          <h3 className="text-2xl font-bold text-teal-300 mt-2">{incomes.length} Entries</h3>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recurring Retainers</p>
          <h3 className="text-2xl font-bold text-amber-300 mt-2">
            {incomes.filter((i) => i.isRecurring).length} Streams
          </h3>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search income source, category..."
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
                <option value="Consulting">Consulting</option>
                <option value="Freelance">Freelance</option>
                <option value="Investments">Investments</option>
                <option value="Side Project">Side Project</option>
                <option value="Other">Other</option>
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
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Incomes Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Category</th>
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
                    Loading income records...
                  </td>
                </tr>
              ) : incomes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No income records found matching your filters.
                  </td>
                </tr>
              ) : (
                incomes.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400">{formatDate(inc.date)}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-100">{inc.source}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant="info">{inc.category}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{inc.paymentMethod}</td>
                    <td className="py-3.5 px-4">
                      {inc.isRecurring ? (
                        <span className="inline-flex items-center text-emerald-400 font-semibold">
                          <RefreshCw className="mr-1 h-3 w-3 animate-spin-slow" /> Monthly
                        </span>
                      ) : (
                        <span className="text-slate-500">One-off</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                      +{formatCurrency(inc.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openEditModal(inc)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-teal-400"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(inc.id)}
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Income Entry' : 'Add New Income'}
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
              placeholder="e.g. 50000"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Income Source</label>
            <input
              type="text"
              required
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Client Retainer / Project Fee"
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
                <option value="Consulting">Consulting</option>
                <option value="Freelance">Freelance</option>
                <option value="Investments">Investments</option>
                <option value="Side Project">Side Project</option>
                <option value="Salaried">Salaried</option>
                <option value="Other">Other</option>
              </select>
            </div>

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

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Notes (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="isRecurring" className="text-slate-300 font-medium">
              Recurring Monthly Income Stream
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-teal-600 hover:bg-teal-500">
              Save Income Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
