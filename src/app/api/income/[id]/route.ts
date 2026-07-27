import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateIncomeSchema = z.object({
  amount: z.number().positive().optional(),
  source: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  date: z.string().or(z.date()).optional(),
  paymentMethod: z.enum(['Cash', 'UPI', 'Bank', 'Card']).optional(),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
  isRecurring: z.boolean().optional(),
});

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = updateIncomeSchema.parse(body);

    const existing = await prisma.income.findFirst({
      where: { id: params.id, userId: currentUser.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Income entry not found' }, { status: 404 });
    }

    const updated = await prisma.income.update({
      where: { id: params.id },
      data: {
        ...validated,
        date: validated.date ? new Date(validated.date) : undefined,
      },
    });

    return NextResponse.json({ income: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const existing = await prisma.income.findFirst({
    where: { id: params.id, userId: currentUser.userId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Income entry not found' }, { status: 404 });
  }

  await prisma.income.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ message: 'Income deleted successfully' });
}
