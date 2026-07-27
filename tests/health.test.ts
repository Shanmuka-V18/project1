import { describe, it, expect } from 'vitest';
import { calculateFinancialHealthScore } from '../src/lib/utils';

describe('Financial Health Score Engine', () => {
  it('returns 0 score and Poor rating when income is 0', () => {
    const result = calculateFinancialHealthScore(0, 5000, 2, 0);
    expect(result.score).toBe(0);
    expect(result.rating).toBe('Poor');
  });

  it('calculates high score (>=80) and Excellent rating for healthy income vs expense ratio', () => {
    const result = calculateFinancialHealthScore(200000, 80000, 5, 0);
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(['Good', 'Excellent']).toContain(result.rating);
  });

  it('penalizes score when budget limits are exceeded', () => {
    const perfectBudget = calculateFinancialHealthScore(100000, 60000, 4, 0);
    const exceededBudget = calculateFinancialHealthScore(100000, 60000, 4, 2);
    expect(exceededBudget.score).toBeLessThan(perfectBudget.score);
  });
});
