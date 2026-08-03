import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { validatePhoneNumber } from '@/lib/invoice-utils';

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
    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, userId: currentUser.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (body.clientPhone) {
      const phoneVal = validatePhoneNumber(body.clientPhone);
      if (!phoneVal.isValid) {
        return NextResponse.json({ error: phoneVal.error }, { status: 400 });
      }
    }

    let itemsJson = existing.items;
    let subtotal = existing.subtotal;
    let gstAmount = existing.gstAmount;
    let total = existing.total;

    if (body.items && Array.isArray(body.items)) {
      subtotal = 0;
      const itemsWithAmounts = body.items.map((item: any) => {
        const amt = (item.quantity || 1) * (item.unitPrice || 0);
        subtotal += amt;
        return { ...item, amount: amt };
      });
      itemsJson = JSON.stringify(itemsWithAmounts);
      const rate = body.gstRate !== undefined ? body.gstRate : 18;
      gstAmount = (subtotal * rate) / 100;
      const disc = body.discount !== undefined ? body.discount : existing.discount;
      total = Math.max(0, subtotal + gstAmount - disc);
    }

    const newAmountPaid = body.amountPaid !== undefined ? parseFloat(body.amountPaid) : existing.amountPaid;
    let finalStatus = body.status || existing.status;

    if (body.amountPaid !== undefined && !body.status) {
      if (newAmountPaid >= total && total > 0) {
        finalStatus = 'Paid';
      } else if (newAmountPaid > 0 && newAmountPaid < total) {
        finalStatus = 'Partially Paid';
      }
    }

    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        businessName: body.businessName || existing.businessName,
        pan: body.pan !== undefined ? body.pan : existing.pan,
        gstin: body.gstin !== undefined ? body.gstin : existing.gstin,
        clientName: body.clientName || existing.clientName,
        clientEmail: body.clientEmail || existing.clientEmail,
        clientPhone: body.clientPhone !== undefined ? body.clientPhone : existing.clientPhone,
        paymentMode: body.paymentMode || existing.paymentMode,
        items: itemsJson,
        subtotal,
        gstAmount,
        discount: body.discount !== undefined ? body.discount : existing.discount,
        total,
        amountPaid: newAmountPaid,
        status: finalStatus,
        dueDate: body.dueDate ? new Date(body.dueDate) : existing.dueDate,
      },
    });

    return NextResponse.json({ invoice: updated });
  } catch (error: any) {
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
