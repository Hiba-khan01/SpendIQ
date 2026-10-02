import React from 'react';
import { Edit2, Trash2, Sparkles, ScanLine, Receipt, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { CATEGORIES, SOURCE_BADGES } from '../../utils/constants';

export const ExpenseTable = ({
  expenses = [],
  currency = 'INR',
  onEdit,
  onDelete,
  page = 1,
  pages = 1,
  total = 0,
  onPageChange,
}) => {
  if (!expenses || expenses.length === 0) {
    return null;
  }

  const getCategoryClass = (catId) => {
    const cat = CATEGORIES.find((c) => c.id === catId);
    return cat ? `${cat.bg} ${cat.text} ${cat.border}` : 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const getSourceIcon = (src) => {
    if (src === 'natural_language') return <Sparkles className="w-3.5 h-3.5 text-indigo-600" />;
    if (src === 'receipt') return <ScanLine className="w-3.5 h-3.5 text-emerald-600" />;
    return <Receipt className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4 sm:px-6">Merchant & Details</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Payment Method</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Source</th>
              <th className="py-3.5 px-4 text-right">Amount</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
            {expenses.map((tx) => {
              const sourceBadge = SOURCE_BADGES[tx.source] || SOURCE_BADGES.manual;
              return (
                <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group">
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs shrink-0">
                        {tx.merchant ? tx.merchant.slice(0, 2).toUpperCase() : 'TX'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{tx.merchant}</p>
                        {tx.description && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs">{tx.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg border ${getCategoryClass(tx.category)}`}>
                      {tx.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                    {tx.payment_method || 'UPI'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {formatDate(tx.expense_date)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-md border ${sourceBadge.bg} ${sourceBadge.text} ${sourceBadge.border}`}>
                      {getSourceIcon(tx.source)}
                      <span>{sourceBadge.label}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                    {formatCurrency(tx.amount, currency)}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(tx)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition"
                        title="Edit Expense"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(tx.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
        {expenses.map((tx) => {
          const sourceBadge = SOURCE_BADGES[tx.source] || SOURCE_BADGES.manual;
          return (
            <div key={tx.id} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs shrink-0">
                    {tx.merchant ? tx.merchant.slice(0, 2).toUpperCase() : 'TX'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{tx.merchant}</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(tx.expense_date)} • {tx.payment_method}</p>
                  </div>
                </div>
                <p className="font-extrabold text-slate-900 dark:text-white text-base">{formatCurrency(tx.amount, currency)}</p>
              </div>

              {tx.description && <p className="text-xs text-slate-500 dark:text-slate-400 pl-1">{tx.description}</p>}

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border ${getCategoryClass(tx.category)}`}>
                    {tx.category}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-md border ${sourceBadge.bg} ${sourceBadge.text} ${sourceBadge.border}`}>
                    {getSourceIcon(tx.source)}
                    <span>{sourceBadge.label}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(tx)}
                    className="p-1 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 rounded-md"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(tx.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      {pages > 1 && (
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{(page - 1) * 20 + 1}</span> to{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.min(page * 20, total)}</span> of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{total}</span> records
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-semibold text-slate-700 dark:text-slate-200">
              {page} / {pages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
