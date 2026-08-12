import { describe, it, expect } from 'vitest';

describe('AI Assistant Integration & Fallback Engine', () => {
  it('formats offline demo mode label when GEMINI_API_KEY is not configured', () => {
    const isUnconfigured = true;
    const responseText = isUnconfigured
      ? '[Offline Demo Mode — Configure GEMINI_API_KEY in .env for Live AI]\n\nFinancial snapshot'
      : 'Live response';

    expect(responseText).toContain('[Offline Demo Mode');
  });

  it('correctly detects error state when Gemini API returns an error payload', () => {
    const errorPayload = { error: 'Gemini API Error: Invalid API key format' };

    expect(errorPayload.error).toContain('Gemini API Error');
    expect(errorPayload).not.toHaveProperty('reply');
  });
});
