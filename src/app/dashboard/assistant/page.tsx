'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageTitle, MutedText, FormLabel, SectionTitle, BodyText } from '@/components/ui/Typography';
import { cn } from '@/lib/utils';

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content:
        'Hello! I am your dedicated AI CA & Financial Advisor. Ask me detailed questions regarding your current monthly budget, income streams, GST obligations, tax-saving strategies, or major purchase affordances!',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'Am I spending more than I earn this month?',
    'What are my top 3 highest expense categories?',
    'How much GST did I calculate this month?',
    'Give me 5 actionable tax-saving tips under Indian tax rules',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const newMessages = [...messages, { role: 'user' as const, content: query }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversationHistory: newMessages,
        }),
      });

      const data = await response.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Notice: ${data.error}. Please try another question.` },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'I encountered an issue analyzing your financial records. Please try again.' },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network error. Please verify your server connection.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div>
        <PageTitle>AI CA & Financial Advisor</PageTitle>
        <MutedText className="mt-1 font-medium">Context-aware financial analysis powered by Google Gemini AI</MutedText>
      </div>

      <Card className="flex flex-col h-[650px] p-0 overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn('flex items-start space-x-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-600/30 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-500/40">
                  <Bot className="h-5 w-5" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed font-medium',
                  msg.role === 'user'
                    ? 'bg-teal-600 text-white shadow-md rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/60 rounded-tl-none whitespace-pre-wrap'
                )}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 p-3 rounded-xl border border-teal-200 dark:border-teal-800 font-medium">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Analyzing database & generating tailored advice...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
          <MutedText className="uppercase tracking-wider font-bold mb-2 text-[10px]">Suggested Inquiries:</MutedText>
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="rounded-full bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-slate-800 dark:text-slate-200 hover:text-teal-800 dark:hover:text-teal-300 px-3 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-all text-left truncate max-w-sm shadow-sm"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Form Input */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your income, expenses, budgets, GST, or taxes..."
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:border-teal-600 focus:outline-none font-medium"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-teal-600 hover:bg-teal-500 text-white px-5 py-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
