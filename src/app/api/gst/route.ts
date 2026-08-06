import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculateGST } from '@/lib/gst-utils';
import { z } from 'zod';

const gstSchema = z.object({
  amount: z.number().positive('Taxable amount must be greater than 0'),
  gstRate: z.number().refine((val) => [0, 5, 12, 18, 28].includes(val), 'Invalid GST rate'),
  transactionType: z.enum(['Intra-State', 'Inter-State']),
  isInclusive: z.boolean().default(false),
  // Optional precalculated fields from frontend
  cgst: z.number().optional(),
  sgst: z.number().optional(),
  igst: z.number().optional(),
  finalAmount: z.number().optional(),
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
  const currentUser = await currentUserCheck();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = gstSchema.parse(body);

    const calcResult = calculateGST({
      amount: validated.amount,
      gstRate: validated.gstRate,
      transactionType: validated.transactionType,
      isInclusive: validated.isInclusive,
    });

    const record = await prisma.gSTHistory.create({
      data: {
        userId: currentUser.userId,
        amount: validated.isInclusive ? calcResult.baseAmount : calcResult.amount,
        gstRate: calcResult.gstRate,
        transactionType: calcResult.transactionType,
        cgst: validated.cgst !== undefined ? validated.cgst : calcResult.cgst,
        sgst: validated.sgst !== undefined ? validated.sgst : calcResult.sgst,
        igst: validated.igst !== undefined ? validated.igst : calcResult.igst,
        finalAmount: validated.finalAmount !== undefined ? validated.finalAmount : calcResult.finalAmount,
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

async function currentUserCheck() {
  return await getCurrentUser();
}
