import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculatePnLData, getPeriodDateRanges } from '@/lib/pnl-utils';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'this-month';
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const { startDate, endDate, prevStartDate, prevEndDate, periodLabel, comparisonLabel } = getPeriodDateRanges(period, new Date(), from, to);

  // Parallelize current and previous period queries
  const [incomes, expenses, prevIncomes, prevExpenses] = await Promise.all([
    prisma.income.findMany({
      where: { userId: currentUser.userId, date: { gte: startDate, lte: endDate } },
    }),
    prisma.expense.findMany({
      where: { userId: currentUser.userId, date: { gte: startDate, lte: endDate } },
    }),
    prevStartDate && prevEndDate
      ? prisma.income.findMany({
          where: { userId: currentUser.userId, date: { gte: prevStartDate, lte: prevEndDate } },
        })
      : Promise.resolve([]),
    prevStartDate && prevEndDate
      ? prisma.expense.findMany({
          where: { userId: currentUser.userId, date: { gte: prevStartDate, lte: prevEndDate } },
        })
      : Promise.resolve([]),
  ]);

  const result = calculatePnLData(incomes, expenses, prevIncomes, prevExpenses, {
    periodLabel,
    comparisonLabel,
  });

  return NextResponse.json({
    period,
    ...result,
  });
}
