import { describe, it, expect } from 'vitest';
import {
  evaluateLowBalance,
  evaluateSpendingExceedsIncome,
  evaluateBudgetThresholds,
  evaluateInvoiceDueAlert,
  evaluateMonthlyReportReady,
} from '../src/lib/notifications';

describe('Notification Trigger Engine', () => {
  describe('Low Balance Trigger & Non-Contradictory Message Integrity', () => {
    it('triggers a "Low Balance" alert when monthly expenses exceed income', () => {
      const alert = evaluateLowBalance(100000, 120000);
      expect(alert).not.toBeNull();
      expect(alert?.type).toBe('Low Balance');
      expect(alert?.message).toContain('Warning');
      expect(alert?.message).toContain('exceed income');
      expect(alert?.message).toContain('by ₹20,000');
    });

    it('triggers a "Low Balance" alert when reserve ratio is below 15%', () => {
      const alert = evaluateLowBalance(100000, 90000); // 10% reserve ratio
      expect(alert).not.toBeNull();
      expect(alert?.type).toBe('Low Balance');
      expect(alert?.message).toContain('10% of income');
      expect(alert?.message).toContain('below the 15% safety threshold');
    });

    it('REGRESSION TEST: Low Balance message MUST NEVER describe cash reserves as healthy', () => {
      const alert = evaluateLowBalance(100000, 120000);
      if (alert) {
        expect(alert.message.toLowerCase()).not.toContain('healthy');
        expect(alert.message.toLowerCase()).not.toContain('above target threshold');
      }

      const alertThreshold = evaluateLowBalance(100000, 90000);
      if (alertThreshold) {
        expect(alertThreshold.message.toLowerCase()).not.toContain('healthy');
      }
    });

    it('does NOT trigger alert when cash reserves are healthy (> 15%)', () => {
      const alert = evaluateLowBalance(200000, 100000); // 50% reserve ratio
      expect(alert).toBeNull();
    });

    it('does NOT trigger alert when total income is 0 (new account state)', () => {
      const alert = evaluateLowBalance(0, 5000);
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
    it('triggers "Invoice Due" reminder when due in 2 days for active invoices', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 2);

      const alert = evaluateInvoiceDueAlert(dueDate, 'Acme Corp', 'INV-2026-0001', 'Sent');
      expect(alert).not.toBeNull();
      expect(alert?.type).toBe('Invoice Due');
      expect(alert?.message).toContain('INV-2026-0001');
      expect(alert?.message).toContain('Acme Corp');
    });

    it('does NOT trigger alert if invoice status is Paid or Cancelled', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);

      expect(evaluateInvoiceDueAlert(dueDate, 'Acme Corp', 'INV-2026-0001', 'Paid')).toBeNull();
      expect(evaluateInvoiceDueAlert(dueDate, 'Acme Corp', 'INV-2026-0002', 'Cancelled')).toBeNull();
    });
  });

  describe('Monthly Report Ready Trigger', () => {
    it('generates Monthly Report notification with correct month and year', () => {
      const notif = evaluateMonthlyReportReady(8, 2026);
      expect(notif.type).toBe('Monthly Report');
      expect(notif.message).toContain('August 2026');
      expect(notif.triggerKey).toBe('MONTHLY_REPORT_8_2026');
    });
  });

  describe('Notification Read State Transition Integrity', () => {
    it('updates only the single targeted notification to read state when individually marked', () => {
      const initial = [
        { id: '1', type: 'Budget Exceeded', isRead: false },
        { id: '2', type: 'Invoice Due', isRead: false },
        { id: '3', type: 'Monthly Report', isRead: true },
      ];

      const targetId = '1';
      const updated = initial.map((n) => (n.id === targetId ? { ...n, isRead: true } : n));

      expect(updated.find((n) => n.id === '1')?.isRead).toBe(true);
      expect(updated.find((n) => n.id === '2')?.isRead).toBe(false);
      expect(updated.filter((n) => !n.isRead).length).toBe(1);
    });

    it('updates all notifications to read state when Mark All as Read is triggered', () => {
      const initial = [
        { id: '1', type: 'Budget Exceeded', isRead: false },
        { id: '2', type: 'Invoice Due', isRead: false },
      ];

      const updated = initial.map((n) => ({ ...n, isRead: true }));

      expect(updated.every((n) => n.isRead)).toBe(true);
      expect(updated.filter((n) => !n.isRead).length).toBe(0);
    });
  });
});
