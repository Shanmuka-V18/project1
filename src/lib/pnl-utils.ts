export interface CategoryAmount {
  category: string;
  amount: number;
}

export interface PnLCalculationResult {
  periodLabel: string;
  comparisonLabel: string;
  hasPrevData: boolean;
  currentMonth: {
    revenue: number;
    expenses: number;
    netIncome: number;
    profitMargin: number;
  };
  comparison: {
    prevRevenue: number;
    prevExpense: number;
    prevNetProfit: number;
    revenueGrowth: number;
    expenseGrowth: number;
    profitGrowth: number;
  };
  breakdown: {
    incomeCategories: Record<string, number>;
    expenseCategories: Record<string, number>;
  };
  // Backward compatibility fields
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  profitMargin: number;
  revenueByCategory: CategoryAmount[];
  expenseByCategory: CategoryAmount[];
}

export type ReportingPeriod = 'this-month' | 'last-month' | 'year' | 'all-time';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  prevStartDate: Date | null;
  prevEndDate: Date | null;
  periodLabel: string;
  comparisonLabel: string;
}

/**
 * Calculates start and end dates for current and comparison periods.
 * Handles month/year boundaries and year roll-over (e.g. Jan -> Dec prior year).
 */
export function getPeriodDateRanges(periodStr: string, refDate: Date = new Date()): DateRange {
  const period = (periodStr || 'this-month') as ReportingPeriod;
  const year = refDate.getFullYear();
  const month = refDate.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)

  let startDate: Date;
  let endDate: Date;
  let prevStartDate: Date | null = null;
  let prevEndDate: Date | null = null;
  let periodLabel = 'Current Month';
  let comparisonLabel = 'vs Previous Month';

  if (period === 'last-month') {
    periodLabel = 'Previous Month';
    comparisonLabel = 'vs Prior Month';
    // 1st day of previous month
    startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    // Last day of previous month
    endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // 2 months ago for comparison
    prevStartDate = new Date(year, month - 2, 1, 0, 0, 0, 0);
    prevEndDate = new Date(year, month - 1, 0, 23, 59, 59, 999);
  } else if (period === 'year') {
    periodLabel = 'Full Year';
    comparisonLabel = 'vs Prior Year';
    // Jan 1 of current year
    startDate = new Date(year, 0, 1, 0, 0, 0, 0);
    // Dec 31 of current year
    endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    // Prior year for comparison
    prevStartDate = new Date(year - 1, 0, 1, 0, 0, 0, 0);
    prevEndDate = new Date(year - 1, 11, 31, 23, 59, 59, 999);
  } else if (period === 'all-time') {
    periodLabel = 'All Time';
    comparisonLabel = 'All Time Accumulation';
    startDate = new Date(1970, 0, 1, 0, 0, 0, 0);
    endDate = new Date(2099, 11, 31, 23, 59, 59, 999);
    prevStartDate = null;
    prevEndDate = null;
  } else {
    // Default 'this-month'
    periodLabel = 'Current Month';
    comparisonLabel = 'vs Previous Month';
    // 1st day of current month
    startDate = new Date(year, month, 1, 0, 0, 0, 0);
    // Last day of current month
    endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Previous month for comparison
    prevStartDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    prevEndDate = new Date(year, month, 0, 23, 59, 59, 999);
  }

  return {
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
    periodLabel,
    comparisonLabel,
  };
}

export function calculateGrowthPercentage(current: number, previous: number): number {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }
  const growth = ((current - previous) / Math.abs(previous)) * 100;
  return Math.round(growth * 10) / 10;
}

export function calculatePnLData(
  incomes: Array<{ amount: number; category: string }>,
  expenses: Array<{ amount: number; category: string }>,
  prevIncomes: Array<{ amount: number; category: string }> = [],
  prevExpenses: Array<{ amount: number; category: string }> = [],
  periodInfo?: { periodLabel?: string; comparisonLabel?: string }
): PnLCalculationResult {
  const revenue = incomes.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalExpense = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const netIncome = revenue - totalExpense;
  const margin = revenue > 0 ? Math.round(((netIncome / revenue) * 100) * 10) / 10 : 0;

  const prevRevenue = prevIncomes.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const prevExpense = prevExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const prevNetProfit = prevRevenue - prevExpense;

  const revenueGrowth = calculateGrowthPercentage(revenue, prevRevenue);
  const expenseGrowth = calculateGrowthPercentage(totalExpense, prevExpense);
  const profitGrowth = calculateGrowthPercentage(netIncome, prevNetProfit);

  const hasPrevData = prevIncomes.length > 0 || prevExpenses.length > 0 || prevRevenue > 0 || prevExpense > 0;

  const incomeCategories: Record<string, number> = {};
  incomes.forEach((inc) => {
    const cat = inc.category || 'Other';
    incomeCategories[cat] = (incomeCategories[cat] || 0) + inc.amount;
  });

  const expenseCategories: Record<string, number> = {};
  expenses.forEach((exp) => {
    const cat = exp.category || 'Other';
    expenseCategories[cat] = (expenseCategories[cat] || 0) + exp.amount;
  });

  return {
    periodLabel: periodInfo?.periodLabel || 'Current Month',
    comparisonLabel: periodInfo?.comparisonLabel || 'vs Previous Month',
    hasPrevData,
    currentMonth: {
      revenue,
      expenses: totalExpense,
      netIncome,
      profitMargin: margin,
    },
    comparison: {
      prevRevenue,
      prevExpense,
      prevNetProfit,
      revenueGrowth,
      expenseGrowth,
      profitGrowth,
    },
    breakdown: {
      incomeCategories,
      expenseCategories,
    },
    totalRevenue: revenue,
    totalExpense,
    netProfit: netIncome,
    profitMargin: margin,
    revenueByCategory: Object.entries(incomeCategories).map(([category, amount]) => ({ category, amount })),
    expenseByCategory: Object.entries(expenseCategories).map(([category, amount]) => ({ category, amount })),
  };
}
