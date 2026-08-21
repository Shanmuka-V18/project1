import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculateFinancialHealthScore } from '@/lib/utils';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const monthNum = now.getMonth() + 1;
  const yearNum = now.getFullYear();

  // Prepare 6 months trend history query targets
  const trendMonthTargets = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);
    const monthLabel = d.toLocaleString('en-IN', { month: 'short' });
    trendMonthTargets.push({ m, y, startDate, endDate, monthLabel, isCurrentMonth: i === 0 });
  }

  // Execute current month base queries
  const [incomes, expenses, userBudgets] = await Promise.all([
    prisma.income.findMany({
      where: { userId: currentUser.userId, date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth } },
    }),
    prisma.expense.findMany({
      where: { userId: currentUser.userId, date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth } },
    }),
    prisma.budget.findMany({
      where: { userId: currentUser.userId, month: monthNum, year: yearNum },
    }),
  ]);

  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const expenseByCategoryMap: Record<string, number> = {};
  expenses.forEach((exp) => {
    expenseByCategoryMap[exp.category] = (expenseByCategoryMap[exp.category] || 0) + exp.amount;
  });

  let exceededBudgetsCount = 0;
  userBudgets.forEach((b) => {
    const actualSpent = expenseByCategoryMap[b.category] || 0;
    if (actualSpent >= b.monthlyLimit) exceededBudgetsCount++;
  });

  const healthResult = calculateFinancialHealthScore(
    totalIncome,
    totalExpense,
    userBudgets.length,
    exceededBudgetsCount
  );

  // Compute actual trend history for 6 months (no random dummy values)
  const trendHistory = await Promise.all(
    trendMonthTargets.map(async (target) => {
      if (target.isCurrentMonth) {
        return { month: target.monthLabel, score: healthResult.score };
      }

      // Check DB for recorded health score
      const healthRec = await prisma.financialHealth.findUnique({
        where: {
          userId_month_year: {
            userId: currentUser.userId,
            month: target.m,
            year: target.y,
          },
        },
      });

      if (healthRec) {
        return { month: target.monthLabel, score: healthRec.score };
      }

      // Calculate real score from past month income/expenses
      const [pastIncomes, pastExpenses] = await Promise.all([
        prisma.income.findMany({
          where: { userId: currentUser.userId, date: { gte: target.startDate, lte: target.endDate } },
        }),
        prisma.expense.findMany({
          where: { userId: currentUser.userId, date: { gte: target.startDate, lte: target.endDate } },
        }),
      ]);

      const pastIncTotal = pastIncomes.reduce((acc, curr) => acc + curr.amount, 0);
      const pastExpTotal = pastExpenses.reduce((acc, curr) => acc + curr.amount, 0);

      if (pastIncTotal === 0 && pastExpTotal === 0) {
        return { month: target.monthLabel, score: null }; // Return null for months with no data
      }

      const pastHealth = calculateFinancialHealthScore(pastIncTotal, pastExpTotal, 0, 0);
      return { month: target.monthLabel, score: pastHealth.score };
    })
  );

  return NextResponse.json({
    currentScore: healthResult.score,
    rating: healthResult.rating,
    factors: healthResult.factors,
    suggestions: healthResult.suggestions,
    trendHistory,
    metrics: {
      totalIncome,
      totalExpense,
      savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0,
      activeBudgets: userBudgets.length,
      exceededBudgets: exceededBudgetsCount,
    },
  });
}
