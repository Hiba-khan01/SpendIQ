import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Receipt, Sparkles, ScanLine, CreditCard } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { CATEGORIES, SOURCE_BADGES } from '../../utils/constants';

export const RecentTransactionsList = ({ transactions = [], currency = 'INR' }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 text-sm">
        No recent transactions found.
      </div>
    );
  }

  const getCategoryClass = (catId) => {
    const cat = CATEGORIES.find((c) => c.id === catId);
    return cat ? `${cat.bg} ${cat.text} ${cat.border}` : 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const getSourceIcon = (source) => {
    if (source === 'natural_language') return <Sparkles className="w-3 h-3 text-indigo-500" />;
    if (source === 'receipt') return <ScanLine className="w-3 h-3 text-emerald-500" />;
    return <Receipt className="w-3 h-3 text-slate-400" />;
  };

  return (
    <div className="divide-y divide-slate-100">
      {transactions.slice(0, 6).map((tx) => {
        const sourceBadge = SOURCE_BADGES[tx.source] || SOURCE_BADGES.manual;
        return (
          <div key={tx.id} className="py-3 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl px-2 transition">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 shadow-xs">
                {tx.merchant ? tx.merchant.slice(0, 2).toUpperCase() : 'TX'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 truncate">{tx.merchant || 'General'}</p>
                  <span className={`hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-md border ${getCategoryClass(tx.category)}`}>
                    {tx.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span>{formatDate(tx.expense_date)}</span>
                  <span>•</span>
                  <span>{tx.payment_method || 'UPI'}</span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm font-extrabold text-slate-900">{formatCurrency(tx.amount, currency)}</p>
              <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 mt-0.5">
                {getSourceIcon(tx.source)}
                <span>{sourceBadge.label}</span>
              </div>
            </div>
          </div>
        );
      })}

      <div className="pt-3 text-center">
        <Link
          to="/expenses"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          View all transactions
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
