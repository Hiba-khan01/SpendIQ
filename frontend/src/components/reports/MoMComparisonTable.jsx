import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const MoMComparisonTable = ({ momData, currency = 'INR' }) => {
  if (!momData || !momData.category_changes || momData.category_changes.length === 0) {
    return (
      <div className="py-6 text-center text-slate-400 text-xs">
        No previous month data available for comparison.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
            <th className="py-3 px-4">Category</th>
            <th className="py-3 px-4">Current Month</th>
            <th className="py-3 px-4">Previous Month</th>
            <th className="py-3 px-4 text-right">MoM Shift</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {momData.category_changes.map((item, idx) => {
            const isUp = item.direction === 'up' && item.percentage_change > 0;
            const isDown = item.direction === 'down' && item.percentage_change < 0;

            return (
              <tr key={idx} className="hover:bg-slate-50/70 transition">
                <td className="py-3 px-4 font-bold text-slate-900">{item.category}</td>
                <td className="py-3 px-4 font-semibold text-slate-800">
                  {formatCurrency(item.current_amount, currency)}
                </td>
                <td className="py-3 px-4 text-slate-500">
                  {formatCurrency(item.previous_amount, currency)}
                </td>
                <td className="py-3 px-4 text-right font-bold">
                  {isUp ? (
                    <span className="inline-flex items-center gap-0.5 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md text-xs">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      +{item.percentage_change}%
                    </span>
                  ) : isDown ? (
                    <span className="inline-flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-xs">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      {item.percentage_change}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-xs">
                      <Minus className="w-3.5 h-3.5" />
                      0%
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
