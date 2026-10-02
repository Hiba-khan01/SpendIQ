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
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4 mb-6">
      {/* Top row: Search input & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by merchant, description, or category..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-full sm:w-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="expense_date-desc">Newest Date First</option>
              <option value="expense_date-asc">Oldest Date First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
              <option value="merchant-asc">Merchant (A to Z)</option>
            </select>
          </div>

          <button
            onClick={onReset}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
            title="Reset Filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Payment Methods</option>
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm} value={pm}>{pm}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Entry Sources</option>
            <option value="manual">Manual Entry</option>
            <option value="natural_language">Natural Language AI</option>
            <option value="receipt">Receipt Scanner</option>
          </select>
        </div>
      </div>
    </div>
  );
};
