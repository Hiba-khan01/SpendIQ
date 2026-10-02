import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Percent,
  Plus,
  ScanLine,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyticsService, insightService, budgetService } from '../services';
import { StatCard } from '../components/common/StatCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { BudgetHealthGauge } from '../components/dashboard/BudgetHealthGauge';
import { SpendingTrendChart } from '../components/dashboard/SpendingTrendChart';
import { CategoryDonutChart } from '../components/dashboard/CategoryDonutChart';
import { RecentTransactionsList } from '../components/dashboard/RecentTransactionsList';
import { AIInsightsWidget } from '../components/dashboard/AIInsightsWidget';
import { ExpenseModal } from '../components/expenses/ExpenseModal';
import { expenseService } from '../services/expenseService';

export const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [trends, setTrends] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [refreshingInsights, setRefreshingInsights] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, catsRes, trendsRes, healthRes, insightsRes, expRes] = await Promise.all([
        analyticsService.getSummary(),
        analyticsService.getCategories(),
        analyticsService.getTrends(),
        budgetService.getBudgetHealth(),
        insightService.getInsights(),
        expenseService.getExpenses({ limit: 6, sort_by: 'expense_date', sort_order: 'desc' }),
      ]);

      setSummary(summaryRes);
      setCategories(catsRes);
      setTrends(trendsRes);
      setHealthData(healthRes);
      setInsights(insightsRes);
      setRecentTransactions(expRes.items || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Unable to load your dashboard data. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefreshInsights = async () => {
    setRefreshingInsights(true);
    try {
      const fresh = await insightService.generateInsights();
      setInsights(fresh);
    } catch (e) {
      console.error('Failed to refresh insights:', e);
    } finally {
      setRefreshingInsights(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Analyzing your financial portfolio..." size="lg" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboardData} />;
  }

  const currency = user?.currency || 'INR';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Good day, {user?.name || 'Investor'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Here is your spending intelligence and budget performance overview.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/expenses/scan"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition shadow-xs"
          >
            <ScanLine className="w-4 h-4 text-cyan-500" />
            <span>Scan Receipt</span>
          </Link>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Monthly Income"
          value={summary?.total_income || 0}
          currency={currency}
          icon={Wallet}
          variant="indigo"
        />
        <StatCard
          title="Total Spent"
          value={summary?.total_expenses || 0}
          currency={currency}
          icon={ArrowUpRight}
          variant="rose"
        />
        <StatCard
          title="Net Savings"
          value={summary?.total_savings || 0}
          currency={currency}
          icon={PiggyBank}
          variant="emerald"
        />
        <StatCard
          title="Savings Rate"
          value={`${summary?.savings_rate || 0}%`}
          isCurrency={false}
          icon={Percent}
          variant="amber"
          changeLabel="Target: 20%+"
        />
      </div>

      {/* Signature Feature: Budget Health Score */}
      <BudgetHealthGauge healthData={healthData} />

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Trend Area Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Spending & Savings Trends</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Monthly income vs expenses comparison</p>
            </div>
          </div>
          <SpendingTrendChart data={trends?.monthly_history || []} currency={currency} />
        </div>

        {/* Category Breakdown Donut Chart (1 col) */}
        <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">Category Breakdown</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4">Spending allocation this month</p>
            <CategoryDonutChart
              data={categories}
              currency={currency}
              totalSpent={summary?.total_expenses || 0}
              layout="vertical"
            />
          </div>
        </div>
      </div>

      {/* Bottom Grid: AI Insights Widget + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights Widget */}
        <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-card">
          <AIInsightsWidget
            insights={insights}
            onRefresh={handleRefreshInsights}
            refreshing={refreshingInsights}
          />
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Latest activity across payment methods</p>
            </div>
            <Link
              to="/expenses/add"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + Quick Add
            </Link>
          </div>
          <RecentTransactionsList transactions={recentTransactions} currency={currency} />
        </div>
      </div>

      {/* Quick Add Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSaved={fetchDashboardData}
        currency={currency}
      />
    </div>
  );
};
