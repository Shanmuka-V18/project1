import { describe, it, expect } from 'vitest';
import { calculatePnLData, calculateGrowthPercentage } from '../src/lib/pnl-utils';

describe('P&L Reports Calculation Engine', () => {
  describe('Period-over-Period Growth Math', () => {
    it('calculates positive growth percentage correctly', () => {
      expect(calculateGrowthPercentage(150, 100)).toBe(50);
      expect(calculateGrowthPercentage(200, 100)).toBe(100);
    });

    it('calculates negative growth percentage correctly', () => {
      expect(calculateGrowthPercentage(80, 100)).toBe(-20);
    });

    it('handles zero previous period gracefully without division by zero', () => {
      expect(calculateGrowthPercentage(0, 0)).toBe(0);
      expect(calculateGrowthPercentage(500, 0)).toBe(100);
    });
  });

  describe('P&L Aggregation & EBITDA Calculation', () => {
    it('computes current period revenue, expenses, net income, and margin accurately', () => {
      const incomes = [
        { amount: 100000, category: 'Consulting' },
        { amount: 50000, category: 'Freelance' },
      ];
      const expenses = [
        { amount: 30000, category: 'Rent' },
        { amount: 15000, category: 'Software' },
        { amount: 5000, category: 'Utilities' },
      ];

      const result = calculatePnLData(incomes, expenses);

      expect(result.currentMonth.revenue).toBe(150000);
      expect(result.currentMonth.expenses).toBe(50000);
      expect(result.currentMonth.netIncome).toBe(100000);
      expect(result.currentMonth.profitMargin).toBe(66.7);

      // Verify breakdown maps match sum
      expect(result.breakdown.incomeCategories).toEqual({
        Consulting: 100000,
        Freelance: 50000,
      });

      expect(result.breakdown.expenseCategories).toEqual({
        Rent: 30000,
        Software: 15000,
        Utilities: 5000,
      });

      // Backward compatibility fields
      expect(result.totalRevenue).toBe(150000);
      expect(result.totalExpense).toBe(50000);
      expect(result.netProfit).toBe(100000);
    });

    it('computes growth comparison against prior period records', () => {
      const incomes = [{ amount: 200000, category: 'Consulting' }];
      const expenses = [{ amount: 60000, category: 'Rent' }];

      const prevIncomes = [{ amount: 160000, category: 'Consulting' }];
      const prevExpenses = [{ amount: 50000, category: 'Rent' }];

      const result = calculatePnLData(incomes, expenses, prevIncomes, prevExpenses);

      expect(result.comparison.prevRevenue).toBe(160000);
      expect(result.comparison.prevExpense).toBe(50000);
      expect(result.comparison.prevNetProfit).toBe(110000);

      // 200k vs 160k = +25%
      expect(result.comparison.revenueGrowth).toBe(25);
      // 60k vs 50k = +20%
      expect(result.comparison.expenseGrowth).toBe(20);
      // 140k net vs 110k net = +27.3%
      expect(result.comparison.profitGrowth).toBe(27.3);
    });
  });
});
