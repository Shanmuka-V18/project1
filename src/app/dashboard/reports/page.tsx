'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Download, TrendingUp, TrendingDown, Calendar, Archive, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export default function ReportsPage() {
  const [period, setPeriod] = useState('this-month');
  const [pnlData, setPnlData] = useState<any>(null);
  const [archiveData, setArchiveData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPnL();
    fetchArchive();
  }, [period]);

  const fetchPnL = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reports/pnl?period=${period}`);
      const data = await res.json();
      setPnlData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchArchive = async () => {
    try {
      const res = await fetch('/api/reports/monthly-summary');
      const data = await res.json();
      if (data.archivedSummaries) setArchiveData(data.archivedSummaries);
    } catch (e) {
      console.error(e);
    }
  };

  const exportPnLPDF = async () => {
    if (!pnlData) return;
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 700]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const primaryColor = rgb(0.05, 0.58, 0.53);
    const darkColor = rgb(0.06, 0.09, 0.16);

    let y = 650;
    page.drawText('PROFIT & LOSS STATEMENT', { x: 40, y, size: 18, font: fontBold, color: primaryColor });
    page.drawText(`Period: ${period.toUpperCase()}`, { x: 420, y, size: 10, font, color: rgb(0.4, 0.45, 0.55) });

    y -= 30;
    page.drawLine({ start: { x: 40, y }, end: { x: 560, y }, thickness: 1, color: rgb(0.85, 0.88, 0.92) });

    y -= 30;
    page.drawText('REVENUE / INFLOWS', { x: 40, y, size: 12, font: fontBold, color: darkColor });
    y -= 20;
    pnlData.revenueByCategory?.forEach((r: any) => {
      page.drawText(r.category, { x: 50, y, size: 10, font, color: darkColor });
      page.drawText(formatCurrency(r.amount), { x: 450, y, size: 10, font, color: darkColor });
      y -= 18;
    });

    y -= 10;
    page.drawText('TOTAL REVENUE:', { x: 40, y, size: 11, font: fontBold, color: darkColor });
    page.drawText(formatCurrency(pnlData.totalRevenue), { x: 450, y, size: 11, font: fontBold, color: primaryColor });

    y -= 35;
    page.drawText('OPERATING EXPENSES', { x: 40, y, size: 12, font: fontBold, color: darkColor });
    y -= 20;
    pnlData.expenseByCategory?.forEach((e: any) => {
      page.drawText(e.category, { x: 50, y, size: 10, font, color: darkColor });
      page.drawText(formatCurrency(e.amount), { x: 450, y, size: 10, font, color: darkColor });
      y -= 18;
    });

    y -= 10;
    page.drawText('TOTAL OPERATING EXPENSES:', { x: 40, y, size: 11, font: fontBold, color: darkColor });
    page.drawText(formatCurrency(pnlData.totalExpense), { x: 450, y, size: 11, font: fontBold, color: rgb(0.9, 0.25, 0.25) });

    y -= 40;
    page.drawRectangle({ x: 40, y: y - 5, width: 520, height: 35, color: rgb(0.9, 0.97, 0.96) });
    page.drawText('NET OPERATING PROFIT:', { x: 50, y: y + 8, size: 12, font: fontBold, color: primaryColor });
    page.drawText(formatCurrency(pnlData.netProfit), { x: 450, y: y + 8, size: 14, font: fontBold, color: primaryColor });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `PnL_Statement_${period}.pdf`;
    link.click();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Profit & Loss Reports</h1>
          <p className="text-xs text-slate-400 mt-1">Automated financial statements, category variance, and archived monthly summaries</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-200 focus:border-teal-500"
          >
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="year">Year to Date</option>
          </select>
          <Button onClick={exportPnLPDF} variant="secondary">
            <Download className="mr-2 h-4 w-4 text-teal-400" /> Export PDF Report
          </Button>
        </div>
      </div>

      {/* P&L Statement Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-100 text-sm flex items-center text-teal-400">
              <FileText className="mr-2 h-4 w-4" /> Statement of Profit & Loss
            </h3>
            <Badge variant="info">{period.toUpperCase()}</Badge>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Calculating P&L statement...</div>
          ) : pnlData && (
            <div className="space-y-6 text-xs">
              {/* Revenue Group */}
              <div>
                <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wider mb-2">1. Operating Revenue</h4>
                <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  {pnlData.revenueByCategory?.map((r: any, i: number) => (
                    <div key={i} className="flex justify-between text-slate-300 py-0.5">
                      <span>{r.category}</span>
                      <span className="font-mono">{formatCurrency(r.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-emerald-300 text-sm">
                    <span>Total Revenue</span>
                    <span>{formatCurrency(pnlData.totalRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Expense Group */}
              <div>
                <h4 className="font-bold text-rose-400 text-xs uppercase tracking-wider mb-2">2. Operating Expenses</h4>
                <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  {pnlData.expenseByCategory?.map((e: any, i: number) => (
                    <div key={i} className="flex justify-between text-slate-300 py-0.5">
                      <span>{e.category}</span>
                      <span className="font-mono">{formatCurrency(e.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-rose-400 text-sm">
                    <span>Total Expenses</span>
                    <span>{formatCurrency(pnlData.totalExpense)}</span>
                  </div>
                </div>
              </div>

              {/* Net Profit Summary */}
              <div className="rounded-2xl bg-teal-950/40 p-4 border border-teal-500/40 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-100 text-sm block">Net Operating Profit</span>
                  <span className="text-[11px] text-teal-400 font-medium">Profit Margin: {pnlData.profitMargin}%</span>
                </div>
                <span className={`text-2xl font-extrabold ${pnlData.netProfit >= 0 ? 'text-teal-300' : 'text-rose-400'}`}>
                  {formatCurrency(pnlData.netProfit)}
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Period-Over-Period Comparison Sidebar */}
        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-slate-100 text-sm flex items-center text-teal-400 border-b border-slate-800 pb-3">
            <TrendingUp className="mr-2 h-4 w-4" /> Period Comparison
          </h3>

          {pnlData?.comparison && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                <span className="text-slate-400 block mb-1">Previous Period Net Profit:</span>
                <span className="text-base font-bold text-slate-200">{formatCurrency(pnlData.comparison.prevNetProfit)}</span>
              </div>

              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                <span className="text-slate-400 block mb-1">Revenue Growth Variance:</span>
                <span className={`text-sm font-bold flex items-center ${parseFloat(pnlData.comparison.revenueGrowth) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {pnlData.comparison.revenueGrowth}%
                </span>
              </div>

              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                <span className="text-slate-400 block mb-1">Net Profit Growth Variance:</span>
                <span className={`text-sm font-bold flex items-center ${parseFloat(pnlData.comparison.profitGrowth) >= 0 ? 'text-teal-300' : 'text-rose-400'}`}>
                  {pnlData.comparison.profitGrowth}%
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Monthly Archived History List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Archive className="mr-2 h-4 w-4 text-teal-400" /> Archived Monthly Financial Summaries
          </CardTitle>
          <CardDescription>Archived monthly records for quick audit</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Month</th>
                <th className="py-3 px-4 text-right">Income</th>
                <th className="py-3 px-4 text-right">Expenses</th>
                <th className="py-3 px-4 text-right">Net Savings</th>
                <th className="py-3 px-4 text-center">Savings Rate</th>
                <th className="py-3 px-4 text-center">Health Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {archiveData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-100">{item.monthLabel}</td>
                  <td className="py-3.5 px-4 text-right text-emerald-400 font-semibold">{formatCurrency(item.totalIncome)}</td>
                  <td className="py-3.5 px-4 text-right text-rose-400 font-semibold">{formatCurrency(item.totalExpense)}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-teal-300">{formatCurrency(item.netSavings)}</td>
                  <td className="py-3.5 px-4 text-center"><Badge variant="info">{item.savingsRate}%</Badge></td>
                  <td className="py-3.5 px-4 text-center font-bold text-amber-300">{item.healthScore}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
