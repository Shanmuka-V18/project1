import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { amount, gstRate, transactionType, cgst, sgst, igst, finalAmount } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-google-gemini-api-key-here') {
      // Fallback offline plain language explanation if key is placeholder
      const explanation = transactionType === 'Intra-State'
        ? `This is an Intra-State transaction (within the same state) for ₹${amount.toLocaleString('en-IN')} at ${gstRate}% GST. Total tax is divided equally into 50% CGST (Central GST = ₹${cgst.toLocaleString('en-IN')}) and 50% SGST (State GST = ₹${sgst.toLocaleString('en-IN')}). IGST is ₹0. The final total invoice amount payable is ₹${finalAmount.toLocaleString('en-IN')}.`
        : `This is an Inter-State transaction (between two different states) for ₹${amount.toLocaleString('en-IN')} at ${gstRate}% GST. The entire tax is collected as Integrated GST (IGST = ₹${igst.toLocaleString('en-IN')}). CGST and SGST are ₹0. The final total invoice amount payable is ₹${finalAmount.toLocaleString('en-IN')}.`;
      return NextResponse.json({ explanation });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an expert Indian Chartered Accountant (CA) AI assistant. Explain the following GST calculation in clear, friendly, plain English for a non-accountant business owner:
- Base Taxable Amount: ₹${amount}
- GST Rate: ${gstRate}%
- Transaction Type: ${transactionType}
- CGST: ₹${cgst}
- SGST: ₹${sgst}
- IGST: ₹${igst}
- Final Amount: ₹${finalAmount}

Keep your explanation concise (max 4 bullet points or short paragraphs), clear, and professional.`;

    const result = await model.generateContent(prompt);
    const explanation = result.response.text();

    return NextResponse.json({ explanation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to explain GST calculation' }, { status: 500 });
  }
}
