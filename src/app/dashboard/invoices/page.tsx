'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  FileText,
  Download,
  Eye,
  Trash2,
  Copy,
  Edit2,
  Filter,
  MoreVertical,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculateBalanceDue, INVOICE_STATUSES, PAYMENT_MODES } from '@/lib/invoice-utils';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentModeFilter, setPaymentModeFilter] = useState('All');

  // Active action menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Modal deletion state
  const [deletingInvoice, setDeletingInvoice] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, paymentModeFilter]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'All') params.append('status', statusFilter);
    if (paymentModeFilter !== 'All') params.append('paymentMode', paymentModeFilter);

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

  const handleDuplicate = (id: string) => {
    setActiveMenuId(null);
    router.push(`/dashboard/invoices/new?duplicateFrom=${id}`);
  };

  const handleConfirmDelete = async () => {
    if (!deletingInvoice) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${deletingInvoice.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeletingInvoice(null);
        fetchInvoices();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalInvoiced = invoices.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Invoice Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Create tax invoices, track partial payments, duplicate entries, and export PDFs</p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button className="bg-teal-600 hover:bg-teal-500 text-white">
            <Plus className="mr-2 h-4 w-4" /> Create New Invoice
          </Button>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-teal-500">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Value Invoiced</p>
          <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-300 mt-2">{formatCurrency(totalInvoiced)}</h3>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Paid Invoices</p>
          <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {invoices.filter((i) => i.status === 'Paid').length} Fully Paid
          </h3>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Partially Paid / Sent</p>
          <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-300 mt-2">
            {invoices.filter((i) => i.status === 'Partially Paid' || i.status === 'Sent' || i.status === 'Draft').length} Active
          </h3>
        </Card>
        <Card className="border-l-4 border-l-rose-500">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overdue Invoices</p>
          <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {invoices.filter((i) => i.status === 'Overdue').length} Overdue
          </h3>
        </Card>
      </div>

      {/* Toolbar Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:border-teal-500"
              >
                <option value="All">All Statuses</option>
                {INVOICE_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Payment Mode Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Payment Mode:</span>
              <select
                value={paymentModeFilter}
                onChange={(e) => setPaymentModeFilter(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:border-teal-500"
              >
                <option value="All">All Modes</option>
                {PAYMENT_MODES.map((pm) => (
                  <option key={pm} value={pm}>{pm}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Invoices List Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    No invoices found matching your filters.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const balanceDue = calculateBalanceDue(inv.total, inv.amountPaid || 0);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-600 dark:text-teal-400">{inv.invoiceNumber}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {inv.clientName}
                        {inv.clientPhone && <span className="block text-[10px] text-slate-400 font-normal">{inv.clientPhone}</span>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{inv.paymentMode || 'Bank Transfer'}</td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{formatDate(inv.dueDate)}</td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            inv.status === 'Paid'
                              ? 'income'
                              : inv.status === 'Partially Paid'
                              ? 'warning'
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
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900 dark:text-slate-200">{formatCurrency(inv.total)}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-teal-600 dark:text-teal-300">
                        {formatCurrency(balanceDue)}
                      </td>
                      <td className="py-3.5 px-4 text-center relative">
                        <div className="flex items-center justify-center space-x-1">
                          <Link href={`/dashboard/invoices/${inv.id}`}>
                            <button
                              title="View Invoice"
                              className="rounded p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </Link>

                          <button
                            title="Duplicate Invoice"
                            onClick={() => handleDuplicate(inv.id)}
                            className="rounded p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400"
                          >
                            <Copy className="h-4 w-4" />
                          </button>

                          <Link href={`/dashboard/invoices/new?editId=${inv.id}`}>
                            <button
                              title="Edit Invoice"
                              className="rounded p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </Link>

                          <a href={`/api/invoices/${inv.id}/pdf`} download title="Download PDF">
                            <button className="rounded p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400">
                              <Download className="h-4 w-4" />
                            </button>
                          </a>

                          <button
                            title="Delete Invoice"
                            onClick={() => setDeletingInvoice(inv)}
                            className="rounded p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingInvoice}
        onClose={() => setDeletingInvoice(null)}
        title="Confirm Invoice Deletion"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400 p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800/50">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>
              Are you sure you want to delete invoice <strong>{deletingInvoice?.invoiceNumber}</strong> for {deletingInvoice?.clientName}? This action cannot be undone.
            </span>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setDeletingInvoice(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={isDeleting}
              onClick={handleConfirmDelete}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
