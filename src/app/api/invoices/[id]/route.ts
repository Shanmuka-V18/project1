import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { validatePhoneNumber, INVOICE_STATUSES, PAYMENT_MODES } from '@/lib/invoice-utils';

const updateInvoiceItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
});

const updateInvoiceSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').optional(),
  pan: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
  clientName: z.string().min(1, 'Client name is required').optional(),
  clientEmail: z.string().email('Valid client email is required').optional(),
  clientPhone: z.string().optional().nullable(),
  paymentMode: z.enum(PAYMENT_MODES, { errorMap: () => ({ message: 'Invalid payment mode' }) }).optional(),
  items: z.array(updateInvoiceItemSchema).min(1, 'At least one item is required').optional(),
  gstRate: z.number().nonnegative('GST rate cannot be negative').optional(),
  discount: z.number().nonnegative('Discount cannot be negative').optional(),
  amountPaid: z.number().nonnegative('Amount paid cannot be negative').optional(),
  dueDate: z.string().or(z.date()).optional(),
  status: z.enum(INVOICE_STATUSES, { errorMap: () => ({ message: 'Invalid invoice status' }) }).optional(),
});

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, userId: currentUser.userId },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  return NextResponse.json({ invoice });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = updateInvoiceSchema.parse(body);

    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, userId: currentUser.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (validated.clientPhone) {
      const phoneVal = validatePhoneNumber(validated.clientPhone);
      if (!phoneVal.isValid) {
        return NextResponse.json({ error: phoneVal.error }, { status: 400 });
      }
    }

    let itemsJson = existing.items;
    let subtotal = existing.subtotal;
    let gstAmount = existing.gstAmount;
    let total = existing.total;

    const discount = validated.discount !== undefined ? validated.discount : existing.discount;

    if (validated.items && Array.isArray(validated.items)) {
      subtotal = 0;
      const itemsWithAmounts = validated.items.map((item) => {
        const amt = item.quantity * item.unitPrice;
        subtotal += amt;
        return { ...item, amount: amt };
      });
      itemsJson = JSON.stringify(itemsWithAmounts);
      const rate = validated.gstRate !== undefined ? validated.gstRate : 18;
      gstAmount = (subtotal * rate) / 100;
      total = Math.max(0, subtotal + gstAmount - discount);
    }

    const newAmountPaid = validated.amountPaid !== undefined ? validated.amountPaid : existing.amountPaid;
    let finalStatus = validated.status || existing.status;

    if (validated.amountPaid !== undefined && !validated.status) {
      if (newAmountPaid >= total && total > 0) {
        finalStatus = 'Paid';
      } else if (newAmountPaid > 0 && newAmountPaid < total) {
        finalStatus = 'Partially Paid';
      }
    }

    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        businessName: validated.businessName || existing.businessName,
        pan: validated.pan !== undefined ? validated.pan : existing.pan,
        gstin: validated.gstin !== undefined ? validated.gstin : existing.gstin,
        clientName: validated.clientName || existing.clientName,
        clientEmail: validated.clientEmail || existing.clientEmail,
        clientPhone: validated.clientPhone !== undefined ? validated.clientPhone : existing.clientPhone,
        paymentMode: validated.paymentMode || existing.paymentMode,
        items: itemsJson,
        subtotal,
        gstAmount,
        discount,
        total,
        amountPaid: newAmountPaid,
        status: finalStatus,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : existing.dueDate,
      },
    });

    return NextResponse.json({ invoice: updated });
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

  const existing = await prisma.invoice.findFirst({
    where: { id: params.id, userId: currentUser.userId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  await prisma.invoice.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ message: 'Invoice deleted successfully' });
}
