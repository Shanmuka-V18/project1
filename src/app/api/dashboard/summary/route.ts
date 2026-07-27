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

  // 1. Current Month Incomes & Expenses
  const currentMonthIncomes = await prisma.income.findMany({
    where: {
      userId: currentUser.userId,
      date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
    },
  });

  const currentMonthExpenses = await prisma.expense.findMany({
    where: {
      userId: currentUser.userId,
      date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
    },
  });

  const totalIncome = currentMonthIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalIncome - totalExpense;

  // Audit Spending Exceeds Income Notification
  const spendingEval = evaluateSpendingExceedsIncome(totalIncome, totalExpense);
  if (spendingEval) {
    const existingNotif = await prisma.notification.findFirst({
      where: { userId: currentUser.userId, type: spendingEval.type, isRead: false },
    });
    if (!existingNotif) {
      await prisma.notification.create({
        data: {
          userId: currentUser.userId,
          type: spendingEval.type,
          message: spendingEval.message,
          isRead: false,
        },
      });
    }
  }

  // Audit Invoice Due Notifications
  const activeInvoices = await prisma.invoice.findMany({
    where: { userId: currentUser.userId, status: { in: ['Sent', 'Draft'] } },
  });

  for (const inv of activeInvoices) {
    const invoiceEval = evaluateInvoiceDueAlert(inv.dueDate, inv.clientName, inv.invoiceNumber, inv.status);
    if (invoiceEval) {
      const existingInvNotif = await prisma.notification.findFirst({
        where: { userId: currentUser.userId, message: invoiceEval.message, isRead: false },
      });
      if (!existingInvNotif) {
        await prisma.notification.create({
          data: {
            userId: currentUser.userId,
            type: invoiceEval.type,
            message: invoiceEval.message,
            isRead: false,
          },
        });
      }
    }
  }

  // 2. Budgets & Exceeded Budgets
  const currentMonthNum = now.getMonth() + 1;
  const currentYearNum = now.getFullYear();

  const userBudgets = await prisma.budget.findMany({
    where: { userId: currentUser.userId, month: currentMonthNum, year: currentYearNum },
  });

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

  // 3. Health Score
  const healthResult = calculateFinancialHealthScore(
    totalIncome,
    totalExpense,
    userBudgets.length,
    exceededBudgetsCount
  );

  // Upsert health record in DB
  await prisma.financialHealth.upsert({
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
  });

  // 4. Income vs Expense Trend (Last 6 Months)
  const trendData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const monthName = d.toLocaleString('en-IN', { month: 'short' });

    const mIncomes = await prisma.income.aggregate({
      where: { userId: currentUser.userId, date: { gte: mStart, lte: mEnd } },
      _sum: { amount: true },
    });

    const mExpenses = await prisma.expense.aggregate({
      where: { userId: currentUser.userId, date: { gte: mStart, lte: mEnd } },
      _sum: { amount: true },
    });

    trendData.push({
      month: monthName,
      income: mIncomes._sum.amount || 0,
      expense: mExpenses._sum.amount || 0,
      profit: (mIncomes._sum.amount || 0) - (mExpenses._sum.amount || 0),
    });
  }

  // 5. Category Breakdown Pie Chart
  const categoryBreakdown = Object.entries(expenseByCategoryMap).map(([category, amount]) => ({
    name: category,
    value: amount,
  }));

  // 6. Recent Transactions (latest 6 combined)
  const recentIncomes = (await prisma.income.findMany({
    where: { userId: currentUser.userId },
    orderBy: { date: 'desc' },
    take: 5,
  })).map(i => ({ ...i, type: 'Income' as const }));

  const recentExpenses = (await prisma.expense.findMany({
    where: { userId: currentUser.userId },
    orderBy: { date: 'desc' },
    take: 5,
  })).map(e => ({ ...e, type: 'Expense' as const }));

  const recentTransactions = [...recentIncomes, ...recentExpenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  // 7. Dynamic AI Insight Banner text
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
