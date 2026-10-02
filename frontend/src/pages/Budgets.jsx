import React, { useState, useEffect } from 'react';
import { Plus, PieChart, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { budgetService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BudgetCard } from '../components/budgets/BudgetCard';
import { BudgetModal } from '../components/budgets/BudgetModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { formatCurrency } from '../utils/formatters';

export const Budgets = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const today = new Date();
  const [activeMonth, setActiveMonth] = useState(today.getMonth() + 1);
  const [activeYear, setActiveYear] = useState(today.getFullYear());

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);

  const fetchBudgets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await budgetService.getBudgets(activeMonth, activeYear);
      setBudgets(data);
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError('Could not load monthly budgets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [activeMonth, activeYear]);

  const handleEdit = (b) => {
    setSelectedBudget(b);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category budget limit?')) return;
    try {
      await budgetService.deleteBudget(id);
      toast({
        type: 'success',
        title: 'Budget Removed',
        message: 'The category budget has been deleted.',
      });
      fetchBudgets();
    } catch (err) {
      toast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Could not delete category budget.',
      });
    }
  };

  const handleMonthChange = (offset) => {
    let newM = activeMonth + offset;
    let newY = activeYear;
    if (newM < 1) {
      newM = 12;
      newY -= 1;
    } else if (newM > 12) {
      newM = 1;
      newY += 1;
    }
    setActiveMonth(newM);
    setActiveYear(newY);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthLabel = `${monthNames[activeMonth - 1]} ${activeYear}`;

  const totalLimit = budgets.reduce((acc, b) => acc + (b.monthly_limit || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + (b.spent || 0), 0);
  const totalRemaining = Math.max(0, totalLimit - totalSpent);
  const overallUtilization = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  const currency = user?.currency || 'INR';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Monthly Budgets</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Set and monitor category limits to stay financially disciplined.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Selector Carousel */}
          <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-xs">
            <button
              onClick={() => handleMonthChange(-1)}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[110px] text-center">
              {monthLabel}
            </span>
            <button
              onClick={() => handleMonthChange(1)}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedBudget(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-200 dark:shadow-none"
          >
            <Plus className="w-4 h-4" />
            <span>Set Budget</span>
          </button>
        </div>
      </div>

      {/* Overall Budget Utilization Banner */}
      {budgets.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                Monthly Budget Summary • {monthLabel}
              </span>
              <div className="flex items-baseline gap-3 mt-1.5">
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {formatCurrency(totalSpent, currency)}
                </h3>
                <span className="text-xs sm:text-sm text-slate-400 font-medium">
                  allocated limit: {formatCurrency(totalLimit, currency)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-400">Remaining Cushion</span>
                <p className="text-lg font-extrabold text-emerald-400">{formatCurrency(totalRemaining, currency)}</p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-400">Total Utilization</span>
                <p className={`text-lg font-extrabold ${overallUtilization > 100 ? 'text-rose-400' : overallUtilization >= 80 ? 'text-amber-400' : 'text-indigo-400'}`}>
                  {overallUtilization}%
                </p>
              </div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="mt-5 w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-700 rounded-full ${
                overallUtilization > 100 ? 'bg-rose-500' : overallUtilization >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(overallUtilization, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Budgets Grid */}
      {loading ? (
        <LoadingSpinner text="Loading your monthly budgets..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchBudgets} />
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title={`No budgets set for ${monthLabel}`}
          description="Create category budgets to gain spending visibility, automated overage warnings, and healthy financial scores."
          actionText="Set First Category Budget"
          onAction={() => {
            setSelectedBudget(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              currency={currency}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBudget(null);
        }}
        budgetToEdit={selectedBudget}
        activeMonth={activeMonth}
        activeYear={activeYear}
        onSaved={fetchBudgets}
        currency={currency}
      />
    </div>
  );
};
