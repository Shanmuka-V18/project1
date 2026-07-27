'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, FileText, Download, Eye, Trash2, Search, Filter } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'All') params.append('status', statusFilter);

    try {
      const res = await fetch(`/api/invoices?${params.toString()}`);
      const data = await res.json();
      if (data.invoices) setInvoices(data.invoices);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    fetchInvoices();
  };

  const totalInvoiced = invoices.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Invoice Management</h1>
          <p className="text-xs text-slate-400 mt-1">Create professional tax invoices, track payment status, and export PDF statements</p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button className="bg-teal-600 hover:bg-teal-500 text-white">
            <Plus className="mr-2 h-4 w-4" /> Create New Invoice
          </Button>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-teal-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Value Invoiced</p>
          <h3 className="text-2xl font-bold text-teal-300 mt-2">{formatCurrency(totalInvoiced)}</h3>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paid Invoices</p>
          <h3 className="text-2xl font-bold text-emerald-400 mt-2">
            {invoices.filter((i) => i.status === 'Paid').length} Paid
          </h3>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending / Sent</p>
          <h3 className="text-2xl font-bold text-amber-300 mt-2">
            {invoices.filter((i) => i.status === 'Sent' || i.status === 'Draft').length} Pending
          </h3>
        </Card>
      </div>

      {/* Toolbar Filter */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-slate-400">Status Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-teal-500"
            >
              <option value="All">All Invoices</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Invoices List Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">GST Tax</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-400">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-100">{inv.clientName}</td>
                    <td className="py-3.5 px-4 text-slate-400">{formatDate(inv.dueDate)}</td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          inv.status === 'Paid'
                            ? 'income'
                            : inv.status === 'Sent'
                            ? 'info'
                            : inv.status === 'Overdue'
                            ? 'expense'
                            : 'neutral'
                        }
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300">{formatCurrency(inv.subtotal)}</td>
                    <td className="py-3.5 px-4 text-right text-slate-400">{formatCurrency(inv.gstAmount)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-teal-300">{formatCurrency(inv.total)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Link href={`/dashboard/invoices/${inv.id}`}>
                          <button className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-teal-400">
                            <Eye className="h-4 w-4" />
                          </button>
                        </Link>
                        <a href={`/api/invoices/${inv.id}/pdf`} download>
                          <button className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-teal-400">
                            <Download className="h-4 w-4" />
                          </button>
                        </a>
                        <button
                          onClick={() => handleDelete(inv.id)}
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
    </div>
  );
}
