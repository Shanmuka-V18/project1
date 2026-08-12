import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { callAIProvider } from '@/lib/ai-provider';

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { amount, gstRate, transactionType, cgst, sgst, igst, finalAmount, isInclusive } = await request.json();

    const getFallbackExplanation = () => {
      if (isInclusive) {
        return transactionType === 'Intra-State'
          ? `GST Inclusive calculation extracted ₹${(cgst + sgst).toLocaleString('en-IN')} tax from the ₹${finalAmount.toLocaleString('en-IN')} gross amount. CGST (50%) is ₹${cgst.toLocaleString('en-IN')} and SGST (50%) is ₹${sgst.toLocaleString('en-IN')}. Net base amount before tax is ₹${amount.toLocaleString('en-IN')}.`
          : `GST Inclusive calculation extracted ₹${igst.toLocaleString('en-IN')} IGST tax from the ₹${finalAmount.toLocaleString('en-IN')} gross amount. Net base amount before tax is ₹${amount.toLocaleString('en-IN')}.`;
      }
      return transactionType === 'Intra-State'
        ? `This is an Intra-State transaction (within the same state) for ₹${amount.toLocaleString('en-IN')} at ${gstRate}% GST. Total tax is divided equally into 50% CGST (₹${cgst.toLocaleString('en-IN')}) and 50% SGST (₹${sgst.toLocaleString('en-IN')}). Final gross total payable is ₹${finalAmount.toLocaleString('en-IN')}.`
        : `This is an Inter-State transaction (between two states) for ₹${amount.toLocaleString('en-IN')} at ${gstRate}% GST. The entire tax is collected as Integrated GST (IGST = ₹${igst.toLocaleString('en-IN')}). Final gross total payable is ₹${finalAmount.toLocaleString('en-IN')}.`;
    };

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

    const aiReply = await callAIProvider({ systemPrompt, userMessage: userPrompt });

    return NextResponse.json({ explanation: aiReply || getFallbackExplanation() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to explain GST calculation' }, { status: 500 });
  }
}
