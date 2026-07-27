import { describe, it, expect } from 'vitest';
import { calculateGST } from '../src/lib/utils';

describe('GST Calculator Engine', () => {
  it('correctly calculates 18% Intra-State GST (50% CGST + 50% SGST)', () => {
    const result = calculateGST(100000, 18, 'Intra-State');
    expect(result.amount).toBe(100000);
    expect(result.gstRate).toBe(18);
    expect(result.totalTax).toBe(18000);
    expect(result.cgst).toBe(9000);
    expect(result.sgst).toBe(9000);
    expect(result.igst).toBe(0);
    expect(result.finalAmount).toBe(118000);
  });

  it('correctly calculates 18% Inter-State GST (100% IGST)', () => {
    const result = calculateGST(100000, 18, 'Inter-State');
    expect(result.amount).toBe(100000);
    expect(result.gstRate).toBe(18);
    expect(result.totalTax).toBe(18000);
    expect(result.cgst).toBe(0);
    expect(result.sgst).toBe(0);
    expect(result.igst).toBe(18000);
    expect(result.finalAmount).toBe(118000);
  });

  it('correctly handles 0% GST rate', () => {
    const result = calculateGST(50000, 0, 'Intra-State');
    expect(result.totalTax).toBe(0);
    expect(result.cgst).toBe(0);
    expect(result.sgst).toBe(0);
    expect(result.finalAmount).toBe(50000);
  });

  it('correctly handles 12% Intra-State rate', () => {
    const result = calculateGST(45000, 12, 'Intra-State');
    expect(result.totalTax).toBe(5400);
    expect(result.cgst).toBe(2700);
    expect(result.sgst).toBe(2700);
    expect(result.finalAmount).toBe(50400);
  });
});
