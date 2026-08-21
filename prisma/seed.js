const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding financial database...');

  // 1. Create Demo User
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@financialassistant.ai' },
    update: {},
    create: {
      username: 'demouser',
      email: 'demo@financialassistant.ai',
      passwordHash,
      profilePictureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    },
  });

  console.log(`User created: ${user.email} (Password: password123)`);

  // Clear existing records for clean seed
  await prisma.income.deleteMany({ where: { userId: user.id } });
  await prisma.expense.deleteMany({ where: { userId: user.id } });
  await prisma.budget.deleteMany({ where: { userId: user.id } });
  await prisma.invoice.deleteMany({ where: { userId: user.id } });
  await prisma.gSTHistory.deleteMany({ where: { userId: user.id } });
  await prisma.financialHealth.deleteMany({ where: { userId: user.id } });
  await prisma.notification.deleteMany({ where: { userId: user.id } });
  await prisma.aIConversation.deleteMany({ where: { userId: user.id } });

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  // Helper date function for offset months
  const getDate = (day, monthOffset = 0) => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    d.setDate(day);
    return d;
  };

  // 2. Incomes
  const incomesData = [
    { amount: 185000, source: 'Acme Corp Consulting', category: 'Consulting', date: getDate(5, 0), paymentMethod: 'Bank', notes: 'Monthly retainer fee', isRecurring: true },
    { amount: 45000, source: 'Freelance UI/UX Project', category: 'Freelance', date: getDate(12, 0), paymentMethod: 'UPI', notes: 'E-commerce redesign milestone 1', isRecurring: false },
    { amount: 22000, source: 'Dividend Payout', category: 'Investments', date: getDate(18, 0), paymentMethod: 'Bank', notes: 'Quarterly equity dividend', isRecurring: false },
    { amount: 180000, source: 'Acme Corp Consulting', category: 'Consulting', date: getDate(5, -1), paymentMethod: 'Bank', notes: 'Previous month retainer', isRecurring: true },
    { amount: 35000, source: 'Digital Product Sales', category: 'Side Project', date: getDate(15, -1), paymentMethod: 'UPI', notes: 'SaaS template sales', isRecurring: true },
  ];

  for (const inc of incomesData) {
    await prisma.income.create({
      data: { ...inc, userId: user.id },
    });
  }

  // 3. Expenses
  const expensesData = [
    { amount: 45000, category: 'Rent', subcategory: 'Office Space', vendor: 'DLF Cybercity Properties', date: getDate(2, 0), paymentMethod: 'Bank', notes: 'Coworking dedicated office', isRecurring: true },
    { amount: 8500, category: 'Utilities', subcategory: 'Electricity & Internet', vendor: 'BSES & Airtel Fiber', date: getDate(4, 0), paymentMethod: 'UPI', notes: 'High speed internet + power', isRecurring: true },
    { amount: 55000, category: 'Salaries', subcategory: 'Contract Developer', vendor: 'Rohan Sharma', date: getDate(7, 0), paymentMethod: 'Bank', notes: 'Monthly dev stipend', isRecurring: true },
    { amount: 12400, category: 'Software', subcategory: 'SaaS Tools', vendor: 'AWS & GitHub & Vercel', date: getDate(10, 0), paymentMethod: 'Card', notes: 'Cloud infrastructure billing', isRecurring: true },
    { amount: 18500, category: 'Marketing', subcategory: 'Ad Campaigns', vendor: 'Meta Ads', date: getDate(14, 0), paymentMethod: 'Card', notes: 'Lead acquisition campaign', isRecurring: false },
    { amount: 6200, category: 'Travel', subcategory: 'Client Meetings', vendor: 'Uber Technologies', date: getDate(16, 0), paymentMethod: 'UPI', notes: 'Airport transfers & client visits', isRecurring: false },
    { amount: 9800, category: 'Misc', subcategory: 'Team Lunch', vendor: 'Chai Point & Swiggy', date: getDate(20, 0), paymentMethod: 'Cash', notes: 'Team milestone celebration', isRecurring: false },

    // Previous month expenses
    { amount: 45000, category: 'Rent', subcategory: 'Office Space', vendor: 'DLF Cybercity Properties', date: getDate(2, -1), paymentMethod: 'Bank', isRecurring: true },
    { amount: 7800, category: 'Utilities', subcategory: 'Electricity & Internet', vendor: 'BSES & Airtel Fiber', date: getDate(4, -1), paymentMethod: 'UPI', isRecurring: true },
    { amount: 55000, category: 'Salaries', subcategory: 'Contract Developer', vendor: 'Rohan Sharma', date: getDate(7, -1), paymentMethod: 'Bank', isRecurring: true },
    { amount: 11900, category: 'Software', subcategory: 'SaaS Tools', vendor: 'AWS & GitHub', date: getDate(10, -1), paymentMethod: 'Card', isRecurring: true },
  ];

  for (const exp of expensesData) {
    await prisma.expense.create({
      data: { ...exp, userId: user.id },
    });
  }

  // 4. Budgets
  const budgetsData = [
    { category: 'Rent', monthlyLimit: 50000, month: currentMonth, year: currentYear },
    { category: 'Utilities', monthlyLimit: 10000, month: currentMonth, year: currentYear },
    { category: 'Salaries', monthlyLimit: 60000, month: currentMonth, year: currentYear },
    { category: 'Software', monthlyLimit: 15000, month: currentMonth, year: currentYear },
    { category: 'Marketing', monthlyLimit: 20000, month: currentMonth, year: currentYear },
    { category: 'Travel', monthlyLimit: 10000, month: currentMonth, year: currentYear },
    { category: 'Misc', monthlyLimit: 8000, month: currentMonth, year: currentYear },
  ];

  for (const b of budgetsData) {
    await prisma.budget.create({
      data: { ...b, userId: user.id },
    });
  }

  // 5. Invoices
  const invoicesData = [
    {
      invoiceNumber: 'INV-2026-0001',
      businessName: 'Apex Innovations Studio',
      pan: 'ABCDE1234F',
      gstin: '07ABCDE1234F1Z5',
      clientName: 'Starlight Tech Solutions',
      clientEmail: 'billing@starlighttech.com',
      items: JSON.stringify([
        { description: 'Full Stack Web Platform Development', quantity: 1, unitPrice: 120000, amount: 120000 },
        { description: 'Cloud Infrastructure & Security Setup', quantity: 1, unitPrice: 30000, amount: 30000 },
      ]),
      subtotal: 150000,
      gstAmount: 27000, // 18%
      discount: 5000,
      total: 172000,
      status: 'Paid',
      dueDate: getDate(15, 0),
    },
    {
      invoiceNumber: 'INV-2026-0002',
      businessName: 'Apex Innovations Studio',
      pan: 'ABCDE1234F',
      gstin: '07ABCDE1234F1Z5',
      clientName: 'Nexus Global Enterprises',
      clientEmail: 'accounts@nexusglobal.io',
      items: JSON.stringify([
        { description: 'Financial Dashboard UI/UX Architecture', quantity: 1, unitPrice: 85000, amount: 85000 },
      ]),
      subtotal: 85000,
      gstAmount: 15300, // 18%
      discount: 0,
      total: 100300,
      status: 'Sent',
      dueDate: getDate(28, 0),
    },
    {
      invoiceNumber: 'INV-2026-0003',
      businessName: 'Apex Innovations Studio',
      pan: 'ABCDE1234F',
      gstin: '07ABCDE1234F1Z5',
      clientName: 'Vanguard Labs',
      clientEmail: 'finance@vanguardlabs.co',
      items: JSON.stringify([
        { description: 'AI Assistant Integration Consulting', quantity: 2, unitPrice: 25000, amount: 50000 },
      ]),
      subtotal: 50000,
      gstAmount: 9000,
      discount: 0,
      total: 59000,
      status: 'Draft',
      dueDate: getDate(5, 1),
    },
  ];

  for (const inv of invoicesData) {
    await prisma.invoice.create({
      data: { ...inv, userId: user.id },
    });
  }

  // 6. GST Calculation Log
  const gstLogs = [
    { amount: 150000, gstRate: 18, transactionType: 'Intra-State', cgst: 13500, sgst: 13500, igst: 0, finalAmount: 177000 },
    { amount: 85000, gstRate: 18, transactionType: 'Inter-State', cgst: 0, sgst: 0, igst: 15300, finalAmount: 100300 },
    { amount: 45000, gstRate: 12, transactionType: 'Intra-State', cgst: 2700, sgst: 2700, igst: 0, finalAmount: 50400 },
  ];

  for (const gst of gstLogs) {
    await prisma.gSTHistory.create({
      data: { ...gst, userId: user.id },
    });
  }

  // 7. Financial Health History
  await prisma.financialHealth.create({
    data: {
      userId: user.id,
      score: 82,
      breakdown: JSON.stringify({
        savingsRateScore: 22,
        expenseRatioScore: 23,
        budgetAdherenceScore: 22,
        emergencyFundScore: 15,
        incomeConsistencyScore: 10,
      }),
      month: currentMonth,
      year: currentYear,
    },
  });

  // 8. Notifications
  const notifications = [
    { type: 'Budget Reminder', message: 'You have reached 82% of your Misc expense budget for this month.', isRead: false },
    { type: 'Invoice Due', message: 'Invoice INV-2026-0002 for Nexus Global Enterprises is due on 28th.', isRead: false },
    { type: 'Monthly Report', message: 'Your monthly P&L summary for previous month is ready to review.', isRead: true },
    { type: 'Low Balance', message: 'Low Balance Warning: Cash reserve (₹42,000) is below 15% safety margin target.', isRead: true },
  ];

  for (const notif of notifications) {
    await prisma.notification.create({
      data: { ...notif, userId: user.id },
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
