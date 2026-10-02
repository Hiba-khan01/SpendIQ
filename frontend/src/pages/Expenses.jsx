import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ScanLine, Sparkles, Receipt, Trash2 } from 'lucide-react';
import { expenseService } from '../services/expenseService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ExpenseTable } from '../components/expenses/ExpenseTable';
import { ExpenseFilters } from '../components/expenses/ExpenseFilters';
import { ExpenseModal } from '../components/expenses/ExpenseModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Modal } from '../components/common/Modal';

export const Expenses = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState('All');
  const [source, setSource] = useState('All');
  const [sortBy, setSortBy] = useState('expense_date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 20,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (search && search.trim()) params.search = search.trim();
      if (category && category !== 'All') params.category = category;
      if (paymentMethod && paymentMethod !== 'All') params.payment_method = paymentMethod;
      if (source && source !== 'All') params.source = source;

      const data = await expenseService.getExpenses(params);
      setExpenses(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Could not load expenses. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [page, category, paymentMethod, source, sortBy, sortOrder]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchExpenses();
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setPaymentMethod('All');
    setSource('All');
    setSortBy('expense_date');
    setSortOrder('desc');
    setPage(1);
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  const handleDeletePrompt = (id) => {
    setDeleteExpenseId(id);
  };

  const confirmDelete = async () => {
    if (!deleteExpenseId) return;
    setDeleting(true);
    try {
      await expenseService.deleteExpense(deleteExpenseId);
      toast({
        type: 'success',
        title: 'Expense Deleted',
        message: 'The transaction record has been removed.',
      });
      setDeleteExpenseId(null);
      fetchExpenses();
    } catch (err) {
      toast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Could not delete transaction.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const currency = user?.currency || 'INR';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Expense History</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage, filter, and analyze all your recorded personal expenses ({total} total).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/expenses/scan"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl transition shadow-xs"
          >
            <ScanLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Scan Receipt</span>
          </Link>

          <Link
            to="/expenses/add"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl transition shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>AI Natural Entry</span>
          </Link>

          <button
            onClick={() => {
              setSelectedExpense(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-200 dark:shadow-none"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <ExpenseFilters
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={(c) => {
          setCategory(c);
          setPage(1);
        }}
        paymentMethod={paymentMethod}
        setPaymentMethod={(pm) => {
          setPaymentMethod(pm);
          setPage(1);
        }}
        source={source}
        setSource={(s) => {
          setSource(s);
          setPage(1);
        }}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onReset={handleResetFilters}
      />

      {/* Expense Content */}
      {loading ? (
        <LoadingSpinner text="Fetching transactions..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchExpenses} />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No expenses found"
          description="We couldn't find any expenses matching your active filter criteria. Try clearing search filters or adding a new expense."
          actionText="Add New Expense"
          onAction={() => {
            setSelectedExpense(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <ExpenseTable
          expenses={expenses}
          currency={currency}
          page={page}
          pages={pages}
          total={total}
          onPageChange={(newPage) => setPage(newPage)}
          onEdit={handleEdit}
          onDelete={handleDeletePrompt}
        />
      )}

      {/* Add / Edit Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedExpense(null);
        }}
        expenseToEdit={selectedExpense}
        onSaved={fetchExpenses}
        currency={currency}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteExpenseId}
        onClose={() => setDeleteExpenseId(null)}
        title="Confirm Deletion"
        subtitle="This action cannot be undone"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to delete this expense record? Your budget and monthly analytics will update automatically.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteExpenseId(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md shadow-rose-200 dark:shadow-none inline-flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleting ? 'Deleting...' : 'Delete Expense'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
