import { describe, it, expect } from 'vitest';
import {
  validatePhoneNumber,
  calculateBalanceDue,
  duplicateInvoiceData,
  INVOICE_STATUSES,
  PAYMENT_MODES,
} from '../src/lib/invoice-utils';

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
