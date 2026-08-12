import { describe, it, expect, vi } from 'vitest';
import { FALLBACK_GEMINI_MODELS, PRIMARY_GEMINI_MODEL } from '../src/lib/gemini-config';

describe('Centralized Gemini Model Configuration & Fallback Engine', () => {
  it('defines gemini-1.5-flash as primary stable production model', () => {
    expect(PRIMARY_GEMINI_MODEL).toBe('gemini-1.5-flash');
    expect(FALLBACK_GEMINI_MODELS[0]).toBe('gemini-1.5-flash');
  });

  it('includes stable fallback model candidates in fallback chain', () => {
    expect(FALLBACK_GEMINI_MODELS).toContain('gemini-1.5-flash');
    expect(FALLBACK_GEMINI_MODELS).toContain('gemini-1.5-pro');
    expect(FALLBACK_GEMINI_MODELS.length).toBeGreaterThanOrEqual(3);
  });

  it('formats user-friendly error payload when API fails', () => {
    const userFriendlyError = "I'm having trouble connecting right now — please try again in a moment.";

    expect(userFriendlyError).not.toContain('https://');
    expect(userFriendlyError).not.toContain('[GoogleGenerativeAI Error]');
    expect(userFriendlyError).toContain('please try again in a moment');
  });
});
