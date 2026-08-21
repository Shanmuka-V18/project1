export interface NotificationEvaluationResult {
  type: string;
  message: string;
  triggerKey: string; // Used to prevent duplicate unread notifications
}

/**
 * Evaluates Low Balance alert based on net income reserves.
 * Fires ONLY when cash reserves or net balance is low relative to income.
 */
export function evaluateLowBalance(
  totalIncome: number,
  totalExpense: number
): NotificationEvaluationResult | null {
  if (totalIncome <= 0) return null;

  const netBalance = totalIncome - totalExpense;
  const reserveRatio = (netBalance / totalIncome) * 100;

  if (totalExpense > totalIncome) {
    const deficit = totalExpense - totalIncome;
    return {
      type: 'Low Balance',
      message: `Low Balance Warning: Total expenses (₹${totalExpense.toLocaleString('en-IN')}) exceed income (₹${totalIncome.toLocaleString('en-IN')}) by ₹${deficit.toLocaleString('en-IN')}.`,
      triggerKey: 'LOW_BALANCE_DEFICIT',
    };
  } else if (reserveRatio < 15) {
    return {
      type: 'Low Balance',
      message: `Low Balance Warning: Cash reserve (₹${netBalance.toLocaleString('en-IN')}) is at ${Math.round(reserveRatio)}% of income, below the 15% safety threshold.`,
      triggerKey: 'LOW_BALANCE_THRESHOLD',
    };
  }

  return null;
}

/**
 * Backward compatibility alias for spending evaluation
 */
export function evaluateSpendingExceedsIncome(
  totalIncome: number,
  totalExpense: number
): NotificationEvaluationResult | null {
  return evaluateLowBalance(totalIncome, totalExpense);
}

/**
 * Evaluates category spending against budget thresholds.
 * 80% to 99.9% = Budget Reminder
 * 100%+ = Budget Exceeded
 */
export function evaluateBudgetThresholds(
  actualSpent: number,
  monthlyLimit: number,
  category: string
): NotificationEvaluationResult | null {
  if (monthlyLimit <= 0) return null;

  const percentage = (actualSpent / monthlyLimit) * 100;

  if (percentage >= 100) {
    return {
      type: 'Budget Exceeded',
      message: `Alert: Your spending in "${category}" (₹${actualSpent.toLocaleString('en-IN')}) has exceeded your monthly budget limit of ₹${monthlyLimit.toLocaleString('en-IN')}.`,
      triggerKey: `BUDGET_EXCEEDED_${category.toUpperCase()}`,
    };
  } else if (percentage >= 80) {
    return {
      type: 'Budget Reminder',
      message: `Warning: You have reached ${Math.round(percentage)}% of your "${category}" monthly budget limit.`,
      triggerKey: `BUDGET_REMINDER_${category.toUpperCase()}`,
    };
  }

  return null;
}

/**
 * Evaluates active invoices due date reminders.
 * Fires ONLY for active invoices (not Paid or Cancelled).
 */
export function evaluateInvoiceDueAlert(
  dueDateInput: Date | string,
  clientName: string,
  invoiceNumber: string,
  status: string
): NotificationEvaluationResult | null {
  if (status === 'Paid' || status === 'Cancelled') return null;

  const dueDate = typeof dueDateInput === 'string' ? new Date(dueDateInput) : dueDateInput;
  const now = new Date();
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 3 && diffDays >= 0) {
    return {
      type: 'Invoice Due',
      message: `Reminder: Invoice ${invoiceNumber} for ${clientName} is due in ${diffDays === 0 ? 'today' : `${diffDays} day(s)`}.`,
      triggerKey: `INVOICE_DUE_${invoiceNumber}`,
    };
  } else if (diffDays < 0 && status !== 'Overdue') {
    return {
      type: 'Invoice Due',
      message: `Alert: Invoice ${invoiceNumber} for ${clientName} is overdue!`,
      triggerKey: `INVOICE_OVERDUE_${invoiceNumber}`,
    };
  }

  return null;
}

/**
 * Evaluates Monthly Report Ready notification.
 */
export function evaluateMonthlyReportReady(month: number, year: number): NotificationEvaluationResult {
  const d = new Date(year, month - 1, 1);
  const monthName = d.toLocaleString('en-IN', { month: 'long' });
  return {
    type: 'Monthly Report',
    message: `Your monthly financial summary and P&L statement for ${monthName} ${year} is ready to review.`,
    triggerKey: `MONTHLY_REPORT_${month}_${year}`,
  };
}
