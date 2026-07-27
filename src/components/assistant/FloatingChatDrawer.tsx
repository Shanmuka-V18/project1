'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, User, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

export function FloatingChatDrawer() {
  const { isAiDrawerOpen, setAiDrawerOpen, toggleAiDrawer } = useAppStore();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Financial & CA Assistant. Ask me anything about your income, expenses, GST, invoice status, budgets, or saving advice!',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'What did I spend this month?',
    'Show my highest expenses',
    'Can I afford to buy a laptop?',
    'Explain my financial health score',
    'Calculate GST for 100,000 INR at 18%',
    'Give me tax saving tips',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAiDrawerOpen) scrollToBottom();
  }, [messages, isAiDrawerOpen]);

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
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'I encountered an issue analyzing your financial records. Please try again.' },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network error. Please verify your connection.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={toggleAiDrawer}
        aria-label="Open AI Financial Assistant"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all glow-teal"
      >
        <Bot className="h-7 w-7" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-500"></span>
        </span>
      </button>

      {/* Slide-Over Chat Drawer */}
      {isAiDrawerOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-right duration-200 text-slate-900 dark:text-slate-100">
          {/* Drawer Header */}
          <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 bg-slate-50 dark:bg-slate-950/70">
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-md">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">AI CA & Financial Assistant</h3>
                <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">Powered by Gemini AI</p>
              </div>
            </div>
            <button
              onClick={() => setAiDrawerOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn('flex items-start space-x-2.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-600/30 text-teal-700 dark:text-teal-400 border border-teal-300 dark:border-teal-500/40">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-teal-600 text-white font-medium rounded-tr-none shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 rounded-tl-none whitespace-pre-wrap'
                  )}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center space-x-2 text-xs text-teal-600 dark:text-teal-400 bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Analyzing financial records & drafting response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts Pills */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-2">Suggested Queries:</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestedPrompts.slice(0, 4).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-teal-950/60 hover:text-teal-700 dark:hover:text-teal-300 hover:border-teal-400 dark:hover:border-teal-700 px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 transition-all text-left truncate max-w-xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about expenses, GST, affordances..."
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-50 transition-colors shadow-md glow-teal"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
