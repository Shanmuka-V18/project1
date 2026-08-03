export const INVOICE_STATUSES = [
  'Draft',
  'Sent',
  'Partially Paid',
  'Paid',
  'Overdue',
  'Cancelled',
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PAYMENT_MODES = [
  'Cash',
  'UPI',
  'Bank Transfer',
  'Credit Card',
  'Cheque',
] as const;

export type PaymentMode = (typeof PAYMENT_MODES)[number];

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
  normalized?: string;
}

export function validatePhoneNumber(phone?: string | null): PhoneValidationResult {
  if (!phone || !phone.trim()) {
    return { isValid: true, normalized: '' };
  }

  const trimmed = phone.trim();
  // Allow leading +, digits, spaces, hyphens, parentheses
  const cleanDigits = trimmed.replace(/[\s\-\(\)\+]/g, '');

  if (!/^\d+$/.test(cleanDigits)) {
    return {
      isValid: false,
      error: 'Phone number must contain only numbers and standard formatting characters (+, -, spaces).',
    };
  }

  if (cleanDigits.length < 7 || cleanDigits.length > 15) {
    return {
      isValid: false,
      error: 'Phone number length must be between 7 and 15 digits.',
    };
  }

  return {
    isValid: true,
    normalized: trimmed,
  };
}

export function calculateBalanceDue(total: number, amountPaid: number = 0): number {
  return Math.max(0, total - amountPaid);
}

export function duplicateInvoiceData(original: any, newInvoiceNumber: string) {
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 14);

  return {
    invoiceNumber: newInvoiceNumber,
    businessName: original.businessName || '',
    pan: original.pan || '',
    gstin: original.gstin || '',
    clientName: original.clientName || '',
    clientEmail: original.clientEmail || '',
    clientPhone: original.clientPhone || '',
    paymentMode: original.paymentMode || 'Bank Transfer',
    items: typeof original.items === 'string' ? original.items : JSON.stringify(original.items || []),
    subtotal: original.subtotal || 0,
    gstAmount: original.gstAmount || 0,
    discount: original.discount || 0,
    total: original.total || 0,
    amountPaid: 0,
    status: 'Draft' as const,
    dueDate: defaultDueDate.toISOString().split('T')[0],
  };
}
