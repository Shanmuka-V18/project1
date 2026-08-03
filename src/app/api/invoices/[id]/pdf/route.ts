import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculateBalanceDue } from '@/lib/invoice-utils';

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

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const primaryColor = rgb(0.05, 0.58, 0.53); // Teal
  const darkColor = rgb(0.06, 0.09, 0.16); // Navy
  const grayColor = rgb(0.4, 0.45, 0.55);

  let y = 750;

  // Header Title
  page.drawText(invoice.businessName.toUpperCase(), {
    x: 40,
    y,
    size: 20,
    font: fontBold,
    color: darkColor,
  });

  page.drawText('TAX INVOICE', {
    x: 450,
    y,
    size: 18,
    font: fontBold,
    color: primaryColor,
  });

  y -= 25;
  if (invoice.gstin) {
    page.drawText(`GSTIN: ${invoice.gstin}`, { x: 40, y, size: 10, font, color: grayColor });
  }
  if (invoice.pan) {
    page.drawText(`PAN: ${invoice.pan}`, { x: 200, y, size: 10, font, color: grayColor });
  }
  page.drawText(`Invoice #: ${invoice.invoiceNumber}`, { x: 450, y, size: 10, font: fontBold, color: darkColor });

  y -= 15;
  page.drawText(`Date: ${formatDate(invoice.createdAt)}`, { x: 450, y, size: 10, font, color: grayColor });
  y -= 15;
  page.drawText(`Due Date: ${formatDate(invoice.dueDate)}`, { x: 450, y, size: 10, font, color: grayColor });
  y -= 15;
  page.drawText(`Status: ${invoice.status.toUpperCase()}`, { x: 450, y, size: 10, font: fontBold, color: primaryColor });
  y -= 15;
  page.drawText(`Payment Mode: ${invoice.paymentMode || 'Bank Transfer'}`, { x: 450, y, size: 10, font, color: darkColor });

  y -= 20;
  // Billed To Box
  page.drawText('BILLED TO:', { x: 40, y, size: 11, font: fontBold, color: darkColor });
  y -= 15;
  page.drawText(invoice.clientName, { x: 40, y, size: 12, font: fontBold, color: primaryColor });
  y -= 15;
  page.drawText(`Email: ${invoice.clientEmail}`, { x: 40, y, size: 10, font, color: grayColor });
  if (invoice.clientPhone) {
    y -= 15;
    page.drawText(`Phone: ${invoice.clientPhone}`, { x: 40, y, size: 10, font, color: grayColor });
  }

  y -= 35;
  // Line Items Table Header
  page.drawRectangle({
    x: 40,
    y: y - 5,
    width: 520,
    height: 25,
    color: rgb(0.94, 0.96, 0.98),
  });

  page.drawText('Description', { x: 50, y, size: 10, font: fontBold, color: darkColor });
  page.drawText('Qty', { x: 330, y, size: 10, font: fontBold, color: darkColor });
  page.drawText('Unit Price', { x: 400, y, size: 10, font: fontBold, color: darkColor });
  page.drawText('Amount', { x: 490, y, size: 10, font: fontBold, color: darkColor });

  y -= 25;
  const items = JSON.parse(invoice.items || '[]');
  items.forEach((item: any) => {
    page.drawText(String(item.description).slice(0, 45), { x: 50, y, size: 10, font, color: darkColor });
    page.drawText(String(item.quantity), { x: 335, y, size: 10, font, color: darkColor });
    page.drawText(formatCurrency(item.unitPrice), { x: 400, y, size: 10, font, color: darkColor });
    page.drawText(formatCurrency(item.amount), { x: 490, y, size: 10, font, color: darkColor });
    y -= 20;
  });

  y -= 15;
  page.drawLine({ start: { x: 40, y }, end: { x: 560, y }, thickness: 1, color: rgb(0.85, 0.88, 0.92) });

  y -= 25;
  // Summary
  page.drawText('Subtotal:', { x: 380, y, size: 10, font, color: grayColor });
  page.drawText(formatCurrency(invoice.subtotal), { x: 480, y, size: 10, font, color: darkColor });

  y -= 18;
  page.drawText('GST Amount:', { x: 380, y, size: 10, font, color: grayColor });
  page.drawText(formatCurrency(invoice.gstAmount), { x: 480, y, size: 10, font, color: darkColor });

  if (invoice.discount > 0) {
    y -= 18;
    page.drawText('Discount:', { x: 380, y, size: 10, font, color: grayColor });
    page.drawText(`-${formatCurrency(invoice.discount)}`, { x: 480, y, size: 10, font, color: darkColor });
  }

  y -= 18;
  page.drawText('Total Amount:', { x: 380, y, size: 10, font: fontBold, color: darkColor });
  page.drawText(formatCurrency(invoice.total), { x: 480, y, size: 10, font: fontBold, color: darkColor });

  if ((invoice.amountPaid || 0) > 0) {
    y -= 18;
    page.drawText('Amount Paid:', { x: 380, y, size: 10, font, color: rgb(0.06, 0.6, 0.3) });
    page.drawText(formatCurrency(invoice.amountPaid), { x: 480, y, size: 10, font: fontBold, color: rgb(0.06, 0.6, 0.3) });
  }

  const balanceDue = calculateBalanceDue(invoice.total, invoice.amountPaid || 0);

  y -= 25;
  page.drawRectangle({
    x: 360,
    y: y - 5,
    width: 200,
    height: 30,
    color: balanceDue === 0 ? rgb(0.9, 0.97, 0.96) : rgb(0.99, 0.95, 0.9),
  });

  page.drawText('BALANCE DUE:', { x: 370, y: y + 5, size: 11, font: fontBold, color: primaryColor });
  page.drawText(formatCurrency(balanceDue), { x: 480, y: y + 5, size: 12, font: fontBold, color: primaryColor });

  y -= 60;
  page.drawText('Thank you for your business!', { x: 220, y, size: 10, font, color: grayColor });

  const pdfBytes = await pdfDoc.save();

  return new Response(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    },
  });
}
