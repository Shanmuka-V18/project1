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
    const monthLabel = d.toLocaleString('en-IN', { month: 'short' });
    trendMonthTargets.push({ m, y, monthLabel, index: i });
  }

  // Execute all queries in one parallel batch via Promise.all
  const [incomes, expenses, userBudgets, ...healthRecords] = await Promise.all([
    prisma.income.findMany({
      where: { userId: currentUser.userId, date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth } },
    }),
    prisma.expense.findMany({
      where: { userId: currentUser.userId, date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth } },
    }),
    prisma.budget.findMany({
      where: { userId: currentUser.userId, month: monthNum, year: yearNum },
    }),
    ...trendMonthTargets.map(({ m, y }) =>
      prisma.financialHealth.findUnique({
        where: {
          userId_month_year: {
            userId: currentUser.userId,
            month: m,
            year: y,
          },
        },
      })
    ),
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

  const trendHistory = trendMonthTargets.map(({ monthLabel, index }, idx) => {
    const healthRec = healthRecords[idx];
    return {
      month: monthLabel,
      score: healthRec ? healthRec.score : (index === 0 ? healthResult.score : 75),
    };
  });

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
