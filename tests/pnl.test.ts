import { describe, it, expect } from 'vitest';
import { calculatePnLData, calculateGrowthPercentage, getPeriodDateRanges } from '../src/lib/pnl-utils';

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

  describe('Reporting Period Date Range & Boundary Calculation', () => {
    it('calculates Current Month boundaries accurately from 1st 00:00 to last day 23:59:59.999', () => {
      const refDate = new Date(2026, 7, 15); // August 15, 2026
      const range = getPeriodDateRanges('this-month', refDate);

      expect(range.periodLabel).toBe('Current Month');
      expect(range.comparisonLabel).toBe('vs Previous Month');
      expect(range.startDate).toEqual(new Date(2026, 7, 1, 0, 0, 0, 0));
      expect(range.endDate).toEqual(new Date(2026, 7, 31, 23, 59, 59, 999));
      expect(range.prevStartDate).toEqual(new Date(2026, 6, 1, 0, 0, 0, 0));
      expect(range.prevEndDate).toEqual(new Date(2026, 6, 31, 23, 59, 59, 999));
    });

    it('handles January year-boundary rollover for Previous Month correctly', () => {
      const refDate = new Date(2026, 0, 10); // January 10, 2026
      const range = getPeriodDateRanges('last-month', refDate);

      expect(range.periodLabel).toBe('Previous Month');
      expect(range.comparisonLabel).toBe('vs Prior Month');
      // Previous month should be December 2025
      expect(range.startDate).toEqual(new Date(2025, 11, 1, 0, 0, 0, 0));
      expect(range.endDate).toEqual(new Date(2025, 11, 31, 23, 59, 59, 999));
      // Comparison 2 months ago should be November 2025
      expect(range.prevStartDate).toEqual(new Date(2025, 10, 1, 0, 0, 0, 0));
      expect(range.prevEndDate).toEqual(new Date(2025, 10, 30, 23, 59, 59, 999));
    });

    it('calculates Full Year date range (Jan 1 to Dec 31)', () => {
      const refDate = new Date(2026, 7, 15);
      const range = getPeriodDateRanges('year', refDate);

      expect(range.periodLabel).toBe('Full Year');
      expect(range.comparisonLabel).toBe('vs Prior Year');
      expect(range.startDate).toEqual(new Date(2026, 0, 1, 0, 0, 0, 0));
      expect(range.endDate).toEqual(new Date(2026, 11, 31, 23, 59, 59, 999));
      expect(range.prevStartDate).toEqual(new Date(2025, 0, 1, 0, 0, 0, 0));
      expect(range.prevEndDate).toEqual(new Date(2025, 11, 31, 23, 59, 59, 999));
    });

    it('calculates All Time date range', () => {
      const refDate = new Date(2026, 7, 15);
      const range = getPeriodDateRanges('all-time', refDate);

      expect(range.periodLabel).toBe('All Time');
      expect(range.comparisonLabel).toBe('All Time Accumulation');
      expect(range.prevStartDate).toBeNull();
      expect(range.prevEndDate).toBeNull();
    });

    it('calculates Custom Range date boundaries and equal-length preceding comparison period', () => {
      const refDate = new Date(2026, 7, 15);
      const range = getPeriodDateRanges('custom', refDate, '2026-06-01', '2026-08-31');

      expect(range.periodLabel).toBe('Custom Range (2026-06-01 to 2026-08-31)');
      expect(range.comparisonLabel).toBe('vs Prior Period');
      expect(range.startDate).toEqual(new Date(2026, 5, 1, 0, 0, 0, 0));
      expect(range.endDate).toEqual(new Date(2026, 7, 31, 23, 59, 59, 999));
      expect(range.prevEndDate).toBeDefined();
      expect(range.prevStartDate).toBeDefined();
    });
  });

  describe('Multi-Period Data Filtering & Aggregation', () => {
    // Seed test dataset spanning 4 different months/years:
    // Aug 2026 (Current Month), Jul 2026 (Previous Month), Jun 2026 (2 months ago), Nov 2025 (Prior Year)
    const testDataset = {
      incomes: [
        { amount: 100000, category: 'Consulting', date: new Date(2026, 7, 1, 0, 0, 0, 0) }, // Aug 1 (1st day)
        { amount: 50000, category: 'Freelance', date: new Date(2026, 7, 31, 23, 59, 59, 999) }, // Aug 31 (last day)
        { amount: 80000, category: 'Consulting', date: new Date(2026, 6, 15, 12, 0, 0, 0) }, // Jul 15
        { amount: 60000, category: 'Investments', date: new Date(2026, 5, 20, 12, 0, 0, 0) }, // Jun 20
        { amount: 120000, category: 'Consulting', date: new Date(2025, 10, 10, 12, 0, 0, 0) }, // Nov 10, 2025
      ],
      expenses: [
        { amount: 30000, category: 'Rent', date: new Date(2026, 7, 1, 0, 0, 0, 0) }, // Aug 1 (1st day)
        { amount: 20000, category: 'Software', date: new Date(2026, 7, 31, 23, 59, 59, 999) }, // Aug 31 (last day)
        { amount: 25000, category: 'Rent', date: new Date(2026, 6, 10, 12, 0, 0, 0) }, // Jul 10
        { amount: 15000, category: 'Utilities', date: new Date(2026, 5, 15, 12, 0, 0, 0) }, // Jun 15
        { amount: 40000, category: 'Rent', date: new Date(2025, 10, 5, 12, 0, 0, 0) }, // Nov 5, 2025
      ],
    };

    const refDate = new Date(2026, 7, 15); // August 15, 2026

    it('filters Current Month correctly including 1st and last day transactions', () => {
      const { startDate, endDate, prevStartDate, prevEndDate, periodLabel, comparisonLabel } = getPeriodDateRanges('this-month', refDate);

      const incomes = testDataset.incomes.filter((i) => i.date >= startDate && i.date <= endDate);
      const expenses = testDataset.expenses.filter((e) => e.date >= startDate && e.date <= endDate);

      const prevIncomes = testDataset.incomes.filter((i) => i.date >= prevStartDate! && i.date <= prevEndDate!);
      const prevExpenses = testDataset.expenses.filter((e) => e.date >= prevStartDate! && e.date <= prevEndDate!);

      const result = calculatePnLData(incomes, expenses, prevIncomes, prevExpenses, { periodLabel, comparisonLabel });

      // Aug Incomes: 100k + 50k = 150k (includes Aug 1 and Aug 31)
      expect(result.currentMonth.revenue).toBe(150000);
      // Aug Expenses: 30k + 20k = 50k
      expect(result.currentMonth.expenses).toBe(50000);
      // Net Income: 150k - 50k = 100k
      expect(result.currentMonth.netIncome).toBe(100000);
      // Margin: 66.7%
      expect(result.currentMonth.profitMargin).toBe(66.7);

      // Prior period (Jul): Revenue 80k, Expenses 25k, Net 55k
      expect(result.comparison.prevRevenue).toBe(80000);
      expect(result.comparison.prevExpense).toBe(25000);
      expect(result.comparison.prevNetProfit).toBe(55000);
      expect(result.hasPrevData).toBe(true);
    });

    it('filters Previous Month (July) correctly', () => {
      const { startDate, endDate, prevStartDate, prevEndDate, periodLabel, comparisonLabel } = getPeriodDateRanges('last-month', refDate);

      const incomes = testDataset.incomes.filter((i) => i.date >= startDate && i.date <= endDate);
      const expenses = testDataset.expenses.filter((e) => e.date >= startDate && e.date <= endDate);

      const prevIncomes = testDataset.incomes.filter((i) => i.date >= prevStartDate! && i.date <= prevEndDate!);
      const prevExpenses = testDataset.expenses.filter((e) => e.date >= prevStartDate! && e.date <= prevEndDate!);

      const result = calculatePnLData(incomes, expenses, prevIncomes, prevExpenses, { periodLabel, comparisonLabel });

      // Jul Incomes: 80k
      expect(result.currentMonth.revenue).toBe(80000);
      // Jul Expenses: 25k
      expect(result.currentMonth.expenses).toBe(25000);
      // Net Income: 55k
      expect(result.currentMonth.netIncome).toBe(55000);

      // Comparison period (Jun): Revenue 60k, Expenses 15k
      expect(result.comparison.prevRevenue).toBe(60000);
      expect(result.comparison.prevExpense).toBe(15000);
    });

    it('filters Custom Range (Jan 1 to Dec 31, 2026) correctly including exact boundary dates', () => {
      const { startDate, endDate, prevStartDate, prevEndDate, periodLabel, comparisonLabel } = getPeriodDateRanges('custom', refDate, '2026-01-01', '2026-12-31');

      const incomes = testDataset.incomes.filter((i) => i.date >= startDate && i.date <= endDate);
      const expenses = testDataset.expenses.filter((e) => e.date >= startDate && e.date <= endDate);

      const prevIncomes = testDataset.incomes.filter((i) => i.date >= prevStartDate! && i.date <= prevEndDate!);
      const prevExpenses = testDataset.expenses.filter((e) => e.date >= prevStartDate! && e.date <= prevEndDate!);

      const result = calculatePnLData(incomes, expenses, prevIncomes, prevExpenses, { periodLabel, comparisonLabel });

      // Incomes for 2026: 100k + 50k + 80k + 60k = 290k (includes Aug 1 & Aug 31 boundaries)
      expect(result.currentMonth.revenue).toBe(290000);
      // Expenses for 2026: 30k + 20k + 25k + 15k = 90k
      expect(result.currentMonth.expenses).toBe(90000);
      // Net Income: 200k
      expect(result.currentMonth.netIncome).toBe(200000);

      // Prior equal length period (2025): Revenue 120k, Expenses 40k
      expect(result.comparison.prevRevenue).toBe(120000);
      expect(result.comparison.prevExpense).toBe(40000);
    });

    it('filters Full Year (2026) correctly excluding prior year records', () => {
      const { startDate, endDate, prevStartDate, prevEndDate, periodLabel, comparisonLabel } = getPeriodDateRanges('year', refDate);

      const incomes = testDataset.incomes.filter((i) => i.date >= startDate && i.date <= endDate);
      const expenses = testDataset.expenses.filter((e) => e.date >= startDate && e.date <= endDate);

      const prevIncomes = testDataset.incomes.filter((i) => i.date >= prevStartDate! && i.date <= prevEndDate!);
      const prevExpenses = testDataset.expenses.filter((e) => e.date >= prevStartDate! && e.date <= prevEndDate!);

      const result = calculatePnLData(incomes, expenses, prevIncomes, prevExpenses, { periodLabel, comparisonLabel });

      // 2026 Incomes: 100k + 50k + 80k + 60k = 290k (Nov 2025 excluded!)
      expect(result.currentMonth.revenue).toBe(290000);
      // 2026 Expenses: 30k + 20k + 25k + 15k = 90k
      expect(result.currentMonth.expenses).toBe(90000);
      // Net Income: 200k
      expect(result.currentMonth.netIncome).toBe(200000);

      // Comparison period (2025): Revenue 120k, Expenses 40k
      expect(result.comparison.prevRevenue).toBe(120000);
      expect(result.comparison.prevExpense).toBe(40000);
    });

    it('filters All Time correctly returning full historical totals', () => {
      const { startDate, endDate, periodLabel, comparisonLabel } = getPeriodDateRanges('all-time', refDate);

      const incomes = testDataset.incomes.filter((i) => i.date >= startDate && i.date <= endDate);
      const expenses = testDataset.expenses.filter((e) => e.date >= startDate && e.date <= endDate);

      const result = calculatePnLData(incomes, expenses, [], [], { periodLabel, comparisonLabel });

      // All Time Incomes: 100k + 50k + 80k + 60k + 120k = 410k
      expect(result.currentMonth.revenue).toBe(410000);
      // All Time Expenses: 30k + 20k + 25k + 15k + 40k = 130k
      expect(result.currentMonth.expenses).toBe(130000);
      // Net Income: 280k
      expect(result.currentMonth.netIncome).toBe(280000);
      expect(result.hasPrevData).toBe(false);
    });
  });
});
