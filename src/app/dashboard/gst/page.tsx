'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, Download, Sparkles, History, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageTitle, MutedText, FormLabel, TableHeading, StatLabel, SectionTitle, BodyText } from '@/components/ui/Typography';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculateGST, GSTCalculationResult } from '@/lib/gst-utils';

export default function GSTPage() {
  const [amount, setAmount] = useState<string>('100000');
  const [gstRate, setGstRate] = useState<number>(18);
  const [transactionType, setTransactionType] = useState<'Intra-State' | 'Inter-State'>('Intra-State');
  const [isInclusive, setIsInclusive] = useState<boolean>(false);

  const [result, setResult] = useState<GSTCalculationResult | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    fetch('/api/gst')
      .then((res) => res.json())
      .then((data) => {
        if (data.history) setHistory(data.history);
      })
      .catch(() => {});
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    const calcResult = calculateGST({
      amount: numAmount,
      gstRate,
      transactionType,
      isInclusive,
    });

    setResult(calcResult);

    // Save to history backend
    try {
      await fetch('/api/gst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: calcResult.amount,
          gstRate: calcResult.gstRate,
          transactionType: calcResult.transactionType,
          isInclusive: calcResult.isInclusive,
          cgst: calcResult.cgst,
          sgst: calcResult.sgst,
          igst: calcResult.igst,
          finalAmount: calcResult.finalAmount,
        }),
      });
      fetchHistory();
    } catch (err) {}

    // Fetch AI Plain Language Explanation
    explainWithAI(calcResult);
  };

  const explainWithAI = async (calcResult: GSTCalculationResult) => {
    setIsExplaining(true);
    setAiExplanation('');
    try {
      const res = await fetch('/api/gst/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calculation: calcResult }),
      });
      const data = await res.json();
      if (data.explanation) setAiExplanation(data.explanation);
    } catch (e) {
      setAiExplanation('GST rules apply CGST+SGST for intra-state transactions and IGST for inter-state supply.');
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div>
        <PageTitle>GST Calculator & Tax Advisor</PageTitle>
        <MutedText className="mt-1 font-medium">Compute Intra-State (CGST + SGST) and Inter-State (IGST) taxes with GST Inclusive / Exclusive modes</MutedText>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Card */}
        <Card className="lg:col-span-6 p-6">
          <SectionTitle className="mb-4 text-teal-700 dark:text-teal-400">Calculation Input</SectionTitle>

          <form onSubmit={handleCalculate} className="space-y-4 text-xs">
            <div>
              <FormLabel className="mb-1">
                {isInclusive ? 'Gross Amount (GST Included) *' : 'Transaction Amount *'}
              </FormLabel>
              <input
                type="number"
                required
                step="any"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100000"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:border-teal-600 focus:outline-none font-bold text-sm"
              />
            </div>

            <div>
              <FormLabel className="mb-1">GST Rate Tier *</FormLabel>
              <div className="grid grid-cols-5 gap-2">
                {[0, 5, 12, 18, 28].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setGstRate(rate)}
                    className={`rounded-xl py-2 text-xs font-bold border transition-all ${
                      gstRate === rate
                        ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                        : 'bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FormLabel className="mb-1">Supply Type *</FormLabel>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTransactionType('Intra-State')}
                  className={`rounded-xl p-3 text-xs font-bold border transition-all ${
                    transactionType === 'Intra-State'
                      ? 'bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border-teal-500 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  Intra-State (CGST + SGST)
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionType('Inter-State')}
                  className={`rounded-xl p-3 text-xs font-bold border transition-all ${
                    transactionType === 'Inter-State'
                      ? 'bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border-teal-500 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  Inter-State (IGST)
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="isInclusive"
                checked={isInclusive}
                onChange={(e) => setIsInclusive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <label htmlFor="isInclusive" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                Amount is GST Inclusive (Extract tax component)
              </label>
            </div>

            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 mt-2">
              <Calculator className="mr-2 h-4 w-4" /> Calculate GST & Get AI Explanation
            </Button>
          </form>
        </Card>

        {/* Results Card */}
        <Card className="lg:col-span-6 p-6 flex flex-col justify-between">
          <div>
            <SectionTitle className="mb-4 text-teal-700 dark:text-teal-400">
              Tax Breakdown Output ({result?.isInclusive ? 'GST Inclusive' : 'GST Exclusive'})
            </SectionTitle>

            {!result ? (
              <div className="py-16 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                Enter amount and click "Calculate GST" to view detailed tax breakdown.
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    {result.isInclusive ? 'Base Net Amount (Excl. Tax):' : 'Base Net Amount:'}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(result.baseAmount)}</span>
                </div>

                {result.transactionType === 'Intra-State' ? (
                  <>
                    <div className="flex justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">CGST ({result.gstRate / 2}%):</span>
                      <span className="font-bold text-teal-700 dark:text-teal-400">{formatCurrency(result.cgst)}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">SGST ({result.gstRate / 2}%):</span>
                      <span className="font-bold text-teal-700 dark:text-teal-400">{formatCurrency(result.sgst)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">IGST ({result.gstRate}%):</span>
                    <span className="font-bold text-teal-700 dark:text-teal-400">{formatCurrency(result.igst)}</span>
                  </div>
                )}

                <div className="flex justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-semibold">
                  <span className="text-slate-600 dark:text-slate-400">Total GST Tax Amount:</span>
                  <span className="font-bold text-teal-700 dark:text-teal-400">{formatCurrency(result.gstAmount)}</span>
                </div>

                <div className="flex justify-between p-4 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 text-sm font-extrabold">
                  <span className="text-teal-900 dark:text-teal-300">
                    {result.isInclusive ? 'Final Amount (Same as Input):' : 'Final Gross Amount:'}
                  </span>
                  <span className="text-teal-900 dark:text-teal-300">{formatCurrency(result.finalAmount)}</span>
                </div>
              </div>
            )}
          </div>

          {/* AI Explanation Box */}
          {result && (
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-teal-700 dark:text-teal-300 font-bold text-xs mb-2">
                <Sparkles className="h-4 w-4" />
                <span>AI Plain Language Tax Explanation</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {isExplaining ? (
                  <div className="flex items-center space-x-2 text-teal-600">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div>
                    <span>Consulting AI Tax Engine...</span>
                  </div>
                ) : (
                  aiExplanation || (result.isInclusive
                    ? `GST Inclusive calculation extracted ₹${result.gstAmount.toLocaleString('en-IN')} tax component from the ₹${result.amount.toLocaleString('en-IN')} gross amount.`
                    : `GST Exclusive calculation added ₹${result.gstAmount.toLocaleString('en-IN')} tax to the ₹${result.amount.toLocaleString('en-IN')} base amount.`)
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* History Log */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="mr-2 h-4 w-4 text-teal-600 dark:text-teal-400" /> Recent GST Calculation History
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4"><TableHeading>Date</TableHeading></th>
                <th className="py-3 px-4"><TableHeading>Amount</TableHeading></th>
                <th className="py-3 px-4"><TableHeading>Rate</TableHeading></th>
                <th className="py-3 px-4"><TableHeading>Supply Type</TableHeading></th>
                <th className="py-3 px-4 text-right"><TableHeading>Gross Total</TableHeading></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 dark:text-slate-400">No calculation history logged yet.</td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{formatDate(h.createdAt)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{formatCurrency(h.amount)}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{h.gstRate}%</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{h.transactionType}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-teal-700 dark:text-teal-400">{formatCurrency(h.finalAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
