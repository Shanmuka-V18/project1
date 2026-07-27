'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, Sparkles, FileText, Download, History, HelpCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDate, calculateGST, GSTCalculationResult } from '@/lib/utils';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export default function GSTPage() {
  const [amount, setAmount] = useState<string>('100000');
  const [gstRate, setGstRate] = useState<number>(18);
  const [transactionType, setTransactionType] = useState<'Intra-State' | 'Inter-State'>('Intra-State');
  const [calculation, setCalculation] = useState<GSTCalculationResult | null>(null);

  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Gemini AI Plain Language Explanation
  const [explanation, setExplanation] = useState<string>('');
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [isExplanationModalOpen, setIsExplanationModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Live calculate initial
    const result = calculateGST(parseFloat(amount) || 0, gstRate, transactionType);
    setCalculation(result);
    fetchHistory();
  }, [amount, gstRate, transactionType]);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/gst');
      const data = await res.json();
      if (data.history) setHistory(data.history);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSaveAndLog = async () => {
    if (!calculation || calculation.amount <= 0) return;

    try {
      const res = await fetch('/api/gst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: calculation.amount,
          gstRate: calculation.gstRate,
          transactionType: calculation.transactionType,
        }),
      });

      if (res.ok) {
        fetchHistory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExplain = async () => {
    if (!calculation) return;
    setIsExplaining(true);
    setIsExplanationModalOpen(true);
    setExplanation('');

    try {
      const res = await fetch('/api/gst/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calculation),
      });

      const data = await res.json();
      if (data.explanation) {
        setExplanation(data.explanation);
      }
    } catch (e) {
      setExplanation('Failed to fetch AI explanation. Please check your connection.');
    } finally {
      setIsExplaining(false);
    }
  };

  const handleExportPDF = async (record: GSTCalculationResult) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 500]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const primaryColor = rgb(0.05, 0.58, 0.53);
    const darkColor = rgb(0.06, 0.09, 0.16);

    let y = 450;
    page.drawText('GST CALCULATION STATEMENT', { x: 40, y, size: 16, font: fontBold, color: primaryColor });
    page.drawText(`Date: ${formatDate(new Date())}`, { x: 420, y, size: 10, font, color: rgb(0.4, 0.45, 0.55) });

    y -= 40;
    page.drawRectangle({ x: 40, y: y - 10, width: 520, height: 1, color: rgb(0.8, 0.85, 0.9) });

    y -= 30;
    page.drawText(`Taxable Base Amount:`, { x: 50, y, size: 11, font, color: darkColor });
    page.drawText(formatCurrency(record.amount), { x: 380, y, size: 11, font: fontBold, color: darkColor });

    y -= 25;
    page.drawText(`Applied GST Rate:`, { x: 50, y, size: 11, font, color: darkColor });
    page.drawText(`${record.gstRate}%`, { x: 380, y, size: 11, font, color: darkColor });

    y -= 25;
    page.drawText(`Transaction Type:`, { x: 50, y, size: 11, font, color: darkColor });
    page.drawText(record.transactionType, { x: 380, y, size: 11, font, color: darkColor });

    y -= 30;
    if (record.transactionType === 'Intra-State') {
      page.drawText(`CGST (${record.gstRate / 2}%):`, { x: 50, y, size: 11, font, color: darkColor });
      page.drawText(formatCurrency(record.cgst), { x: 380, y, size: 11, font, color: darkColor });

      y -= 25;
      page.drawText(`SGST (${record.gstRate / 2}%):`, { x: 50, y, size: 11, font, color: darkColor });
      page.drawText(formatCurrency(record.sgst), { x: 380, y, size: 11, font, color: darkColor });
    } else {
      page.drawText(`IGST (${record.gstRate}%):`, { x: 50, y, size: 11, font, color: darkColor });
      page.drawText(formatCurrency(record.igst), { x: 380, y, size: 11, font, color: darkColor });
    }

    y -= 40;
    page.drawRectangle({ x: 40, y: y - 5, width: 520, height: 35, color: rgb(0.9, 0.97, 0.96) });
    page.drawText(`FINAL TOTAL AMOUNT:`, { x: 50, y: y + 8, size: 12, font: fontBold, color: primaryColor });
    page.drawText(formatCurrency(record.finalAmount), { x: 380, y: y + 8, size: 14, font: fontBold, color: primaryColor });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `GST_Calculation_${record.gstRate}percent.pdf`;
    link.click();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">GST Calculator & History</h1>
        <p className="text-xs text-slate-400 mt-1">Instant CGST/SGST/IGST breakdown with plain-language AI explanation</p>
      </div>

      {/* Interactive Calculator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Inputs */}
        <Card className="lg:col-span-5 p-6 space-y-4">
          <h3 className="font-bold text-slate-100 text-sm flex items-center text-teal-400">
            <Calculator className="mr-2 h-4 w-4" /> GST Inputs
          </h3>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 text-xs">Taxable Base Amount (₹)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 100000"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 text-xs">GST Tax Rate</label>
            <div className="grid grid-cols-5 gap-1.5">
              {[0, 5, 12, 18, 28].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setGstRate(rate)}
                  className={`rounded-xl py-2 text-xs font-bold transition-all border ${
                    gstRate === rate
                      ? 'bg-teal-600 text-white border-teal-500 shadow-md'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 text-xs">Transaction Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTransactionType('Intra-State')}
                className={`rounded-xl p-2.5 text-xs font-bold text-center border transition-all ${
                  transactionType === 'Intra-State'
                    ? 'bg-teal-950/80 text-teal-300 border-teal-500/60'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                Intra-State
                <span className="block text-[10px] font-normal text-slate-400">Within Same State</span>
              </button>
              <button
                type="button"
                onClick={() => setTransactionType('Inter-State')}
                className={`rounded-xl p-2.5 text-xs font-bold text-center border transition-all ${
                  transactionType === 'Inter-State'
                    ? 'bg-teal-950/80 text-teal-300 border-teal-500/60'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                Inter-State
                <span className="block text-[10px] font-normal text-slate-400">Different State</span>
              </button>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button onClick={handleSaveAndLog} className="w-full bg-teal-600 hover:bg-teal-500">
              Save & Log Calculation
            </Button>
          </div>
        </Card>

        {/* Right Output Results Card */}
        <Card className="lg:col-span-7 p-6 flex flex-col justify-between border-l-4 border-l-teal-500">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-slate-100 text-sm">Calculation Breakdown Output</h3>
              <Badge variant="info">{transactionType}</Badge>
            </div>

            {calculation && (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Taxable Amount:</span>
                  <span className="font-semibold text-slate-200">{formatCurrency(calculation.amount)}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Applied GST Rate:</span>
                  <span className="font-semibold text-teal-400">{calculation.gstRate}%</span>
                </div>

                {calculation.transactionType === 'Intra-State' ? (
                  <>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">CGST ({calculation.gstRate / 2}%):</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(calculation.cgst)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">SGST ({calculation.gstRate / 2}%):</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(calculation.sgst)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">IGST ({calculation.gstRate}%):</span>
                    <span className="font-semibold text-slate-200">{formatCurrency(calculation.igst)}</span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Total Tax Amount:</span>
                  <span className="font-bold text-teal-300">{formatCurrency(calculation.totalTax)}</span>
                </div>

                <div className="rounded-2xl bg-teal-950/30 p-4 border border-teal-500/40 mt-4 flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-sm">Final Total Payable:</span>
                  <span className="font-extrabold text-teal-300 text-xl">{formatCurrency(calculation.finalAmount)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={handleExplain} variant="secondary" size="sm" className="flex-1">
              <Sparkles className="mr-1.5 h-4 w-4 text-teal-400" /> AI Plain Language Explanation
            </Button>
            {calculation && (
              <Button onClick={() => handleExportPDF(calculation)} variant="outline" size="sm">
                <Download className="mr-1.5 h-4 w-4" /> Export PDF
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* History Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="mr-2 h-4 w-4 text-teal-400" /> Saved Calculation History Log
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Base Amount</th>
                <th className="py-3 px-4">GST Rate</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">CGST / SGST</th>
                <th className="py-3 px-4 text-right">IGST</th>
                <th className="py-3 px-4 text-right">Final Amount</th>
                <th className="py-3 px-4 text-center">Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoadingHistory ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">Loading GST history...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">No saved GST calculations logged yet.</td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400">{formatDate(item.createdAt)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{formatCurrency(item.amount)}</td>
                    <td className="py-3 px-4 font-bold text-teal-400">{item.gstRate}%</td>
                    <td className="py-3 px-4"><Badge variant="info">{item.transactionType}</Badge></td>
                    <td className="py-3 px-4 text-right text-slate-300">
                      {item.transactionType === 'Intra-State' ? `${formatCurrency(item.cgst)} + ${formatCurrency(item.sgst)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">
                      {item.transactionType === 'Inter-State' ? formatCurrency(item.igst) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-teal-300">{formatCurrency(item.finalAmount)}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleExportPDF(item)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-teal-400"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* AI Explanation Modal */}
      <Modal
        isOpen={isExplanationModalOpen}
        onClose={() => setIsExplanationModalOpen(false)}
        title="Plain Language AI Explanation"
      >
        <div className="space-y-4 text-xs">
          {isExplaining ? (
            <div className="flex items-center space-x-2 text-teal-400 py-6">
              <Sparkles className="h-5 w-5 animate-spin" />
              <span>Consulting Chartered Accountant AI engine...</span>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 text-slate-200 leading-relaxed whitespace-pre-wrap">
              {explanation}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={() => setIsExplanationModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
