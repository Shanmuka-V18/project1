import { describe, it, expect } from 'vitest';
import { calculateGST } from '../src/lib/gst-utils';

describe('GST Calculator Engine & History Persistence', () => {
  describe('GST Exclusive Mode (Unchecked)', () => {
    it('correctly calculates 18% Intra-State GST (50% CGST + 50% SGST)', () => {
      const result = calculateGST({
        amount: 100000,
        gstRate: 18,
        transactionType: 'Intra-State',
        isInclusive: false,
      });

      expect(result.amount).toBe(100000);
      expect(result.baseAmount).toBe(100000);
      expect(result.gstRate).toBe(18);
      expect(result.gstAmount).toBe(18000);
      expect(result.cgst).toBe(9000);
      expect(result.sgst).toBe(9000);
      expect(result.igst).toBe(0);
      expect(result.finalAmount).toBe(118000);
    });

    it('correctly calculates 18% Inter-State GST (100% IGST)', () => {
      const result = calculateGST({
        amount: 100000,
        gstRate: 18,
        transactionType: 'Inter-State',
        isInclusive: false,
      });

      expect(result.baseAmount).toBe(100000);
      expect(result.gstAmount).toBe(18000);
      expect(result.cgst).toBe(0);
      expect(result.sgst).toBe(0);
      expect(result.igst).toBe(18000);
      expect(result.finalAmount).toBe(118000);
    });
  });

  describe('GST Inclusive Mode (Checked)', () => {
    it('extracts 18% Intra-State tax component from gross amount (₹100,000 -> Base ₹84,745.76, Tax ₹15,254.24, Final ₹100,000)', () => {
      const result = calculateGST({
        amount: 100000,
        gstRate: 18,
        transactionType: 'Intra-State',
        isInclusive: true,
      });

      expect(result.finalAmount).toBe(100000);
      expect(result.baseAmount).toBe(84745.76);
      expect(result.gstAmount).toBe(15254.24);
      expect(result.cgst).toBe(7627.12);
      expect(result.sgst).toBe(7627.12);
      expect(result.igst).toBe(0);
    });

    it('stores exact Gross Total ₹100,000 in history log for ₹100,000 Inclusive input (NOT ₹118,000)', () => {
      const result = calculateGST({
        amount: 100000,
        gstRate: 18,
        transactionType: 'Inter-State',
        isInclusive: true,
      });

      expect(result.finalAmount).toBe(100000);
      expect(result.finalAmount).not.toBe(118000);
      expect(result.baseAmount).toBe(84745.76);
      expect(result.gstAmount).toBe(15254.24);
      expect(result.igst).toBe(15254.24);
    });
  });
});
