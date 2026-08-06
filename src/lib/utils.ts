import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { calculateGST as calculateGSTEngine } from './gst-utils';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function calculateGST(
  amount: number,
  gstRate: number,
  transactionType: 'Intra-State' | 'Inter-State',
  isInclusive: boolean = false
) {
  const res = calculateGSTEngine({ amount, gstRate, transactionType, isInclusive });
  return {
    ...res,
    totalTax: res.gstAmount,
  };
}

export function calculateFinancialHealthScore(
  totalIncome: number,
  totalExpense: number,
  activeBudgetsCount: number = 0,
  exceededBudgetsCount: number = 0
) {
  if (totalIncome === 0) {
    return {
      score: 0,
      rating: 'Poor',
      factors: {
        savingsRateScore: 0,
        expenseRatioScore: 0,
        budgetAdherenceScore: 0,
        emergencyFundScore: 0,
        incomeConsistencyScore: 0,
      },
      metrics: {
        savingsRate: 0,
        expenseRatio: 100,
        activeBudgets: activeBudgetsCount,
        exceededBudgets: exceededBudgetsCount,
      },
      suggestions: ['Start by logging your income and monthly expenses to calculate your health score.'],
    };
  }

  const savingsRate = Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100);
  const expenseRatio = (totalExpense / totalIncome) * 100;

  // Factor 1: Savings Rate (max 25 pts)
  let savingsRateScore = 0;
  if (savingsRate >= 30) savingsRateScore = 25;
  else if (savingsRate >= 20) savingsRateScore = 20;
  else if (savingsRate >= 10) savingsRateScore = 15;
  else if (savingsRate > 0) savingsRateScore = 8;

  // Factor 2: Expense Ratio (max 25 pts)
  let expenseRatioScore = 0;
  if (expenseRatio <= 50) expenseRatioScore = 25;
  else if (expenseRatio <= 70) expenseRatioScore = 20;
  else if (expenseRatio <= 85) expenseRatioScore = 15;
  else if (expenseRatio <= 100) expenseRatioScore = 8;

  // Factor 3: Budget Adherence (max 25 pts)
  let budgetAdherenceScore = 25;
  if (activeBudgetsCount > 0) {
    const exceededRatio = exceededBudgetsCount / activeBudgetsCount;
    budgetAdherenceScore = Math.max(0, Math.round(25 * (1 - exceededRatio)));
  }

  // Factor 4: Emergency Reserve Cushion (max 15 pts)
  let emergencyFundScore = totalIncome >= totalExpense ? 15 : 5;

  // Factor 5: Income Consistency (max 10 pts)
  let incomeConsistencyScore = 10;

  const totalScore = Math.min(
    100,
    savingsRateScore + expenseRatioScore + budgetAdherenceScore + emergencyFundScore + incomeConsistencyScore
  );

  let rating = 'Fair';
  if (totalScore >= 80) rating = 'Excellent';
  else if (totalScore >= 70) rating = 'Good';
  else if (totalScore >= 50) rating = 'Fair';
  else rating = 'Needs Improvement';

  const suggestions: string[] = [];
  if (savingsRate < 20) suggestions.push('Try to save at least 20% of your income each month.');
  if (expenseRatio > 70) suggestions.push('Reduce discretionary spending to lower your expense ratio.');
  if (exceededBudgetsCount > 0) suggestions.push('Review exceeded budget categories to stay on track.');
  if (suggestions.length === 0) suggestions.push('Keep up the good financial habits!');

  return {
    score: totalScore,
    rating,
    factors: {
      savingsRateScore,
      expenseRatioScore,
      budgetAdherenceScore,
      emergencyFundScore,
      incomeConsistencyScore,
    },
    metrics: {
      savingsRate: Math.round(savingsRate),
      expenseRatio: Math.round(expenseRatio),
      activeBudgets: activeBudgetsCount,
      exceededBudgets: exceededBudgetsCount,
    },
    suggestions,
  };
}
