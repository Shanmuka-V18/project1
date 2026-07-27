import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const incomes = await prisma.income.findMany({
    where: { userId: currentUser.userId, date: { gte: startOfMonth, lte: endOfMonth } },
  });

  const expenses = await prisma.expense.findMany({
    where: { userId: currentUser.userId, date: { gte: startOfMonth, lte: endOfMonth } },
  });

  const totalIncome = incomes.reduce((acc, c) => acc + c.amount, 0);
  const totalExpense = expenses.reduce((acc, c) => acc + c.amount, 0);

  const recommendations = [
    {
      id: 'rec-1',
      title: 'Maximize Section 80C Tax Deduction',
      category: 'Tax Savings',
      impact: 'Save up to ₹46,800 in annual income tax',
      description: 'Consider investing in PPF, ELSS mutual funds, or National Pension System (NPS) before end of fiscal year to claim full ₹1.5 Lakh Section 80C tax deduction.',
      priority: 'High',
    },
    {
      id: 'rec-2',
      title: 'Optimize SaaS & Cloud Subscriptions',
      category: 'Expense Reduction',
      impact: 'Potential 15-20% monthly software savings',
      description: 'Software costs represent a significant expense block. Review recurring AWS, GitHub, and SaaS subscriptions for unused seats or annual payment discount options.',
      priority: 'Medium',
    },
    {
      id: 'rec-3',
      title: 'Build 3-Month Emergency Operating Reserve',
      category: 'Financial Health',
      impact: 'Protects business continuity',
      description: `Based on your monthly average expense of ₹${totalExpense.toLocaleString('en-IN')}, aim to keep at least ₹${(totalExpense * 3).toLocaleString('en-IN')} in high-yield liquid emergency savings.`,
      priority: 'High',
    },
    {
      id: 'rec-4',
      title: 'Prompt Invoice Payment Follow-ups',
      category: 'Cash Flow',
      impact: 'Accelerates accounts receivable',
      description: 'Send automated payment reminders 3 days before invoice due dates to maintain healthy cash conversion cycles.',
      priority: 'Medium',
    },
  ];

  return NextResponse.json({ recommendations });
}
