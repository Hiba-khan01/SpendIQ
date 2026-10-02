import React from 'react';
import { Search, Filter, RotateCcw, ArrowUpDown } from 'lucide-react';
import { CATEGORIES, PAYMENT_METHODS } from '../../utils/constants';

export const ExpenseFilters = ({
  search,
  setSearch,
  category,
  setCategory,
  paymentMethod,
  setPaymentMethod,
  source,
  setSource,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onReset,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 mb-6 transition-colors">
      {/* Top row: Search input & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by merchant, description, or category..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs w-full sm:w-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="expense_date-desc" className="dark:bg-slate-800 text-slate-800 dark:text-slate-200">Newest Date First</option>
              <option value="expense_date-asc" className="dark:bg-slate-800 text-slate-800 dark:text-slate-200">Oldest Date First</option>
              <option value="amount-desc" className="dark:bg-slate-800 text-slate-800 dark:text-slate-200">Highest Amount</option>
              <option value="amount-asc" className="dark:bg-slate-800 text-slate-800 dark:text-slate-200">Lowest Amount</option>
              <option value="merchant-asc" className="dark:bg-slate-800 text-slate-800 dark:text-slate-200">Merchant (A to Z)</option>
            </select>
          </div>

          <button
            onClick={onReset}
            className="p-2 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            title="Reset Filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All" className="dark:bg-slate-800">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id} className="dark:bg-slate-800">{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All" className="dark:bg-slate-800">All Payment Methods</option>
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm} value={pm} className="dark:bg-slate-800">{pm}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All" className="dark:bg-slate-800">All Entry Sources</option>
            <option value="manual" className="dark:bg-slate-800">Manual Entry</option>
            <option value="natural_language" className="dark:bg-slate-800">Natural Language AI</option>
            <option value="receipt" className="dark:bg-slate-800">Receipt Scanner</option>
          </select>
        </div>
      </div>
    </div>
  );
};
