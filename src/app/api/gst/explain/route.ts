import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { generateGeminiContent } from '@/lib/gemini-config';

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

    const systemPrompt = `You are an expert Indian Chartered Accountant (CA) AI assistant. Explain GST calculations in clear, friendly, plain English for a non-accountant business owner. Keep explanations concise (max 3-4 bullet points or short paragraphs).`;

    const userPrompt = `Explain this GST calculation:
- Base Taxable Amount: ₹${amount}
- GST Rate: ${gstRate}%
- Transaction Type: ${transactionType}
- Tax Mode: ${isInclusive ? 'GST Inclusive' : 'GST Exclusive'}
- CGST: ₹${cgst}
- SGST: ₹${sgst}
- IGST: ₹${igst}
- Final Amount: ₹${finalAmount}`;

    try {
      const explanation = await generateGeminiContent({
        systemInstruction: systemPrompt,
        prompt: userPrompt,
      });

      return NextResponse.json({ explanation });
    } catch (geminiErr: any) {
      console.error('[GST Explain Gemini Error]:', geminiErr?.message || geminiErr);
      return NextResponse.json(
        { error: "GST Advisor is temporarily unavailable — please try again in a moment." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[GST Explain Route Error]:', error);
    return NextResponse.json({ error: 'Failed to explain GST calculation' }, { status: 500 });
  }
}
