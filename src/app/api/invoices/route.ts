import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { validatePhoneNumber, INVOICE_STATUSES, PAYMENT_MODES } from '@/lib/invoice-utils';

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
});

const invoiceSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  pan: z.string().optional(),
  gstin: z.string().optional(),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Valid client email is required'),
  clientPhone: z.string().optional().nullable(),
  paymentMode: z.enum(PAYMENT_MODES).default('Bank Transfer'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  gstRate: z.number().nonnegative().default(18),
  discount: z.number().nonnegative().default(0),
  amountPaid: z.number().nonnegative().default(0),
  dueDate: z.string().or(z.date()),
  status: z.enum(INVOICE_STATUSES).default('Draft'),
});

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const paymentMode = searchParams.get('paymentMode');

  const where: any = { userId: currentUser.userId };
  if (status && status !== 'All') where.status = status;
  if (paymentMode && paymentMode !== 'All') where.paymentMode = paymentMode;

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ invoices });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = invoiceSchema.parse(body);

    if (validated.clientPhone) {
      const phoneVal = validatePhoneNumber(validated.clientPhone);
      if (!phoneVal.isValid) {
        return NextResponse.json({ error: phoneVal.error }, { status: 400 });
      }
    }

    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({
      where: { userId: currentUser.userId },
    });
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;

    let subtotal = 0;
    const itemsWithAmounts = validated.items.map((item) => {
      const amount = item.quantity * item.unitPrice;
      subtotal += amount;
      return { ...item, amount };
    });

    const gstAmount = (subtotal * validated.gstRate) / 100;
    const total = Math.max(0, subtotal + gstAmount - validated.discount);

    // Auto align status if amountPaid matches criteria
    let finalStatus = validated.status;
    if (validated.amountPaid >= total && total > 0) {
      finalStatus = 'Paid';
    } else if (validated.amountPaid > 0 && validated.amountPaid < total) {
      finalStatus = 'Partially Paid';
    }

    const invoice = await prisma.invoice.create({
      data: {
        userId: currentUser.userId,
        invoiceNumber,
        businessName: validated.businessName,
        pan: validated.pan || null,
        gstin: validated.gstin || null,
        clientName: validated.clientName,
        clientEmail: validated.clientEmail,
        clientPhone: validated.clientPhone || null,
        paymentMode: validated.paymentMode,
        items: JSON.stringify(itemsWithAmounts),
        subtotal,
        gstAmount,
        discount: validated.discount,
        total,
        amountPaid: validated.amountPaid,
        status: finalStatus,
        dueDate: new Date(validated.dueDate),
      },
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create invoice' }, { status: 500 });
  }
}
