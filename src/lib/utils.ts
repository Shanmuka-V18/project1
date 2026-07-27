import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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

export interface GSTCalculationResult {
  amount: number;
  gstRate: number;
  transactionType: 'Intra-State' | 'Inter-State';
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  finalAmount: number;
}

export function calculateGST(
  amount: number,
  gstRate: number,
  transactionType: 'Intra-State' | 'Inter-State'
): GSTCalculationResult {
  const totalTax = (amount * gstRate) / 100;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (transactionType === 'Intra-State') {
    cgst = totalTax / 2;
    sgst = totalTax / 2;
    igst = 0;
  } else {
    cgst = 0;
    sgst = 0;
    igst = totalTax;
  }

  const finalAmount = amount + totalTax;

  return {
    amount,
    gstRate,
    transactionType,
    cgst,
    sgst,
    igst,
    totalTax,
    finalAmount,
  };
}

export interface HealthScoreFactors {
  savingsRateScore: number;
  expenseRatioScore: number;
  budgetAdherenceScore: number;
  emergencyFundScore: number;
  incomeConsistencyScore: number;
}

export interface HealthScoreResult {
  score: number;
  rating: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  factors: HealthScoreFactors;
  suggestions: string[];
}

export function calculateFinancialHealthScore(
  totalIncome: number,
  totalExpense: number,
  budgetsCount: number,
  exceededBudgetsCount: number
): HealthScoreResult {
  if (totalIncome <= 0) {
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
      suggestions: ['Record income entries to start tracking your financial health.'],
    };
  }

  const netSavings = totalIncome - totalExpense;
  const savingsRate = Math.max(0, netSavings / totalIncome); // 0 to 1
  const expenseRatio = totalExpense / totalIncome; // lower is better

  // 1. Savings Rate Score (0 - 25)
  const savingsRateScore = Math.min(25, savingsRate * 100 * 0.83); // 30% savings rate yields max 25 pts

  // 2. Expense Ratio Score (0 - 25)
  // If expense ratio <= 0.5 (50%), max score 25. If > 1.0, score 0.
  const expenseRatioScore = expenseRatio <= 0.5 ? 25 : Math.max(0, (1 - expenseRatio) * 50);

  // 3. Budget Adherence Score (0 - 25)
  let budgetAdherenceScore = 25;
  if (budgetsCount > 0) {
    const passedRatio = (budgetsCount - exceededBudgetsCount) / budgetsCount;
    budgetAdherenceScore = passedRatio * 25;
  }

  // 4. Emergency Reserve / Stability Score (0 - 15)
  const emergencyFundScore = netSavings > 0 ? 15 : 5;

  // 5. Income Consistency Score (0 - 10)
  const incomeConsistencyScore = 10;

  const totalScore = Math.round(
    savingsRateScore + expenseRatioScore + budgetAdherenceScore + emergencyFundScore + incomeConsistencyScore
  );

  let rating: 'Poor' | 'Fair' | 'Good' | 'Excellent' = 'Fair';
  if (totalScore >= 80) rating = 'Excellent';
  else if (totalScore >= 65) rating = 'Good';
  else if (totalScore >= 50) rating = 'Fair';
  else rating = 'Poor';

  const suggestions: string[] = [];
  if (savingsRate < 0.2) suggestions.push('Aim to save at least 20% of your total monthly income.');
  if (exceededBudgetsCount > 0) suggestions.push(`Review the ${exceededBudgetsCount} category budget(s) that exceeded target limits.`);
  if (expenseRatio > 0.8) suggestions.push('High expense-to-income ratio detected. Consider reducing non-essential expenses.');
  if (suggestions.length === 0) suggestions.push('Great job! Maintain your balanced spending and savings trajectory.');

  return {
    score: totalScore,
    rating,
    factors: {
      savingsRateScore: Math.round(savingsRateScore),
      expenseRatioScore: Math.round(expenseRatioScore),
      budgetAdherenceScore: Math.round(budgetAdherenceScore),
      emergencyFundScore: Math.round(emergencyFundScore),
      incomeConsistencyScore: Math.round(incomeConsistencyScore),
    },
    suggestions,
  };
}
