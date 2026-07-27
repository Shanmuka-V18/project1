import { describe, it, expect } from 'vitest';
import {
  getPredefinedCategories,
  resetCategoryOnBudgetTypeChange,
  validateCustomCategory,
  PERSONAL_CATEGORIES,
  BUSINESS_CATEGORIES,
} from '../src/lib/budget-utils';

describe('Budget Type & Custom Category Engine', () => {
  describe('Budget Type Category Lists & Switching', () => {
    it('returns correct category list for personal budget type', () => {
      const categories = getPredefinedCategories('personal');
      expect(categories).toContain('House Rent');
      expect(categories).toContain('Food & Groceries');
      expect(categories).toContain('Savings');
      expect(categories).toContain('EMI / Loans');
      expect(categories).not.toContain('Salaries');
    });

    it('returns correct category list for business budget type', () => {
      const categories = getPredefinedCategories('business');
      expect(categories).toContain('Rent');
      expect(categories).toContain('Salaries');
      expect(categories).toContain('Marketing');
      expect(categories).toContain('Software');
      expect(categories).not.toContain('Food & Groceries');
    });

    it('resets selected category when switching budget type', () => {
      const personalDefault = resetCategoryOnBudgetTypeChange('personal');
      expect(personalDefault).toBe('House Rent');

      const businessDefault = resetCategoryOnBudgetTypeChange('business');
      expect(businessDefault).toBe('Rent');
    });
  });

  describe('Custom Category Validation & Duplicate Prevention', () => {
    it('validates and normalizes valid custom category name', () => {
      const existing = ['Rent', 'Utilities', 'Salaries'];
      const result = validateCustomCategory('  Coffee & Snacks  ', existing);

      expect(result.isValid).toBe(true);
      expect(result.normalizedName).toBe('Coffee & Snacks');
      expect(result.error).toBeUndefined();
    });

    it('rejects empty or whitespace-only custom category name', () => {
      const existing = ['Rent', 'Utilities'];
      const result = validateCustomCategory('   ', existing);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    it('rejects case-insensitive duplicate custom category names', () => {
      const existing = ['Rent', 'Utilities', 'Gym Membership', 'Salaries'];

      // Exact match
      const result1 = validateCustomCategory('Gym Membership', existing);
      expect(result1.isValid).toBe(false);
      expect(result1.error).toContain('already exists');

      // Case-insensitive match
      const result2 = validateCustomCategory('gym membership', existing);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toContain('already exists');

      // Case-insensitive match for predefined category
      const result3 = validateCustomCategory('RENT', existing);
      expect(result3.isValid).toBe(false);
      expect(result3.error).toContain('already exists');
    });
  });
});
