# AI-Powered Financial & CA Assistant (project1)

An intelligent, full-stack personal finance and small business management web application built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **Google Gemini AI**.

---

## 🌟 Key Features

- **Authentication & Private Workspace**: JWT session auth with HTTP-only cookies and protected routes.
- **Financial Dashboard**: KPI cards, Recharts 6-month area trend chart, expense breakdown pie chart, and dynamic AI insights.
- **Income & Expense Tracker**: Track revenue streams and categorized spending, with recurring subscriptions support and **CSV Bulk Import**.
- **Monthly Budget Planner**: Category limits with real-time progress bars, color alerts (80% warning / 100% exceeded), and rollover options.
- **Invoice Generator**: Auto invoice numbering (`INV-YYYY-XXXX`), line items table, inline PAN/GSTIN details, status tracking, and **PDF Invoice Export** via `pdf-lib`.
- **GST Calculator**: Intra-state (CGST + SGST) and Inter-state (IGST) tax breakdown (0%, 5%, 12%, 18%, 28%), calculation history log, PDF export, and **Plain Language AI Explanations**.
- **Profit & Loss Reports**: Auto-generated P&L statements, period-over-period growth comparison, PDF statement export, and archived monthly summaries.
- **Financial Health Score**: Composite 0–100 score engine (Savings Rate, Expense Ratio, Budget Adherence, Liquidity Buffer, Income Consistency) with gauge meter and 6-month trajectory chart.
- **In-App Notification Center**: Real-time alerts for budget exceedance, low balance / spending exceeds income, and invoice due dates.
- **Google Gemini AI Assistant**: Context-aware floating drawer & full-screen AI advisor answering queries about user's financial metrics, GST, affordances, and tax saving advice.
- **Dark / Light / System Theme Toggle**: Full light and dark theme support with `localStorage` persistence and no-flash script.

---

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Custom Fintech Design Tokens
- **Database & ORM**: SQLite / PostgreSQL with Prisma ORM
- **State Management**: TanStack React Query + Zustand
- **Form Handling**: React Hook Form + Zod Validation
- **Charts**: Recharts with Custom High-Contrast Tooltips
- **PDF Generation**: `pdf-lib`
- **AI Engine**: Google Gemini API (`@google/generative-ai`)
- **Testing**: Vitest (`15/15 unit tests passing`)

---

## 💻 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Database Setup
```bash
npx prisma db push
node prisma/seed.js
```

### 3. Start Development Server
```bash
npm run dev
```

Open `http://localhost:3000` in your browser. Demo login:
- **Email**: `demo@financialassistant.ai`
- **Password**: `password123`

---

## 🧪 Testing

```bash
npm test
```
