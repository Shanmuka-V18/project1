'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, RefreshCw, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AssistantPage() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Welcome to your full-screen AI Chartered Accountant & Financial Assistant! I have analyzed your live database records. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const presetQueries = [
    'What did I spend this month?',
    'Show my highest expenses',
    'Can I afford to buy a laptop?',
    'Calculate GST for 150,000 INR at 18% Intra-State',
    'Explain my financial health score breakdown',
    'Give me tax saving tips for Indian freelancers',
    'Summarize this month finances',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (queryText?: string) => {
    const query = queryText || input;
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
          { role: 'assistant', content: 'Issue communicating with AI assistant server.' },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center">
            <Sparkles className="mr-2 h-6 w-6 text-teal-400" /> AI Financial Assistant & CA Advisor
          </h1>
          <p className="text-xs text-slate-400 mt-1">Real-time context-aware answers for expenses, GST, affordances, and tax saving</p>
        </div>
      </div>

      {/* Main Chat Window */}
      <Card className="flex-1 flex flex-col p-0 overflow-hidden border border-slate-800">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex items-start space-x-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-600/30 text-teal-300 border border-teal-500/40">
                  <Bot className="h-5 w-5" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-teal-600 text-white font-medium shadow-md'
                    : 'bg-slate-900 text-slate-200 border border-slate-800 whitespace-pre-wrap'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-200">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-teal-400 bg-slate-900 p-4 rounded-xl border border-slate-800">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Analyzing database financial records & synthesizing response...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Queries */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Preset Financial Questions:</p>
          <div className="flex flex-wrap gap-2">
            {presetQueries.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="rounded-full bg-slate-900 hover:bg-teal-950/80 hover:text-teal-300 hover:border-teal-700 px-3 py-1 text-[11px] text-slate-300 border border-slate-800 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
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
              placeholder="Ask anything about your income, GST, budgets, affordances, or tax tips..."
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <Button type="submit" isLoading={isLoading} disabled={!input.trim()} className="bg-teal-600 hover:bg-teal-500 py-3 px-6">
              <Send className="h-4 w-4 mr-1.5" /> Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
