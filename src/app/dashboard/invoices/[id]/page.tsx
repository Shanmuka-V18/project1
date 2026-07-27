'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Printer, CheckCircle, Mail, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.invoice) setInvoice(data.invoice);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setInvoice({ ...invoice, status: newStatus });
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading invoice details...</div>;
  }

  if (!invoice) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-sm text-slate-400">Invoice not found</p>
        <Link href="/dashboard/invoices">
          <Button size="sm">Back to Invoices</Button>
        </Link>
      </div>
    );
  }

  const items = JSON.parse(invoice.items || '[]');

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/dashboard/invoices" className="inline-flex items-center text-xs text-teal-400 hover:underline mb-2">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Invoices
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-mono font-bold text-slate-100">{invoice.invoiceNumber}</h1>
            <Badge
              variant={
                invoice.status === 'Paid'
                  ? 'income'
                  : invoice.status === 'Sent'
                  ? 'info'
                  : invoice.status === 'Overdue'
                  ? 'expense'
                  : 'neutral'
              }
            >
              {invoice.status}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {invoice.status !== 'Paid' && (
            <Button size="sm" onClick={() => handleStatusChange('Paid')} className="bg-emerald-600 hover:bg-emerald-500">
              <CheckCircle className="mr-1.5 h-4 w-4" /> Mark as Paid
            </Button>
          )}
          <a href={`/api/invoices/${id}/pdf`} download>
            <Button size="sm" variant="secondary">
              <Download className="mr-1.5 h-4 w-4 text-teal-400" /> Export PDF
            </Button>
          </a>
        </div>
      </div>

      {/* Invoice Document Card (Preview) */}
      <Card className="p-8 space-y-8 bg-slate-900 border border-slate-800">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-800 pb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wide">{invoice.businessName}</h2>
            {invoice.gstin && <p className="text-xs text-slate-400 mt-1 font-mono">GSTIN: {invoice.gstin}</p>}
            {invoice.pan && <p className="text-xs text-slate-400 font-mono">PAN: {invoice.pan}</p>}
          </div>

          <div className="text-left sm:text-right font-mono text-xs text-slate-300">
            <p className="text-lg font-bold text-teal-400">{invoice.invoiceNumber}</p>
            <p className="mt-1">Date: {formatDate(invoice.createdAt)}</p>
            <p>Due Date: {formatDate(invoice.dueDate)}</p>
          </div>
        </div>

        {/* Client info */}
        <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800/80">
          <p className="text-[10px] font-bold uppercase tracking-wider text-teal-400 mb-1">Billed To:</p>
          <h4 className="text-sm font-bold text-slate-100">{invoice.clientName}</h4>
          <p className="text-xs text-slate-400">{invoice.clientEmail}</p>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-2">Description</th>
                <th className="py-3 px-2 text-center">Qty</th>
                <th className="py-3 px-2 text-right">Unit Price</th>
                <th className="py-3 px-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.map((item: any, i: number) => (
                <tr key={i}>
                  <td className="py-3 px-2 font-medium text-slate-200">{item.description}</td>
                  <td className="py-3 px-2 text-center text-slate-300">{item.quantity}</td>
                  <td className="py-3 px-2 text-right text-slate-300">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 px-2 text-right font-bold text-slate-100">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <div className="w-64 space-y-2 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">GST Amount:</span>
              <span>{formatCurrency(invoice.gstAmount)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-rose-400">
                <span>Discount:</span>
                <span>-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-teal-300">
              <span>Total Payable:</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
