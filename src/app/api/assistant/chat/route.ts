import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateFinancialHealthScore } from '@/lib/utils';

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message, conversationHistory = [] } = await request.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Fetch user financial context
    const incomes = await prisma.income.findMany({
      where: { userId: currentUser.userId, date: { gte: startOfMonth, lte: endOfMonth } },
    });

    const expenses = await prisma.expense.findMany({
      where: { userId: currentUser.userId, date: { gte: startOfMonth, lte: endOfMonth } },
    });

    const totalIncome = incomes.reduce((acc, c) => acc + c.amount, 0);
    const totalExpense = expenses.reduce((acc, c) => acc + c.amount, 0);
    const netProfit = totalIncome - totalExpense;

    const budgets = await prisma.budget.findMany({
      where: { userId: currentUser.userId, month: now.getMonth() + 1, year: now.getFullYear() },
    });

    const expenseCategoryMap: Record<string, number> = {};
    expenses.forEach((e) => {
      expenseCategoryMap[e.category] = (expenseCategoryMap[e.category] || 0) + e.amount;
    });

    let exceededCount = 0;
    budgets.forEach((b) => {
      if ((expenseCategoryMap[b.category] || 0) >= b.monthlyLimit) exceededCount++;
    });

    const health = calculateFinancialHealthScore(totalIncome, totalExpense, budgets.length, exceededCount);

    const recentInvoices = await prisma.invoice.findMany({
      where: { userId: currentUser.userId },
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true, clientName: true, total: true, status: true },
    });

    const recentGst = await prisma.gSTHistory.findMany({
      where: { userId: currentUser.userId },
      take: 2,
      orderBy: { createdAt: 'desc' },
    });

    // Build context summary
    const contextSummary = `
USER FINANCIAL CONTEXT FOR CURRENT MONTH (${now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}):
- Total Monthly Income: ₹${totalIncome.toLocaleString('en-IN')} (Sources: ${incomes.map(i => i.source).join(', ') || 'None'})
- Total Monthly Expense: ₹${totalExpense.toLocaleString('en-IN')}
- Net Profit / Savings: ₹${netProfit.toLocaleString('en-IN')}
- Top Spending Categories: ${Object.entries(expenseCategoryMap).map(([cat, amt]) => `${cat}: ₹${amt}`).join('; ') || 'None'}
- Active Budgets: ${budgets.map(b => `${b.category}: limit ₹${b.monthlyLimit}, spent ₹${expenseCategoryMap[b.category] || 0}`).join('; ') || 'None'}
- Financial Health Score: ${health.score}/100 (${health.rating})
- Recent Invoices: ${recentInvoices.map(i => `${i.invoiceNumber} to ${i.clientName} (₹${i.total}, ${i.status})`).join('; ') || 'None'}
- Recent GST Calculations: ${recentGst.map(g => `₹${g.amount} at ${g.gstRate}% ${g.transactionType}`).join('; ') || 'None'}
`;

    const systemPrompt = `You are "FinAI Assistant & CA Advisor" — an intelligent, empathetic, and highly capable Indian Chartered Accountant (CA) & personal finance guide.
You have real-time access to the user's current month financial records.

User Financial Data Context:
${contextSummary}

Instructions:
1. Answer the user's query accurately using their financial context when asked about spending, budgets, health score, GST, affordances, or savings.
2. If asked "Can I afford X?", calculate their net savings and budget margin to give a reasoned answer.
3. If asked to calculate or explain GST, use clear Indian GST principles (Intra-State: CGST+SGST 50-50, Inter-State: IGST 100%).
4. Format your responses with markdown bolding, lists, and clear money formatting in INR (₹).
5. Be concise, professional, supportive, and actionable.`;

    const rawApiKey = (process.env.GEMINI_API_KEY || '').trim();

    // 1. If key is missing or unconfigured placeholder, return explicitly labeled offline demo response
    if (!rawApiKey || rawApiKey === 'your-google-gemini-api-key-here') {
      const lowerMsg = message.toLowerCase();
      let demoContent = '';

      if (lowerMsg.includes('spend') || lowerMsg.includes('expense') || lowerMsg.includes('highest')) {
        demoContent = `Based on your records for this month:\n\n- **Total Monthly Expenses:** ₹${totalExpense.toLocaleString('en-IN')}\n- **Top Categories:** ${
          Object.entries(expenseCategoryMap).map(([c, a]) => `\n  - **${c}:** ₹${a.toLocaleString('en-IN')}`).join('') || '\n  - No expenses logged yet.'
        }\n- **Net Savings:** ₹${netProfit.toLocaleString('en-IN')}`;
      } else if (lowerMsg.includes('afford')) {
        demoContent = `Your current net profit / savings for this month is **₹${netProfit.toLocaleString('en-IN')}** with a Financial Health Score of **${health.score}/100** (${health.rating}).\n\nIf the purchase fits within your remaining net profit margin of ₹${netProfit.toLocaleString('en-IN')}, you can comfortably afford it without drawing down emergency reserves.`;
      } else {
        demoContent = `Here is your financial snapshot for this month:\n- **Total Income:** ₹${totalIncome.toLocaleString('en-IN')}\n- **Total Expenses:** ₹${totalExpense.toLocaleString('en-IN')}\n- **Net Savings:** ₹${netProfit.toLocaleString('en-IN')}\n- **Financial Health Score:** ${health.score}/100 (${health.rating})`;
      }

      const replyText = `[Offline Demo Mode — Configure GEMINI_API_KEY in .env for Live AI]\n\n${demoContent}`;

      return NextResponse.json({ reply: replyText, isOffline: true });
    }

    // 2. Live Gemini API execution via official @google/generative-ai SDK with model fallback chain
    const genAI = new GoogleGenerativeAI(rawApiKey);
    const candidateModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'];
    let replyText = '';
    let lastError: any = null;

    const fullPrompt = `${systemPrompt}\n\nUser Question: ${message}`;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(fullPrompt);
        replyText = result.response.text();
        if (replyText) break;
      } catch (modelErr: any) {
        lastError = modelErr;
        console.warn(`[Gemini Model ${modelName} call failed, trying next candidate]:`, modelErr?.message || modelErr);
      }
    }

    if (!replyText) {
      console.error('[All Gemini Models Failed]:', lastError?.message || lastError);
      return NextResponse.json(
        {
          error: `Gemini API Call Failed: ${lastError?.message || 'Unable to connect to Google Generative Language API'}. Check server logs.`,
        },
        { status: 500 }
      );
    }

    // Save conversation to DB
    const updatedMessages = [
      ...conversationHistory,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: replyText, timestamp: new Date().toISOString() },
    ];

    try {
      await prisma.aIConversation.create({
        data: {
          userId: currentUser.userId,
          messages: JSON.stringify(updatedMessages),
        },
      });
    } catch (dbErr) {}

    return NextResponse.json({ reply: replyText, conversation: updatedMessages });
  } catch (error: any) {
    console.error('[AI Assistant Route Exception]:', error);
    return NextResponse.json({ error: error.message || 'AI Assistant request failed' }, { status: 500 });
  }
}
