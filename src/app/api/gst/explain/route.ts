import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { amount, gstRate, transactionType, cgst, sgst, igst, finalAmount, isInclusive } = await request.json();

    const rawApiKey = (process.env.GEMINI_API_KEY || '').trim();

    if (!rawApiKey || rawApiKey === 'your-google-gemini-api-key-here') {
      const explanation = isInclusive
        ? `[Offline Demo Mode]\nGST Inclusive calculation extracted ₹${(cgst + sgst).toLocaleString('en-IN')} tax from the ₹${finalAmount.toLocaleString('en-IN')} gross amount. CGST is ₹${cgst.toLocaleString('en-IN')} and SGST is ₹${sgst.toLocaleString('en-IN')}. Net base amount before tax is ₹${amount.toLocaleString('en-IN')}.`
        : `[Offline Demo Mode]\nThis is an ${transactionType} transaction for ₹${amount.toLocaleString('en-IN')} at ${gstRate}% GST. Total tax is ₹${(cgst + sgst + igst).toLocaleString('en-IN')}. Final gross total payable is ₹${finalAmount.toLocaleString('en-IN')}.`;
      return NextResponse.json({ explanation });
    }

    try {
      const genAI = new GoogleGenerativeAI(rawApiKey);
      let model;
      try {
        model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      } catch {
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      }

      const prompt = `You are an expert Indian Chartered Accountant (CA) AI assistant. Explain the following GST calculation in clear, friendly, plain English for a non-accountant business owner:
- Base Taxable Amount: ₹${amount}
- GST Rate: ${gstRate}%
- Transaction Type: ${transactionType}
- Tax Mode: ${isInclusive ? 'GST Inclusive' : 'GST Exclusive'}
- CGST: ₹${cgst}
- SGST: ₹${sgst}
- IGST: ₹${igst}
- Final Amount: ₹${finalAmount}

Keep your explanation concise (max 3 bullet points or short paragraphs), clear, and professional.`;

      const result = await model.generateContent(prompt);
      const explanation = result.response.text();

      return NextResponse.json({ explanation });
    } catch (apiError: any) {
      console.error('[GST Explain Gemini API Error]:', apiError?.message || apiError);
      return NextResponse.json(
        { error: `GST AI Advisor Error: ${apiError?.message || 'Gemini API call failed'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[GST Explain Route Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to explain GST calculation' }, { status: 500 });
  }
}
