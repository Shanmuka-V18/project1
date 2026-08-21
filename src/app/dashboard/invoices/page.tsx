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
  CopyPlus,
  Clipboard,
  Check,
  Edit2,
  Filter,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
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

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  // Modal deletion state
  const [deletingInvoice, setDeletingInvoice] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, paymentModeFilter]);

  useEffect(() => {
    if (toastMessage || toastError) {
      const timer = setTimeout(() => {
        setToastMessage(null);
        setToastError(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, toastError]);

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
    router.push(`/dashboard/invoices/new?duplicateFrom=${id}`);
  };

  const handleCopyToClipboard = async (inv: any) => {
    const balance = calculateBalanceDue(inv.total, inv.amountPaid || 0);
    const text = `Invoice ${inv.invoiceNumber} | Client: ${inv.clientName} | Total: ${formatCurrency(inv.total)} | Balance Due: ${formatCurrency(balance)} | Status: ${inv.status} | Due Date: ${formatDate(inv.dueDate)}`;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedId(inv.id);
      setToastMessage(`Copied ${inv.invoiceNumber} summary to clipboard!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Clipboard copy error:', err);
      setToastError('Failed to copy invoice summary to clipboard');
    }
  };

  const handleDownloadPdf = async (id: string, invoiceNumber: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}/pdf`);
      if (!res.ok) {
        throw new Error(`Failed to generate PDF (${res.status})`);
      }
      const blob = await res.blob();
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setToastMessage(`Downloaded ${invoiceNumber}.pdf successfully!`);
    } catch (err: any) {
      console.error('PDF download error:', err);
      setToastError(`Failed to download PDF: ${err.message || 'Error'}`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingInvoice) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${deletingInvoice.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeletingInvoice(null);
        setToastMessage(`Invoice ${deletingInvoice.invoiceNumber} deleted`);
        fetchInvoices();
      }
    } catch (e) {
      console.error(e);
      setToastError('Failed to delete invoice');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalInvoiced = invoices.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center space-x-2 rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold shadow-xl animate-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
      {toastError && (
        <div className="fixed top-20 right-6 z-50 flex items-center space-x-2 rounded-xl bg-rose-600 text-white px-4 py-2.5 text-xs font-bold shadow-xl animate-in slide-in-from-top-3 duration-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{toastError}</span>
        </div>
      )}

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
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {/* 1. View Invoice */}
                          <Link href={`/dashboard/invoices/${inv.id}`}>
                            <button
                              title="View Invoice"
                              className="rounded p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </Link>

                          {/* 2. Duplicate Invoice (New Draft) */}
                          <button
                            title="Duplicate Invoice (New Draft)"
                            onClick={() => handleDuplicate(inv.id)}
                            className="rounded p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                          >
                            <CopyPlus className="h-4 w-4" />
                          </button>

                          {/* 3. Copy Summary to Clipboard */}
                          <button
                            title="Copy Summary to Clipboard"
                            onClick={() => handleCopyToClipboard(inv)}
                            className="rounded p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                          >
                            {copiedId === inv.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Clipboard className="h-4 w-4" />}
                          </button>

                          {/* 4. Edit Invoice */}
                          <Link href={`/dashboard/invoices/new?editId=${inv.id}`}>
                            <button
                              title="Edit Invoice"
                              className="rounded p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </Link>

                          {/* 5. Download PDF */}
                          <button
                            title="Download PDF"
                            onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                            className="rounded p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                          </button>

                          {/* 6. Delete Invoice */}
                          <button
                            title="Delete Invoice"
                            onClick={() => setDeletingInvoice(inv)}
                            className="rounded p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
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
