export interface NotificationEvaluationResult {
  type: string;
  message: string;
  triggerKey: string; // Used to prevent duplicate unread notifications
}

export function evaluateSpendingExceedsIncome(
  totalIncome: number,
  totalExpense: number
): NotificationEvaluationResult | null {
  if (totalExpense > totalIncome && totalIncome > 0) {
    const deficit = totalExpense - totalIncome;
    return {
      type: 'Low Balance',
      message: `Alert: Total monthly expenses (₹${totalExpense.toLocaleString('en-IN')}) exceed total income (₹${totalIncome.toLocaleString('en-IN')}) by ₹${deficit.toLocaleString('en-IN')}.`,
      triggerKey: 'SPENDING_EXCEEDS_INCOME',
    };
  }
  return null;
}

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
      triggerKey: `BUDGET_EXCEEDED_100_${category.toUpperCase()}`,
    };
  } else if (percentage >= 80) {
    return {
      type: 'Budget Reminder',
      message: `Warning: You have reached ${Math.round(percentage)}% of your "${category}" monthly budget limit.`,
      triggerKey: `BUDGET_WARNING_80_${category.toUpperCase()}`,
    };
  }

  return null;
}

export function evaluateInvoiceDueAlert(
  dueDateInput: Date | string,
  clientName: string,
  invoiceNumber: string,
  status: string
): NotificationEvaluationResult | null {
  if (status === 'Paid') return null;

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
