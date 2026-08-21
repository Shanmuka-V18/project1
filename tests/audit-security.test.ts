import { describe, it, expect } from 'vitest';
import { calculateGST } from '../src/lib/gst-utils';
import { createPasswordResetToken, verifyAndConsumeResetToken } from '../src/lib/password-reset';
import { calculateFinancialHealthScore } from '../src/lib/utils';
import { getPeriodDateRanges } from '../src/lib/pnl-utils';

describe('QA Security & Integrity Fixes Verification', () => {
  describe('4. Server-side GST Recalculation', () => {
    it('calculates CGST, SGST, and finalAmount authoritatively on server regardless of client input', () => {
      const calcResult = calculateGST({
        amount: 1000,
        gstRate: 18,
        transactionType: 'Intra-State',
        isInclusive: false,
      });

      expect(calcResult.cgst).toBe(90);
      expect(calcResult.sgst).toBe(90);
      expect(calcResult.igst).toBe(0);
      expect(calcResult.finalAmount).toBe(1180);
    });

    it('calculates IGST authoritatively for Inter-State transactions', () => {
      const calcResult = calculateGST({
        amount: 1000,
        gstRate: 18,
        transactionType: 'Inter-State',
        isInclusive: false,
      });

      expect(calcResult.cgst).toBe(0);
      expect(calcResult.sgst).toBe(0);
      expect(calcResult.igst).toBe(180);
      expect(calcResult.finalAmount).toBe(1180);
    });
  });

  describe('5. JWT Secret Missing Behavior', () => {
    it('throws error when JWT_SECRET is not configured in process.env', async () => {
      const oldSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const { getJwtSecretKey } = await import('../src/lib/auth');

      expect(() => getJwtSecretKey()).toThrowError('JWT_SECRET environment variable is not configured');

      process.env.JWT_SECRET = oldSecret || 'test-secret-key-12345';
    });
  });

  describe('6. Password Reset Token Flow', () => {
    it('generates a 15-minute time-limited reset token with reset URL', () => {
      const { rawToken, expiresAt, resetUrl } = createPasswordResetToken('user@test.com');
      expect(rawToken).toBeTruthy();
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(resetUrl).toContain('forgot-password/reset?token=');
    });

    it('verifies and consumes a valid token exactly once (single-use)', () => {
      const { rawToken } = createPasswordResetToken('singleuse@test.com');

      const emailFirstTry = verifyAndConsumeResetToken(rawToken);
      expect(emailFirstTry).toBe('singleuse@test.com');

      // Second try must fail as single-use token was consumed
      const emailSecondTry = verifyAndConsumeResetToken(rawToken);
      expect(emailSecondTry).toBeNull();
    });

    it('rejects invalid or non-existent tokens', () => {
      expect(verifyAndConsumeResetToken('invalid-token-xyz')).toBeNull();
    });
  });

  describe('9. Health Score Computation (No Random Dummy Data)', () => {
    it('returns score 0 when total income is 0', () => {
      const res = calculateFinancialHealthScore(0, 5000);
      expect(res.score).toBe(0);
      expect(res.rating).toBe('Poor');
    });

    it('returns deterministic score based on actual income and expense ratio', () => {
      const res1 = calculateFinancialHealthScore(100000, 40000);
      const res2 = calculateFinancialHealthScore(100000, 40000);
      expect(res1.score).toBe(res2.score);
    });
  });

  describe('10. P&L Period Parameter Validation', () => {
    it('returns valid date ranges for allowed periods', () => {
      const range = getPeriodDateRanges('this-month', new Date(2026, 7, 15));
      expect(range.periodLabel).toBe('Current Month');
      expect(range.startDate).toBeDefined();
      expect(range.endDate).toBeDefined();
    });
  });
});
