import { generateGeminiContent } from './gemini-config';

export interface AICallParams {
  systemPrompt: string;
  userMessage: string;
}

export async function callAIProvider({ systemPrompt, userMessage }: AICallParams): Promise<string | null> {
  const groqKey = (process.env.GROQ_API_KEY || '').trim();
  const grokKey = (process.env.GROK_API_KEY || '').trim();
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
  const openAIKey = (process.env.OPENAI_API_KEY || '').trim();

  // Determine active key (prefer GROQ, then GROK/xAI, then GEMINI, then OpenAI)
  const activeKey = groqKey || grokKey || geminiKey || openAIKey;

  if (!activeKey || activeKey === 'your-google-gemini-api-key-here' || activeKey === 'your-groq-api-key-here') {
    return null;
  }

  // 1. Groq API Key (starts with gsk_ or GROQ_API_KEY provided)
  if (activeKey.startsWith('gsk_') || groqKey) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey || activeKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply) return reply.trim();
      }

      // Try secondary Groq model if 70b failed
      const fallbackResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey || activeKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
        }),
      });

      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply) return reply.trim();
      }
    } catch (err: any) {
      console.warn('[Groq API Call Error]:', err?.message || err);
    }
  }

  // 2. xAI Grok Key (starts with xai-)
  if (activeKey.startsWith('xai-')) {
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply) return reply.trim();
      }
    } catch (err: any) {
      console.warn('[xAI Grok API Error]:', err?.message || err);
    }
  }

  // 3. Google Gemini Execution via Centralized Engine
  try {
    const text = await generateGeminiContent({ systemInstruction: systemPrompt, prompt: userMessage });
    if (text) return text;
  } catch (err: any) {
    console.warn('[Google Gemini Provider Error]:', err?.message || err);
  }

  return null;
}
