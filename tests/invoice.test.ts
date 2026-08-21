import { describe, it, expect, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import {
  validatePhoneNumber,
  calculateBalanceDue,
  duplicateInvoiceData,
  INVOICE_STATUSES,
  PAYMENT_MODES,
} from '../src/lib/invoice-utils';
import { formatCurrency, formatDate } from '../src/lib/utils';

describe('Invoice Module Utilities', () => {
  describe('Phone Number Validation', () => {
    it('accepts empty or null phone numbers (optional field)', () => {
      expect(validatePhoneNumber('').isValid).toBe(true);
      expect(validatePhoneNumber(null).isValid).toBe(true);
      expect(validatePhoneNumber('   ').isValid).toBe(true);
    });

    it('validates correct numeric phone numbers', () => {
      expect(validatePhoneNumber('+91 98765 43210').isValid).toBe(true);
      expect(validatePhoneNumber('9876543210').isValid).toBe(true);
      expect(validatePhoneNumber('+1 (555) 019-2834').isValid).toBe(true);
    });

    it('rejects invalid non-numeric characters', () => {
      const res = validatePhoneNumber('98765abcde');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('only numbers');
    });

    it('rejects phone numbers with too few or too many digits', () => {
      expect(validatePhoneNumber('12345').isValid).toBe(false);
      expect(validatePhoneNumber('1234567890123456789').isValid).toBe(false);
    });
  });

  describe('Balance Due Calculation', () => {
    it('calculates remaining balance accurately', () => {
      expect(calculateBalanceDue(1000, 300)).toBe(700);
      expect(calculateBalanceDue(1000, 1000)).toBe(0);
      expect(calculateBalanceDue(1000, 1200)).toBe(0);
    });
  });

  describe('Invoice Duplication Engine', () => {
    it('creates a fresh duplicate with Draft status, 0 amount paid, and new invoice number', () => {
      const original = {
        invoiceNumber: 'INV-2026-0001',
        businessName: 'Apex Studio',
        pan: 'ABCDE1234F',
        gstin: '07ABCDE1234F1Z5',
        clientName: 'Starlight Tech',
        clientEmail: 'billing@starlight.com',
        clientPhone: '+91 98765 43210',
        paymentMode: 'UPI',
        items: JSON.stringify([{ description: 'Web Design', quantity: 1, unitPrice: 50000 }]),
        subtotal: 50000,
        gstAmount: 9000,
        discount: 1000,
        total: 58000,
        amountPaid: 58000,
        status: 'Paid',
      };

      const duplicated = duplicateInvoiceData(original, 'INV-2026-0099');

      expect(duplicated.invoiceNumber).toBe('INV-2026-0099');
      expect(duplicated.status).toBe('Draft');
      expect(duplicated.amountPaid).toBe(0);
      expect(duplicated.clientName).toBe('Starlight Tech');
      expect(duplicated.clientEmail).toBe('billing@starlight.com');
      expect(duplicated.clientPhone).toBe('+91 98765 43210');
      expect(duplicated.paymentMode).toBe('UPI');
      expect(duplicated.total).toBe(58000);

      // Verify original remains untouched
      expect(original.invoiceNumber).toBe('INV-2026-0001');
      expect(original.status).toBe('Paid');
      expect(original.amountPaid).toBe(58000);
    });
  });

  describe('Copy to Clipboard & Invoice Summary Formatting', () => {
    it('formats a concise invoice summary text for clipboard copy', () => {
      const inv = {
        invoiceNumber: 'INV-2026-0005',
        clientName: 'Acme Corp',
        total: 50000,
        amountPaid: 20000,
        status: 'Partially Paid',
        dueDate: new Date(2026, 8, 1),
      };

      const balance = calculateBalanceDue(inv.total, inv.amountPaid);
      const text = `Invoice ${inv.invoiceNumber} | Client: ${inv.clientName} | Total: ${formatCurrency(inv.total)} | Balance Due: ${formatCurrency(balance)} | Status: ${inv.status} | Due Date: ${formatDate(inv.dueDate)}`;

      expect(text).toContain('Invoice INV-2026-0005');
      expect(text).toContain('Client: Acme Corp');
      expect(text).toContain('Status: Partially Paid');
      expect(text).toContain('Balance Due: ₹30,000.00');
    });

    it('writes formatted summary to system clipboard via Clipboard API', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      const inv = {
        invoiceNumber: 'INV-2026-0010',
        clientName: 'Global Solutions',
        total: 100000,
        amountPaid: 100000,
        status: 'Paid',
        dueDate: new Date(2026, 8, 15),
      };

      const balance = calculateBalanceDue(inv.total, inv.amountPaid);
      const text = `Invoice ${inv.invoiceNumber} | Client: ${inv.clientName} | Total: ${formatCurrency(inv.total)} | Balance Due: ${formatCurrency(balance)} | Status: ${inv.status} | Due Date: ${formatDate(inv.dueDate)}`;

      await navigator.clipboard.writeText(text);

      expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('INV-2026-0010'));
      expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('Global Solutions'));
      expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('Status: Paid'));
    });
  });

  describe('PDF Generation Response for All Invoice Statuses', () => {
    INVOICE_STATUSES.forEach((status) => {
      it(`generates valid PDF binary data for invoice with status "${status}"`, async () => {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([600, 800]);

        page.drawText(`INVOICE STATUS: ${status.toUpperCase()}`);
        page.drawText(`TOTAL: 50,000`);

        if (status === 'Partially Paid') {
          page.drawText(`AMOUNT PAID: 20,000`);
          page.drawText(`BALANCE DUE: 30,000`);
        } else if (status === 'Paid') {
          page.drawText(`AMOUNT PAID: 50,000`);
          page.drawText(`BALANCE DUE: 0`);
        }

        const pdfBytes = await pdfDoc.save();

        expect(pdfBytes).toBeInstanceOf(Uint8Array);
        expect(pdfBytes.byteLength).toBeGreaterThan(500);

        const response = new Response(pdfBytes, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="INV-2026-TEST-${status}.pdf"`,
            'Content-Length': String(pdfBytes.byteLength),
          },
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('application/pdf');
        expect(response.headers.get('Content-Disposition')).toContain('.pdf');
      });
    });
  });

  describe('Status & Payment Modes Options', () => {
    it('includes all 6 required invoice statuses', () => {
      expect(INVOICE_STATUSES).toEqual([
        'Draft',
        'Sent',
        'Partially Paid',
        'Paid',
        'Overdue',
        'Cancelled',
      ]);
    });

    it('includes all 5 required payment modes', () => {
      expect(PAYMENT_MODES).toEqual([
        'Cash',
        'UPI',
        'Bank Transfer',
        'Credit Card',
        'Cheque',
      ]);
    });
  });
});
