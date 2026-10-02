import React from 'react';
import { Edit2, Trash2, AlertTriangle, CheckCircle2, AlertOctagon } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { CATEGORIES } from '../../utils/constants';

export const BudgetCard = ({
  budget,
  currency = 'INR',
  onEdit,
  onDelete,
}) => {
  if (!budget) return null;

  const cat = CATEGORIES.find((c) => c.id === budget.category);
  const spent = budget.spent || 0;
  const limit = budget.monthly_limit || 0;
  const remaining = Math.max(0, limit - spent);
  const percentage = budget.percentage || Math.round((spent / limit) * 100);
  const isOver = spent > limit;
  const isWarning = percentage >= 80 && !isOver;

  let progressColor = 'bg-emerald-500';
  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let badgeText = 'On Track';
  let Icon = CheckCircle2;

  if (isOver) {
    progressColor = 'bg-rose-500';
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    badgeText = 'Over Budget';
    Icon = AlertOctagon;
  } else if (isWarning) {
    progressColor = 'bg-amber-500';
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    badgeText = 'Near Limit';
    Icon = AlertTriangle;
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
              style={{
                backgroundColor: cat ? `${cat.color}15` : '#F1F5F9',
                color: cat ? cat.color : '#475569',
              }}
            >
              {budget.category ? budget.category.slice(0, 2).toUpperCase() : 'BG'}
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{budget.category}</h4>
              <p className="text-[11px] text-slate-400">Monthly Allocation</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${badgeColor}`}>
              <Icon className="w-3 h-3" />
              <span>{badgeText}</span>
            </span>
          </div>
        </div>

        {/* Progress Numbers */}
        <div className="my-3">
          <div className="flex items-baseline justify-between text-xs mb-1.5">
            <span className="text-slate-500">
              Spent <strong className="text-slate-900 font-bold">{formatCurrency(spent, currency)}</strong>
            </span>
            <span className="text-slate-500">
              Limit <strong className="text-slate-700 font-semibold">{formatCurrency(limit, currency)}</strong>
            </span>
          </div>

          {/* Visual Progress Bar */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${progressColor} transition-all duration-500 rounded-full`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Details & Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-1">
        <div>
          {isOver ? (
            <span className="text-rose-600 font-bold">
              +{formatCurrency(spent - limit, currency)} over
            </span>
          ) : (
            <span className="text-slate-600 font-medium">
              <strong className="text-emerald-600 font-bold">{formatCurrency(remaining, currency)}</strong> left ({100 - percentage}%)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(budget)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
            title="Edit Budget Limit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(budget.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Delete Budget"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
