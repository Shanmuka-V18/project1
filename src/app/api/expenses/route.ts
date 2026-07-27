import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { evaluateBudgetThresholds, evaluateSpendingExceedsIncome } from '@/lib/notifications';

const expenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  vendor: z.string().optional(),
  date: z.string().or(z.date()),
  paymentMethod: z.enum(['Cash', 'UPI', 'Bank', 'Card']),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
  isRecurring: z.boolean().default(false),
});

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const paymentMethod = searchParams.get('paymentMethod');
  const search = searchParams.get('search');

  const where: any = { userId: currentUser.userId };
  if (category && category !== 'All') where.category = category;
  if (paymentMethod && paymentMethod !== 'All') where.paymentMethod = paymentMethod;
  if (search) {
    where.OR = [
      { category: { contains: search } },
      { subcategory: { contains: search } },
      { vendor: { contains: search } },
      { notes: { contains: search } },
    ];
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: 'desc' },
  });

  return NextResponse.json({ expenses });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = expenseSchema.parse(body);

    const newExpense = await prisma.expense.create({
      data: {
        userId: currentUser.userId,
        amount: validated.amount,
        category: validated.category,
        subcategory: validated.subcategory || null,
        vendor: validated.vendor || null,
        date: new Date(validated.date),
        paymentMethod: validated.paymentMethod,
        notes: validated.notes || null,
        receiptUrl: validated.receiptUrl || null,
        isRecurring: validated.isRecurring,
      },
    });

    const now = new Date(validated.date);
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    // 1. Evaluate Budget Notifications
    const budget = await prisma.budget.findUnique({
      where: {
        userId_category_month_year: {
          userId: currentUser.userId,
          category: validated.category,
          month,
          year,
        },
      },
    });

    if (budget) {
      const categoryExpenses = await prisma.expense.aggregate({
        where: {
          userId: currentUser.userId,
          category: validated.category,
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      });

      const totalSpent = categoryExpenses._sum.amount || 0;
      const evalResult = evaluateBudgetThresholds(totalSpent, budget.monthlyLimit, validated.category);
      if (evalResult) {
        // Prevent duplicate unread alert for same category trigger
        const existingNotif = await prisma.notification.findFirst({
          where: {
            userId: currentUser.userId,
            type: evalResult.type,
            message: evalResult.message,
            isRead: false,
          },
        });
        if (!existingNotif) {
          await prisma.notification.create({
            data: {
              userId: currentUser.userId,
              type: evalResult.type,
              message: evalResult.message,
              isRead: false,
            },
          });
        }
      }
    }

    // 2. Evaluate Spending Exceeds Income Notification
    const monthIncomes = await prisma.income.aggregate({
      where: { userId: currentUser.userId, date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    });

    const monthExpenses = await prisma.expense.aggregate({
      where: { userId: currentUser.userId, date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    });

    const totalMonthIncome = monthIncomes._sum.amount || 0;
    const totalMonthExpense = monthExpenses._sum.amount || 0;

    const spendingEval = evaluateSpendingExceedsIncome(totalMonthIncome, totalMonthExpense);
    if (spendingEval) {
      const existingSpendingNotif = await prisma.notification.findFirst({
        where: {
          userId: currentUser.userId,
          type: spendingEval.type,
          isRead: false,
        },
      });
      if (!existingSpendingNotif) {
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

    return NextResponse.json({ expense: newExpense }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create expense' }, { status: 500 });
  }
}
