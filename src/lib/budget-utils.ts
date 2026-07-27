export type BudgetType = 'personal' | 'business';

export const PERSONAL_CATEGORIES = [
  'House Rent',
  'Food & Groceries',
  'Transportation',
  'Utilities',
  'Mobile & Internet',
  'Healthcare',
  'Education',
  'Entertainment',
  'Shopping',
  'Travel',
  'Savings',
  'EMI / Loans',
  'Other',
] as const;

export const BUSINESS_CATEGORIES = [
  'Rent',
  'Utilities',
  'Salaries',
  'Marketing',
  'Software',
  'Taxes',
  'Office Supplies',
  'Travel',
  'Equipment',
  'Loan Repayment',
  'Miscellaneous',
  'Other',
] as const;

export function getPredefinedCategories(budgetType: BudgetType): readonly string[] {
  return budgetType === 'personal' ? PERSONAL_CATEGORIES : BUSINESS_CATEGORIES;
}

export function resetCategoryOnBudgetTypeChange(newBudgetType: BudgetType): string {
  const list = getPredefinedCategories(newBudgetType);
  return list[0];
}

export interface CustomCategoryValidationResult {
  isValid: boolean;
  error?: string;
  normalizedName?: string;
}

export function validateCustomCategory(
  customCategoryInput: string,
  existingCategories: string[]
): CustomCategoryValidationResult {
  const trimmed = customCategoryInput.trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Custom category name cannot be empty.',
    };
  }

  const lowerTrimmed = trimmed.toLowerCase();
  const isDuplicate = existingCategories.some(
    (cat) => cat.trim().toLowerCase() === lowerTrimmed
  );

  if (isDuplicate) {
    return {
      isValid: false,
      error: `Category "${trimmed}" already exists. Duplicate names are not allowed.`,
    };
  }

  return {
    isValid: true,
    normalizedName: trimmed,
  };
}
