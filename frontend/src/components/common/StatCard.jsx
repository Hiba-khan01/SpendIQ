import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const StatCard = ({
  title,
  value,
  currency = 'INR',
  isCurrency = true,
  change,
  changeLabel = 'vs last month',
  icon: Icon,
  variant = 'default', // 'emerald', 'indigo', 'rose', 'amber', 'default'
}) => {
  const variantStyles = {
    default: {
      iconBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      glow: '',
    },
    indigo: {
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40',
      glow: 'hover:border-indigo-200 dark:hover:border-indigo-800',
    },
    emerald: {
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40',
      glow: 'hover:border-emerald-200 dark:hover:border-emerald-800',
    },
    rose: {
      iconBg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40',
      glow: 'hover:border-rose-200 dark:hover:border-rose-800',
    },
    amber: {
      iconBg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40',
      glow: 'hover:border-amber-200 dark:hover:border-amber-800',
    },
  };

  const style = variantStyles[variant] || variantStyles.default;
  const displayValue = isCurrency ? formatCurrency(value, currency) : value;

  return (
    <div className={`bg-white dark:bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-card hover:shadow-card-hover transition-all duration-200 ${style.glow} flex flex-col justify-between`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{displayValue}</h3>
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-xs ${style.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {change !== undefined && change !== null && (
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          {change > 0 ? (
            <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-md">
              <TrendingUp className="w-3.5 h-3.5" />
              +{change}%
            </span>
          ) : change < 0 ? (
            <span className="inline-flex items-center gap-0.5 font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded-md">
              <TrendingDown className="w-3.5 h-3.5" />
              {change}%
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
              <Minus className="w-3.5 h-3.5" />
              0%
            </span>
          )}
          <span className="text-slate-400 dark:text-slate-500">{changeLabel}</span>
        </div>
      )}
    </div>
  );
};
