import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const archivedSummaries = [];

  // Generate monthly summary archives for past 6 months
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const monthNum = d.getMonth() + 1;
    const yearNum = d.getFullYear();
    const monthLabel = d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

    const mIncomes = await prisma.income.aggregate({
      where: { userId: currentUser.userId, date: { gte: mStart, lte: mEnd } },
      _sum: { amount: true },
    });

    const mExpensesList = await prisma.expense.findMany({
      where: { userId: currentUser.userId, date: { gte: mStart, lte: mEnd } },
    });

    const totalIncome = mIncomes._sum.amount || 0;
    const totalExpense = mExpensesList.reduce((acc, curr) => acc + curr.amount, 0);
    const netSavings = totalIncome - totalExpense;

    // Top 3 expense categories
    const categoryMap: Record<string, number> = {};
    mExpensesList.forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });

    const topCategories = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, amt]) => ({ category: cat, amount: amt }));

    // Saved health score
    const health = await prisma.financialHealth.findUnique({
      where: {
        userId_month_year: {
          userId: currentUser.userId,
          month: monthNum,
          year: yearNum,
        },
      },
    });

    archivedSummaries.push({
      monthLabel,
      month: monthNum,
      year: yearNum,
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate: totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0,
      topCategories,
      healthScore: health ? health.score : (totalIncome > 0 ? 75 : 0),
    });
  }

  return NextResponse.json({ archivedSummaries });
}
