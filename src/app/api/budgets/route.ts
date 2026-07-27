import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { validateCustomCategory, getPredefinedCategories, BudgetType } from '@/lib/budget-utils';

const budgetSchema = z.object({
  budgetType: z.enum(['personal', 'business']).default('business'),
  category: z.string().min(1, 'Category is required'),
  monthlyLimit: z.number().positive('Monthly limit must be positive'),
  month: z.number().min(1).max(12).optional(),
  year: z.number().optional(),
});

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const month = parseInt(searchParams.get('month') || `${now.getMonth() + 1}`, 10);
  const year = parseInt(searchParams.get('year') || `${now.getFullYear()}`, 10);
  const budgetTypeParam = searchParams.get('budgetType');

  const where: any = { userId: currentUser.userId, month, year };
  if (budgetTypeParam && (budgetTypeParam === 'personal' || budgetTypeParam === 'business')) {
    where.budgetType = budgetTypeParam;
  }

  const budgets = await prisma.budget.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  // Collect all distinct custom category names created by this user
  const allUserBudgets = await prisma.budget.findMany({
    where: { userId: currentUser.userId },
    select: { category: true, budgetType: true },
  });

  const customCategoriesMap: Record<BudgetType, string[]> = {
    personal: [],
    business: [],
  };

  allUserBudgets.forEach((b) => {
    const type: BudgetType = (b.budgetType as BudgetType) || 'business';
    const predefined = getPredefinedCategories(type);
    if (!predefined.includes(b.category as any) && !customCategoriesMap[type].includes(b.category)) {
      customCategoriesMap[type].push(b.category);
    }
  });

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);

  const monthExpenses = await prisma.expense.findMany({
    where: {
      userId: currentUser.userId,
      date: { gte: monthStart, lte: monthEnd },
    },
  });

  const categorySpentMap: Record<string, number> = {};
  monthExpenses.forEach((exp) => {
    categorySpentMap[exp.category] = (categorySpentMap[exp.category] || 0) + exp.amount;
  });

  const budgetProgress = budgets.map((b) => {
    const actualSpent = categorySpentMap[b.category] || 0;
    const percentage = Math.round((actualSpent / b.monthlyLimit) * 100);
    let status: 'ok' | 'warning' | 'exceeded' = 'ok';
    if (percentage >= 100) status = 'exceeded';
    else if (percentage >= 80) status = 'warning';

    return {
      ...b,
      budgetType: b.budgetType || 'business',
      actualSpent,
      remaining: b.monthlyLimit - actualSpent,
      percentage,
      status,
    };
  });

  return NextResponse.json({
    budgets: budgetProgress,
    customCategories: customCategoriesMap,
    month,
    year,
  });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = budgetSchema.parse(body);

    const now = new Date();
    const month = validated.month || now.getMonth() + 1;
    const year = validated.year || now.getFullYear();

    // Check for duplicate categories within same budget type for user in month/year
    const existingSameMonthCategory = await prisma.budget.findFirst({
      where: {
        userId: currentUser.userId,
        category: validated.category,
        month,
        year,
      },
    });

    const budget = await prisma.budget.upsert({
      where: {
        userId_category_month_year: {
          userId: currentUser.userId,
          category: validated.category,
          month,
          year,
        },
      },
      update: {
        monthlyLimit: validated.monthlyLimit,
        budgetType: validated.budgetType,
      },
      create: {
        userId: currentUser.userId,
        budgetType: validated.budgetType,
        category: validated.category,
        monthlyLimit: validated.monthlyLimit,
        month,
        year,
      },
    });

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to save budget' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Budget ID required' }, { status: 400 });
  }

  await prisma.budget.delete({
    where: { id, userId: currentUser.userId },
  });

  return NextResponse.json({ message: 'Budget deleted' });
}
