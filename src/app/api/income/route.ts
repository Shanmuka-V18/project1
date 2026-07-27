import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const incomeSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  source: z.string().min(1, 'Source is required'),
  category: z.string().min(1, 'Category is required'),
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
      { source: { contains: search } },
      { category: { contains: search } },
      { notes: { contains: search } },
    ];
  }

  const incomes = await prisma.income.findMany({
    where,
    orderBy: { date: 'desc' },
  });

  return NextResponse.json({ incomes });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = incomeSchema.parse(body);

    const newIncome = await prisma.income.create({
      data: {
        userId: currentUser.userId,
        amount: validated.amount,
        source: validated.source,
        category: validated.category,
        date: new Date(validated.date),
        paymentMethod: validated.paymentMethod,
        notes: validated.notes || null,
        receiptUrl: validated.receiptUrl || null,
        isRecurring: validated.isRecurring,
      },
    });

    return NextResponse.json({ income: newIncome }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create income' }, { status: 500 });
  }
}
