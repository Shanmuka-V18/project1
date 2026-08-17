import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculatePnLData, getPeriodDateRanges } from '@/lib/pnl-utils';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'this-month';

  const { startDate, endDate, prevStartDate, prevEndDate, periodLabel, comparisonLabel } = getPeriodDateRanges(period);

  const incomes = await prisma.income.findMany({
    where: { userId: currentUser.userId, date: { gte: startDate, lte: endDate } },
  });

  const expenses = await prisma.expense.findMany({
    where: { userId: currentUser.userId, date: { gte: startDate, lte: endDate } },
  });

  let prevIncomes: any[] = [];
  let prevExpenses: any[] = [];

  if (prevStartDate && prevEndDate) {
    prevIncomes = await prisma.income.findMany({
      where: { userId: currentUser.userId, date: { gte: prevStartDate, lte: prevEndDate } },
    });

    prevExpenses = await prisma.expense.findMany({
      where: { userId: currentUser.userId, date: { gte: prevStartDate, lte: prevEndDate } },
    });
  }

  const result = calculatePnLData(incomes, expenses, prevIncomes, prevExpenses, {
    periodLabel,
    comparisonLabel,
  });

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const primaryColor = rgb(0.05, 0.58, 0.53); // Teal
  const darkColor = rgb(0.06, 0.09, 0.16); // Navy
  const grayColor = rgb(0.4, 0.45, 0.55);

  let y = 750;

  // Header Title
  page.drawText('PROFIT & LOSS STATEMENT', { x: 40, y, size: 18, font: fontBold, color: primaryColor });
  y -= 20;
  page.drawText(`Period: ${periodLabel.toUpperCase()} (${formatDate(startDate)} to ${formatDate(endDate)})`, {
    x: 40,
    y,
    size: 10,
    font,
    color: grayColor,
  });

  y -= 35;
  // Summary Box
  page.drawRectangle({ x: 40, y: y - 55, width: 520, height: 65, color: rgb(0.95, 0.97, 0.98) });

  page.drawText('Gross Operating Revenue:', { x: 55, y, size: 10, font: fontBold, color: darkColor });
  page.drawText(formatCurrency(result.currentMonth.revenue), { x: 200, y, size: 10, font: fontBold, color: rgb(0.02, 0.6, 0.4) });

  page.drawText('Total Operating Expenses:', { x: 320, y, size: 10, font: fontBold, color: darkColor });
  page.drawText(formatCurrency(result.currentMonth.expenses), { x: 460, y, size: 10, font: fontBold, color: rgb(0.85, 0.15, 0.15) });

  y -= 25;
  page.drawText('Net Operating Income (EBITDA):', { x: 55, y, size: 11, font: fontBold, color: primaryColor });
  page.drawText(formatCurrency(result.currentMonth.netIncome), { x: 230, y, size: 11, font: fontBold, color: primaryColor });

  page.drawText('Profit Margin:', { x: 320, y, size: 10, font: fontBold, color: darkColor });
  page.drawText(`${result.currentMonth.profitMargin}%`, { x: 460, y, size: 10, font: fontBold, color: darkColor });

  y -= 45;
  // Revenue Breakdown Table
  page.drawText('REVENUE BREAKDOWN', { x: 40, y, size: 12, font: fontBold, color: darkColor });
  y -= 18;

  const incomeCats = Object.entries(result.breakdown.incomeCategories);
  if (incomeCats.length === 0) {
    page.drawText('No revenue entries for this period', { x: 50, y, size: 10, font, color: grayColor });
    y -= 18;
  } else {
    incomeCats.forEach(([cat, val]) => {
      page.drawText(cat, { x: 50, y, size: 10, font, color: darkColor });
      page.drawText(formatCurrency(val), { x: 480, y, size: 10, font, color: darkColor });
      y -= 18;
    });
  }

  y -= 15;
  // Expense Breakdown Table
  page.drawText('EXPENSE BREAKDOWN', { x: 40, y, size: 12, font: fontBold, color: darkColor });
  y -= 18;

  const expenseCats = Object.entries(result.breakdown.expenseCategories);
  if (expenseCats.length === 0) {
    page.drawText('No expense entries for this period', { x: 50, y, size: 10, font, color: grayColor });
    y -= 18;
  } else {
    expenseCats.forEach(([cat, val]) => {
      page.drawText(cat, { x: 50, y, size: 10, font, color: darkColor });
      page.drawText(`-${formatCurrency(val)}`, { x: 480, y, size: 10, font, color: darkColor });
      y -= 18;
    });
  }

  const pdfBytes = await pdfDoc.save();

  return new Response(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="PnL-Statement-${period}.pdf"`,
    },
  });
}
