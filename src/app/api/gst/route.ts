import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculateGST } from '@/lib/utils';
import { z } from 'zod';

const gstSchema = z.object({
  amount: z.number().positive('Taxable amount must be greater than 0'),
  gstRate: z.number().refine((val) => [0, 5, 12, 18, 28].includes(val), 'Invalid GST rate'),
  transactionType: z.enum(['Intra-State', 'Inter-State']),
});

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const history = await prisma.gSTHistory.findMany({
    where: { userId: currentUser.userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ history });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = gstSchema.parse(body);

    const result = calculateGST(validated.amount, validated.gstRate, validated.transactionType);

    const record = await prisma.gSTHistory.create({
      data: {
        userId: currentUser.userId,
        amount: result.amount,
        gstRate: result.gstRate,
        transactionType: result.transactionType,
        cgst: result.cgst,
        sgst: result.sgst,
        igst: result.igst,
        finalAmount: result.finalAmount,
      },
    });

    return NextResponse.json({ result: record }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'GST calculation failed' }, { status: 500 });
  }
}
