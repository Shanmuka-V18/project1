'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import {
  validatePhoneNumber,
  INVOICE_STATUSES,
  PAYMENT_MODES,
  PaymentMode,
  InvoiceStatus,
  duplicateInvoiceData,
  calculateBalanceDue,
} from '@/lib/invoice-utils';

function InvoiceFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const duplicateFrom = searchParams.get('duplicateFrom');
  const editId = searchParams.get('editId');

  // Business Identity
  const [businessName, setBusinessName] = useState('Apex Innovations Studio');
  const [pan, setPan] = useState('ABCDE1234F');
  const [gstin, setGstin] = useState('07ABCDE1234F1Z5');

  // Client Details
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Bank Transfer');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<InvoiceStatus>('Draft');
  const [amountPaid, setAmountPaid] = useState<string>('0');

  // Tax & Discount
  const [gstRate, setGstRate] = useState<number>(18);
  const [discount, setDiscount] = useState<string>('0');

  // Line Items
  const [items, setItems] = useState<Array<{ description: string; quantity: number; unitPrice: number }>>([
    { description: 'Software Development & Consulting Services', quantity: 1, unitPrice: 50000 },
  ]);

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);

  useEffect(() => {
    if (duplicateFrom) {
      setIsLoadingExisting(true);
      fetch(`/api/invoices/${duplicateFrom}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.invoice) {
            const dup = duplicateInvoiceData(data.invoice, '');
            setBusinessName(dup.businessName);
            setPan(dup.pan);
            setGstin(dup.gstin);
            setClientName(dup.clientName);
            setClientEmail(dup.clientEmail);
            setClientPhone(dup.clientPhone);
            setPaymentMode(dup.paymentMode as PaymentMode);
            setStatus('Draft');
            setAmountPaid('0');
            setDueDate(dup.dueDate);
            try {
              const parsedItems = JSON.parse(dup.items);
              if (Array.isArray(parsedItems) && parsedItems.length > 0) {
                setItems(parsedItems);
              }
            } catch (e) {}
            setDiscount(String(data.invoice.discount || 0));
          }
        })
        .finally(() => setIsLoadingExisting(false));
    } else if (editId) {
      setIsLoadingExisting(true);
      fetch(`/api/invoices/${editId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.invoice) {
            const inv = data.invoice;
            setBusinessName(inv.businessName);
            setPan(inv.pan || '');
            setGstin(inv.gstin || '');
            setClientName(inv.clientName);
            setClientEmail(inv.clientEmail);
            setClientPhone(inv.clientPhone || '');
            setPaymentMode((inv.paymentMode as PaymentMode) || 'Bank Transfer');
            setStatus((inv.status as InvoiceStatus) || 'Draft');
            setAmountPaid(String(inv.amountPaid || 0));
            setDueDate(new Date(inv.dueDate).toISOString().split('T')[0]);
            try {
              const parsedItems = JSON.parse(inv.items);
              if (Array.isArray(parsedItems) && parsedItems.length > 0) {
                setItems(parsedItems);
              }
            } catch (e) {}
            setDiscount(String(inv.discount || 0));
          }
        })
        .finally(() => setIsLoadingExisting(false));
    }
  }, [duplicateFrom, editId]);

  const addItemRow = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const gstAmount = (subtotal * gstRate) / 100;
  const discountVal = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, subtotal + gstAmount - discountVal);
  const amountPaidVal = parseFloat(amountPaid) || 0;
  const balanceDue = calculateBalanceDue(grandTotal, amountPaidVal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (clientPhone) {
      const phoneVal = validatePhoneNumber(clientPhone);
      if (!phoneVal.isValid) {
        setFormError(phoneVal.error || 'Invalid phone number format.');
        return;
      }
    }

    setIsSubmitting(true);

    const payload = {
      businessName,
      pan,
      gstin,
      clientName,
      clientEmail,
      clientPhone,
      paymentMode,
      items,
      gstRate,
      discount: discountVal,
      amountPaid: amountPaidVal,
      dueDate,
      status,
    };

    try {
      const url = editId ? `/api/invoices/${editId}` : '/api/invoices';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/dashboard/invoices');
      } else {
        setFormError(data.error || 'Failed to save invoice.');
      }
    } catch (e: any) {
      setFormError(e.message || 'Network error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingExisting) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading invoice template...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div>
        <Link href="/dashboard/invoices" className="inline-flex items-center text-xs text-teal-600 dark:text-teal-400 hover:underline mb-2 font-medium">
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Invoices List
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {editId ? 'Edit Invoice' : duplicateFrom ? 'Duplicate Invoice' : 'Create New Invoice'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {duplicateFrom ? 'Duplicate pre-filled invoice data with fresh invoice number & status' : 'Enter billing information, payment mode, and line items'}
        </p>
      </div>

      {formError && (
        <div className="flex items-center space-x-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 p-3 text-xs text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/50">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Step 1: Business Identity */}
        <Card className="p-6">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-4 text-teal-600 dark:text-teal-400 border-b border-slate-100 dark:border-slate-800 pb-2">
            1. Your Business Billing Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Apex Innovations Studio"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">PAN Number (Optional)</label>
              <input
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value)}
                placeholder="e.g. ABCDE1234F"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 uppercase focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">GSTIN (Optional)</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="e.g. 07ABCDE1234F1Z5"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 uppercase focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Step 2: Client Details & Terms */}
        <Card className="p-6">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-4 text-teal-600 dark:text-teal-400 border-b border-slate-100 dark:border-slate-800 pb-2">
            2. Client Information & Payment Terms
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Client Name *</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Starlight Tech Ltd"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Client Email *</label>
              <input
                type="email"
                required
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="billing@client.com"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Client Phone (Optional)</label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => {
                  setClientPhone(e.target.value);
                  setFormError('');
                }}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Payment Mode *</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:border-teal-500"
              >
                {PAYMENT_MODES.map((pm) => (
                  <option key={pm} value={pm}>{pm}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Payment Due Date *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Invoice Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:border-teal-500"
              >
                {INVOICE_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Step 3: Line Items */}
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm text-teal-600 dark:text-teal-400">3. Invoice Line Items</h3>
            <Button type="button" onClick={addItemRow} size="sm" variant="secondary">
              <Plus className="mr-1 h-3.5 w-3.5" /> Add Row
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="col-span-6">
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Description</label>
                  <input
                    type="text"
                    required
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    placeholder="Service / Product Description"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-slate-100 focus:border-teal-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Qty</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-slate-100 focus:border-teal-500"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-slate-100 focus:border-teal-500"
                  />
                </div>
                <div className="col-span-1 text-center pt-4">
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    disabled={items.length <= 1}
                    className="rounded p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Step 4: Tax, Discount, Amount Paid & Total Calculation */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">GST Rate (%)</label>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(parseFloat(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:border-teal-500"
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>5% GST</option>
                  <option value={12}>12% GST</option>
                  <option value={18}>18% GST (Standard Services)</option>
                  <option value={28}>28% GST</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Discount Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Amount Paid so far (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Calculations Box */}
            <div className="rounded-2xl border border-teal-500/30 bg-teal-50 dark:bg-teal-950/20 p-5 space-y-2 text-slate-800 dark:text-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Subtotal:</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">GST ({gstRate}%):</span>
                <span className="font-semibold">{formatCurrency(gstAmount)}</span>
              </div>
              {discountVal > 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>Discount:</span>
                  <span>-{formatCurrency(discountVal)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100 pt-1">
                <span>Grand Total:</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
              {amountPaidVal > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Amount Paid:</span>
                  <span>-{formatCurrency(amountPaidVal)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between text-base font-bold text-teal-600 dark:text-teal-300">
                <span>Balance Due:</span>
                <span>{formatCurrency(balanceDue)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Controls */}
        <div className="flex justify-end space-x-4">
          <Link href="/dashboard/invoices">
            <Button type="button" variant="ghost">Cancel</Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting} className="bg-teal-600 hover:bg-teal-500 py-3 px-8 text-white">
            <CheckCircle2 className="mr-2 h-4 w-4" /> {editId ? 'Update Invoice' : 'Save & Generate Invoice'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading form...</div>}>
      <InvoiceFormContent />
    </Suspense>
  );
}
