import { GoogleGenerativeAI } from '@google/generative-ai';

export const PRIMARY_GEMINI_MODEL = 'gemini-1.5-flash';
export const FALLBACK_GEMINI_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.0-pro',
];

export interface GeminiRequestOptions {
  prompt: string;
  systemInstruction?: string;
}

export async function generateGeminiContent({ prompt, systemInstruction }: GeminiRequestOptions): Promise<string> {
  const rawApiKey = (process.env.GEMINI_API_KEY || '').trim();

  if (!rawApiKey || rawApiKey === 'your-google-gemini-api-key-here') {
    throw new Error('GEMINI_API_KEY is not configured in .env file.');
  }

  const genAI = new GoogleGenerativeAI(rawApiKey);
  let replyText = '';
  let lastError: any = null;

  const fullPrompt = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;

  for (const modelName of FALLBACK_GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(fullPrompt);
      replyText = result.response.text();
      if (replyText) {
        return replyText.trim();
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Model Service] Model '${modelName}' call failed, attempting fallback:`, err?.message || err);
    }
  }

  console.error('[Gemini Model Service Error] All candidate models failed:', lastError?.message || lastError);
  throw lastError || new Error('All Gemini model candidates failed to respond.');
}
