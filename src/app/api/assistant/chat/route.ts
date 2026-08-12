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

    // Smart contextual response generator function
    const generateSmartFallback = (query: string): string => {
      const lowerMsg = query.toLowerCase();

      if (lowerMsg.includes('spend') || lowerMsg.includes('expense') || lowerMsg.includes('highest')) {
        return `Based on your records for this month:\n\n- **Total Monthly Expenses:** ₹${totalExpense.toLocaleString('en-IN')}\n- **Top Categories:** ${
          Object.entries(expenseCategoryMap).map(([c, a]) => `\n  - **${c}:** ₹${a.toLocaleString('en-IN')}`).join('') || '\n  - No expenses logged yet.'
        }\n- **Net Savings:** ₹${netProfit.toLocaleString('en-IN')}`;
      }
      
      if (lowerMsg.includes('afford')) {
        return `Your current net profit / savings for this month is **₹${netProfit.toLocaleString('en-IN')}** with a Financial Health Score of **${health.score}/100** (${health.rating}).\n\nIf the purchase fits within your remaining net profit margin of ₹${netProfit.toLocaleString('en-IN')}, you can comfortably afford it without drawing down emergency reserves.`;
      }
      
      if (lowerMsg.includes('gst') || lowerMsg.includes('tax')) {
        return `Here is a summary of Indian GST calculation principles:\n- **Intra-State (Within Same State):** Split 50-50 into **CGST** and **SGST**.\n- **Inter-State (Different State):** Full tax rate as **IGST**.\n\nRecent calculations logged in your account:\n${
          recentGst.map(g => `- ₹${g.amount.toLocaleString('en-IN')} at ${g.gstRate}% ${g.transactionType} -> Gross ₹${g.finalAmount.toLocaleString('en-IN')}`).join('\n') || '- No recent GST logs recorded.'
        }\n\nYou can use our dedicated GST Calculator tab for precise inclusive/exclusive calculations.`;
      }
      
      if (lowerMsg.includes('health') || lowerMsg.includes('score')) {
        return `Your Financial Health Score is **${health.score}/100 (${health.rating})**.\n\n**Contributing Factors:**\n- Savings Rate: ${health.factors.savingsRateScore}/25\n- Expense Ratio: ${health.factors.expenseRatioScore}/25\n- Budget Adherence: ${health.factors.budgetAdherenceScore}/25\n- Emergency Reserve: ${health.factors.emergencyFundScore}/15\n\n**Tip:** ${health.suggestions[0] || 'Keep up the good financial discipline!'}`;
      }

      if (lowerMsg.includes('tip') || lowerMsg.includes('advice') || lowerMsg.includes('save') || lowerMsg.includes('strategy')) {
        return `Here are 5 actionable financial & tax-saving strategies tailored for you:\n\n1. **Section 80C Deductions:** Utilize ELSS mutual funds, PPF, or EPF up to ₹1.5 Lakh per fiscal year.\n2. **Section 80D Health Insurance:** Claim tax deductions up to ₹25,000 for personal health insurance premiums.\n3. **Budget Monitoring:** Keep your monthly expense-to-income ratio below 70% (currently at ${totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0}%).\n4. **Timely Invoice Follow-ups:** You have active invoices totaling ₹${recentInvoices.reduce((a, i) => a + i.total, 0).toLocaleString('en-IN')}.\n5. **Emergency Reserve:** Build 3–6 months of living expenses in liquid high-yield savings.`;
      }

      return `Here is your current financial snapshot for this month (${now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}):\n- **Total Income:** ₹${totalIncome.toLocaleString('en-IN')}\n- **Total Expenses:** ₹${totalExpense.toLocaleString('en-IN')}\n- **Net Savings / Profit:** ₹${netProfit.toLocaleString('en-IN')}\n- **Financial Health Score:** ${health.score}/100 (${health.rating})\n\nHow else can I assist you with your taxes, budgets, or invoice planning today?`;
    };

    const rawApiKey = (process.env.GEMINI_API_KEY || '').trim();
    let replyText = '';

    // Check if key is valid Google Gemini key (starts with AIzaSy)
    if (!rawApiKey || rawApiKey === 'your-google-gemini-api-key-here' || !rawApiKey.startsWith('AIzaSy')) {
      replyText = generateSmartFallback(message);
    } else {
      try {
        const genAI = new GoogleGenerativeAI(rawApiKey);
        let model;
        try {
          model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        } catch {
          model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        }

        const fullPrompt = `${systemPrompt}\n\nUser Question: ${message}`;
        const result = await model.generateContent(fullPrompt);
        replyText = result.response.text();
      } catch (geminiErr: any) {
        console.warn('[Gemini API Call Exception, falling back to Context Engine]:', geminiErr?.message || geminiErr);
        replyText = generateSmartFallback(message);
      }
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
    } catch (dbErr) {
      // Ignore conversation history save error if table/schema constraint
    }

    return NextResponse.json({ reply: replyText, conversation: updatedMessages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'AI Assistant request failed' }, { status: 500 });
  }
}
