import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Receipt,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { reportService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatCard } from '../components/common/StatCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { AISummaryCard } from '../components/reports/AISummaryCard';
import { MoMComparisonTable } from '../components/reports/MoMComparisonTable';
import { CategoryDonutChart } from '../components/dashboard/CategoryDonutChart';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CATEGORIES } from '../utils/constants';

export const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async (force = false) => {
    if (force) setGenerating(true);
    else setLoading(true);
    setError(null);

    try {
      let data;
      if (force) {
        data = await reportService.generateReport(selectedMonth, selectedYear);
        toast({
          type: 'success',
          title: 'Report Regenerated',
          message: 'AI executive summary & statistics updated.',
        });
      } else {
        data = await reportService.getReport(selectedYear, selectedMonth);
      }
      setReport(data);
    } catch (err) {
      console.error('Error loading report:', err);
      setError('Could not generate or load monthly report. Please try again.');
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchReport(false);
  }, [selectedMonth, selectedYear]);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await reportService.downloadPdf(selectedYear, selectedMonth);
      toast({
        type: 'success',
        title: 'PDF Downloaded',
        message: `Saved SpendIQ Report for ${report?.month_name || selectedMonth} ${selectedYear}.`,
      });
    } catch (err) {
      toast({
        type: 'error',
        title: 'PDF Export Failed',
        message: 'Could not generate downloadable PDF report.',
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleMonthShift = (offset) => {
    let m = selectedMonth + offset;
    let y = selectedYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthLabel = `${monthNames[selectedMonth - 1]} ${selectedYear}`;
  const currency = user?.currency || 'INR';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Monthly Financial Report</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Executive AI summary, category shifts, budget performance, and downloadable report.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Navigator */}
          <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-xs">
            <button
              onClick={() => handleMonthShift(-1)}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[110px] text-center">
              {monthLabel}
            </span>
            <button
              onClick={() => handleMonthShift(1)}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => fetchReport(true)}
            disabled={generating || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl transition shadow-xs disabled:opacity-50"
            title="Regenerate AI Summary"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
            <span>Regenerate AI</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf || loading || !report}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 rounded-xl transition shadow-md shadow-slate-900/20 dark:shadow-none disabled:opacity-50"
          >
            {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-emerald-400" />}
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Compiling financial report and computing MoM metrics..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchReport(false)} />
      ) : !report ? null : (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
          {/* Overview StatCards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Income"
              value={report.total_income}
              currency={currency}
              variant="indigo"
            />
            <StatCard
              title="Total Expenses"
              value={report.total_expenses}
              currency={currency}
              change={report.mom_comparison?.overall_change_pct}
              changeLabel="vs prev month"
              variant="rose"
            />
            <StatCard
              title="Net Savings"
              value={report.total_savings}
              currency={currency}
              variant="emerald"
            />
            <StatCard
              title="Savings Rate"
              value={`${report.savings_rate}%`}
              isCurrency={false}
              variant="amber"
              changeLabel="Target: 20%+"
            />
          </div>

          {/* AI Executive Summary & Recommendations Card */}
          <AISummaryCard
            summaryText={report.report_text}
            recommendations={report.recommendations}
          />

          {/* Grid: Category Breakdown Donut + Month-over-Month Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Donut */}
            <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col justify-between transition-colors">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Category Spending Distribution</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Total portfolio distribution for {monthLabel}</p>
                <CategoryDonutChart
                  data={report.category_breakdown}
                  currency={currency}
                  totalSpent={report.total_expenses}
                />
              </div>
            </div>

            {/* MoM Shifts */}
            <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-card transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Month-over-Month Shifts</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Category spending changes compared to previous month</p>
                </div>
              </div>
              <MoMComparisonTable momData={report.mom_comparison} currency={currency} />
            </div>
          </div>

          {/* Bottom Grid: Budget Performance & Top Expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget Performance */}
            <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-card transition-colors">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Budget Performance & Compliance</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Tracking category utilization vs monthly limits</p>

              {report.budget_performance && report.budget_performance.length > 0 ? (
                <div className="space-y-3">
                  {report.budget_performance.map((b) => (
                    <div key={b.id || b.category} className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-100 dark:border-slate-700/60 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 dark:text-white">{b.category}</span>
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          b.status === 'over_budget' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400' :
                          b.status === 'near_limit' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400' :
                          'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                        }`}>
                          {b.status === 'over_budget' ? 'Over Budget' : b.status === 'near_limit' ? 'Near Limit' : 'Within Budget'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                        <span>{formatCurrency(b.spent, currency)} spent of {formatCurrency(b.monthly_limit, currency)}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{b.percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            b.percentage > 100 ? 'bg-rose-500' : b.percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(b.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  No budget limits were configured for this month.
                </div>
              )}
            </div>

            {/* Top 5 Largest Expenses */}
            <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-card transition-colors">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Top 5 Largest Transactions</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Highest individual expenses recorded in {monthLabel}</p>

              {report.top_expenses && report.top_expenses.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {report.top_expenses.map((tx, idx) => (
                    <div key={tx.id || idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{tx.merchant}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">{tx.category} • {formatDate(tx.expense_date)}</p>
                        </div>
                      </div>
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm shrink-0">
                        {formatCurrency(tx.amount, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  No individual transactions recorded for this period.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
