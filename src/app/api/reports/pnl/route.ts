import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'this-month';

  const now = new Date();
  let startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  let prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  let prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  if (period === 'last-month') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    prevEndDate = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);
  } else if (period === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

    prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
    prevEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
  }

  // Current Period Data
  const incomes = await prisma.income.findMany({
    where: { userId: currentUser.userId, date: { gte: startDate, lte: endDate } },
  });

  const expenses = await prisma.expense.findMany({
    where: { userId: currentUser.userId, date: { gte: startDate, lte: endDate } },
  });

  const totalRevenue = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalRevenue - totalExpense;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  // Group revenue by category/source
  const revenueByCategory: Record<string, number> = {};
  incomes.forEach((inc) => {
    revenueByCategory[inc.category] = (revenueByCategory[inc.category] || 0) + inc.amount;
  });

  // Group expense by category
  const expenseByCategory: Record<string, number> = {};
  expenses.forEach((exp) => {
    expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + exp.amount;
  });

  // Previous Period Data for Comparison
  const prevIncomes = await prisma.income.aggregate({
    where: { userId: currentUser.userId, date: { gte: prevStartDate, lte: prevEndDate } },
    _sum: { amount: true },
  });

  const prevExpenses = await prisma.expense.aggregate({
    where: { userId: currentUser.userId, date: { gte: prevStartDate, lte: prevEndDate } },
    _sum: { amount: true },
  });

  const prevRevenue = prevIncomes._sum.amount || 0;
  const prevExpense = prevExpenses._sum.amount || 0;
  const prevNetProfit = prevRevenue - prevExpense;

  const revenueGrowth = prevRevenue > 0 ? (((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : '100.0';
  const profitGrowth = prevNetProfit !== 0 ? (((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100).toFixed(1) : '100.0';

  return NextResponse.json({
    period,
    totalRevenue,
    totalExpense,
    netProfit,
    profitMargin,
    revenueByCategory: Object.entries(revenueByCategory).map(([category, amount]) => ({ category, amount })),
    expenseByCategory: Object.entries(expenseByCategory).map(([category, amount]) => ({ category, amount })),
    comparison: {
      prevRevenue,
      prevExpense,
      prevNetProfit,
      revenueGrowth,
      profitGrowth,
    },
  });
}
