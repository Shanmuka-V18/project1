import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculateFinancialHealthScore } from '@/lib/utils';
import { evaluateSpendingExceedsIncome, evaluateInvoiceDueAlert } from '@/lib/notifications';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const currentMonthNum = now.getMonth() + 1;
  const currentYearNum = now.getFullYear();

  // Prepare trend data promises for past 6 months
  const trendMonthRanges = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const monthName = d.toLocaleString('en-IN', { month: 'short' });
    trendMonthRanges.push({ monthName, mStart, mEnd });
  }

  // Execute all independent database queries concurrently via Promise.all
  const [
    currentMonthIncomes,
    currentMonthExpenses,
    activeInvoices,
    userBudgets,
    recentIncomes,
    recentExpenses,
    ...trendAggregations
  ] = await Promise.all([
    prisma.income.findMany({
      where: { userId: currentUser.userId, date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth } },
    }),
    prisma.expense.findMany({
      where: { userId: currentUser.userId, date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth } },
    }),
    prisma.invoice.findMany({
      where: { userId: currentUser.userId, status: { in: ['Sent', 'Draft'] } },
    }),
    prisma.budget.findMany({
      where: { userId: currentUser.userId, month: currentMonthNum, year: currentYearNum },
    }),
    prisma.income.findMany({
      where: { userId: currentUser.userId },
      orderBy: { date: 'desc' },
      take: 5,
    }),
    prisma.expense.findMany({
      where: { userId: currentUser.userId },
      orderBy: { date: 'desc' },
      take: 5,
    }),
    ...trendMonthRanges.flatMap(({ mStart, mEnd }) => [
      prisma.income.aggregate({
        where: { userId: currentUser.userId, date: { gte: mStart, lte: mEnd } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { userId: currentUser.userId, date: { gte: mStart, lte: mEnd } },
        _sum: { amount: true },
      }),
    ]),
  ]);

  const totalIncome = currentMonthIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalIncome - totalExpense;

  // Background notifications check (non-blocking)
  const spendingEval = evaluateSpendingExceedsIncome(totalIncome, totalExpense);
  if (spendingEval) {
    prisma.notification.findFirst({
      where: { userId: currentUser.userId, type: spendingEval.type, isRead: false },
    }).then((existing) => {
      if (!existing) {
        prisma.notification.create({
          data: {
            userId: currentUser.userId,
            type: spendingEval.type,
            message: spendingEval.message,
            isRead: false,
          },
        }).catch(console.error);
      }
    }).catch(console.error);
  }

  for (const inv of activeInvoices) {
    const invoiceEval = evaluateInvoiceDueAlert(inv.dueDate, inv.clientName, inv.invoiceNumber, inv.status);
    if (invoiceEval) {
      prisma.notification.findFirst({
        where: { userId: currentUser.userId, message: invoiceEval.message, isRead: false },
      }).then((existing) => {
        if (!existing) {
          prisma.notification.create({
            data: {
              userId: currentUser.userId,
              type: invoiceEval.type,
              message: invoiceEval.message,
              isRead: false,
            },
          }).catch(console.error);
        }
      }).catch(console.error);
    }
  }

  // Calculate expense per category
  const expenseByCategoryMap: Record<string, number> = {};
  currentMonthExpenses.forEach((exp) => {
    expenseByCategoryMap[exp.category] = (expenseByCategoryMap[exp.category] || 0) + exp.amount;
  });

  let exceededBudgetsCount = 0;
  userBudgets.forEach((b) => {
    const actualSpent = expenseByCategoryMap[b.category] || 0;
    if (actualSpent >= b.monthlyLimit) exceededBudgetsCount++;
  });

  // Calculate health score & fire non-blocking background upsert
  const healthResult = calculateFinancialHealthScore(
    totalIncome,
    totalExpense,
    userBudgets.length,
    exceededBudgetsCount
  );

  prisma.financialHealth.upsert({
    where: {
      userId_month_year: {
        userId: currentUser.userId,
        month: currentMonthNum,
        year: currentYearNum,
      },
    },
    update: {
      score: healthResult.score,
      breakdown: JSON.stringify(healthResult.factors),
    },
    create: {
      userId: currentUser.userId,
      score: healthResult.score,
      breakdown: JSON.stringify(healthResult.factors),
      month: currentMonthNum,
      year: currentYearNum,
    },
  }).catch(console.error);

  // Assemble trend data from parallel aggregations
  const trendData = [];
  for (let i = 0; i < trendMonthRanges.length; i++) {
    const { monthName } = trendMonthRanges[i];
    const mIncomes = trendAggregations[i * 2] as any;
    const mExpenses = trendAggregations[i * 2 + 1] as any;

    const incomeVal = mIncomes?._sum?.amount || 0;
    const expenseVal = mExpenses?._sum?.amount || 0;

    trendData.push({
      month: monthName,
      income: incomeVal,
      expense: expenseVal,
      profit: incomeVal - expenseVal,
    });
  }

  // Category breakdown
  const categoryBreakdown = Object.entries(expenseByCategoryMap).map(([category, amount]) => ({
    name: category,
    value: amount,
  }));

  // Recent transactions
  const mappedIncomes = recentIncomes.map((i) => ({ ...i, type: 'Income' as const }));
  const mappedExpenses = recentExpenses.map((e) => ({ ...e, type: 'Expense' as const }));
  const recentTransactions = [...mappedIncomes, ...mappedExpenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  // AI Insight text
  let insightText = '';
  if (totalIncome === 0) {
    insightText = 'Welcome! Start by adding your income sources and monthly expenses to generate AI insights.';
  } else {
    const savingsPercent = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);
    if (savingsPercent > 30) {
      insightText = `Outstanding performance! You saved ${savingsPercent}% of your income this month with a Health Score of ${healthResult.score}/100.`;
    } else if (savingsPercent > 0) {
      insightText = `Good balance! Savings rate is ${savingsPercent}%. Consider reviewing high expense categories to improve your health score.`;
    } else {
      insightText = `Warning: Expenses exceed income by ₹${Math.abs(netProfit).toLocaleString('en-IN')}. Focus on essential budgets to prevent cash flow strain.`;
    }
  }

  return NextResponse.json({
    summary: {
      totalIncome,
      totalExpense,
      netProfit,
      healthScore: healthResult.score,
      healthRating: healthResult.rating,
    },
    trendData,
    categoryBreakdown,
    recentTransactions,
    aiInsight: insightText,
  });
}
