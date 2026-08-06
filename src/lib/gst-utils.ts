export interface GSTInput {
  amount: number;
  gstRate: number;
  transactionType: 'Intra-State' | 'Inter-State';
  isInclusive: boolean;
}

export interface GSTCalculationResult {
  amount: number;
  baseAmount: number;
  gstRate: number;
  transactionType: 'Intra-State' | 'Inter-State';
  isInclusive: boolean;
  gstAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  finalAmount: number;
}

export function calculateGST({
  amount,
  gstRate,
  transactionType,
  isInclusive,
}: GSTInput): GSTCalculationResult {
  const numAmount = Math.max(0, amount || 0);
  const rate = Math.max(0, gstRate || 0);

  let baseAmount = 0;
  let gstAmount = 0;
  let finalAmount = 0;

  if (isInclusive) {
    finalAmount = numAmount;
    baseAmount = rate > 0 ? numAmount / (1 + rate / 100) : numAmount;
    gstAmount = finalAmount - baseAmount;
  } else {
    baseAmount = numAmount;
    gstAmount = (baseAmount * rate) / 100;
    finalAmount = baseAmount + gstAmount;
  }

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (transactionType === 'Intra-State') {
    cgst = gstAmount / 2;
    sgst = gstAmount / 2;
    igst = 0;
  } else {
    cgst = 0;
    sgst = 0;
    igst = gstAmount;
  }

  return {
    amount: numAmount,
    baseAmount: Math.round(baseAmount * 100) / 100,
    gstRate: rate,
    transactionType,
    isInclusive,
    gstAmount: Math.round(gstAmount * 100) / 100,
    cgst: Math.round(cgst * 100) / 100,
    sgst: Math.round(sgst * 100) / 100,
    igst: Math.round(igst * 100) / 100,
    finalAmount: Math.round(finalAmount * 100) / 100,
  };
}
