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
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
      glow: '',
    },
    indigo: {
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      glow: 'hover:border-indigo-200',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      glow: 'hover:border-emerald-200',
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      glow: 'hover:border-rose-200',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      glow: 'hover:border-amber-200',
    },
  };

  const style = variantStyles[variant] || variantStyles.default;
  const displayValue = isCurrency ? formatCurrency(value, currency) : value;

  return (
    <div className={`bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-200 ${style.glow} flex flex-col justify-between`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{displayValue}</h3>
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-xs ${style.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {change !== undefined && change !== null && (
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-100 text-xs">
          {change > 0 ? (
            <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              <TrendingUp className="w-3.5 h-3.5" />
              +{change}%
            </span>
          ) : change < 0 ? (
            <span className="inline-flex items-center gap-0.5 font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
              <TrendingDown className="w-3.5 h-3.5" />
              {change}%
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
              <Minus className="w-3.5 h-3.5" />
              0%
            </span>
          )}
          <span className="text-slate-400">{changeLabel}</span>
        </div>
      )}
    </div>
  );
};
