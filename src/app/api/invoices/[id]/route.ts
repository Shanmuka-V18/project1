import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

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

    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        status: body.status || existing.status,
        businessName: body.businessName || existing.businessName,
        pan: body.pan !== undefined ? body.pan : existing.pan,
        gstin: body.gstin !== undefined ? body.gstin : existing.gstin,
        clientName: body.clientName || existing.clientName,
        clientEmail: body.clientEmail || existing.clientEmail,
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
