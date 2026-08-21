import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { items } = await request.json(); // Array of parsed CSV items
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided for import' }, { status: 400 });
    }

    const createdExpenses = [];
    for (const item of items) {
      const amount = parseFloat(item.amount);
      if (isNaN(amount) || amount <= 0) continue;

      const category = item.category || 'Misc';
      const paymentMethod = ['Cash', 'UPI', 'Bank', 'Card'].includes(item.paymentMethod)
        ? item.paymentMethod
        : 'Bank';

      let parsedDate = item.date ? new Date(item.date) : new Date();
      if (isNaN(parsedDate.getTime())) {
        parsedDate = new Date(); // Fallback to current date for invalid dates in bulk import
      }

      const created = await prisma.expense.create({
        data: {
          userId: currentUser.userId,
          amount,
          category,
          subcategory: item.subcategory || null,
          vendor: item.vendor || null,
          date: parsedDate,
          paymentMethod,
          notes: item.notes || 'CSV Bulk Import',
        },
      });
      createdExpenses.push(created);
    }

    return NextResponse.json({
      message: `Successfully imported ${createdExpenses.length} expense entries`,
      importedCount: createdExpenses.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'CSV Import failed. Please check file format.' }, { status: 400 });
  }
}
