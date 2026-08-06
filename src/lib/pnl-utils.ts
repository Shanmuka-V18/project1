export interface CategoryAmount {
  category: string;
  amount: number;
}

export interface PnLCalculationResult {
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
  prevExpenses: Array<{ amount: number; category: string }> = []
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
