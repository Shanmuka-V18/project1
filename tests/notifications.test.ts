import { describe, it, expect } from 'vitest';
import {
  evaluateSpendingExceedsIncome,
  evaluateBudgetThresholds,
  evaluateInvoiceDueAlert,
} from '../src/lib/notifications';

describe('Notification Trigger Engine', () => {
  describe('Spending Exceeds Income Trigger', () => {
    it('triggers a "Low Balance" alert when monthly expenses exceed income', () => {
      const alert = evaluateSpendingExceedsIncome(100000, 120000);
      expect(alert).not.toBeNull();
      expect(alert?.type).toBe('Low Balance');
      expect(alert?.message).toContain('exceed total income');
      expect(alert?.message).toContain('by ₹20,000');
    });

    it('does NOT trigger alert when income covers expenses', () => {
      const alert = evaluateSpendingExceedsIncome(150000, 120000);
      expect(alert).toBeNull();
    });

    it('does NOT trigger alert when total income is 0 (new account state)', () => {
      const alert = evaluateSpendingExceedsIncome(0, 5000);
      expect(alert).toBeNull();
    });
  });

  describe('Budget Threshold Triggers', () => {
    it('triggers "Budget Exceeded" alert when spending >= 100%', () => {
      const alert = evaluateBudgetThresholds(55000, 50000, 'Rent');
      expect(alert).not.toBeNull();
      expect(alert?.type).toBe('Budget Exceeded');
      expect(alert?.message).toContain('Rent');
      expect(alert?.message).toContain('exceeded your monthly budget');
    });

    it('triggers "Budget Reminder" alert when spending is between 80% and 99%', () => {
      const alert = evaluateBudgetThresholds(42000, 50000, 'Software');
      expect(alert).not.toBeNull();
      expect(alert?.type).toBe('Budget Reminder');
      expect(alert?.message).toContain('84%');
    });

    it('does NOT trigger alert when spending is below 80%', () => {
      const alert = evaluateBudgetThresholds(30000, 50000, 'Software');
      expect(alert).toBeNull();
    });
  });

  describe('Invoice Due Triggers', () => {
    it('triggers "Invoice Due" reminder when due in 2 days', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 2);

      const alert = evaluateInvoiceDueAlert(dueDate, 'Acme Corp', 'INV-2026-0001', 'Sent');
      expect(alert).not.toBeNull();
      expect(alert?.type).toBe('Invoice Due');
      expect(alert?.message).toContain('INV-2026-0001');
      expect(alert?.message).toContain('Acme Corp');
    });

    it('does NOT trigger alert if invoice is already Paid', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);

      const alert = evaluateInvoiceDueAlert(dueDate, 'Acme Corp', 'INV-2026-0001', 'Paid');
      expect(alert).toBeNull();
    });
  });
});
