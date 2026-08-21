import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculatePnLData, getPeriodDateRanges } from '@/lib/pnl-utils';

const ALLOWED_PERIODS = ['this-month', 'prev-month', 'full-year', 'all-time', 'custom'];

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'this-month';
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!ALLOWED_PERIODS.includes(period)) {
    return NextResponse.json(
      { error: `Invalid period parameter '${period}'. Allowed values: ${ALLOWED_PERIODS.join(', ')}` },
      { status: 400 }
    );
  }

  if (period === 'custom') {
    if (!from || !to) {
      return NextResponse.json({ error: 'Custom period requires both "from" and "to" date parameters' }, { status: 400 });
    }
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json({ error: 'Invalid custom date range parameters' }, { status: 400 });
    }
    if (toDate < fromDate) {
      return NextResponse.json({ error: 'To Date cannot be before From Date' }, { status: 400 });
    }
  }

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
