import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { CATEGORIES } from '../../utils/constants';

const categoryColorMap = CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = cat.color;
  acc[cat.name] = cat.color;
  return acc;
}, {});

const DEFAULT_COLORS = ['#F97316', '#EF4444', '#64748B', '#10B981', '#0EA5E9', '#EC4899', '#8B5CF6', '#06B6D4', '#F59E0B', '#6366F1', '#3B82F6'];

const CustomTooltip = ({ active, payload, currency }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 dark:bg-slate-950 text-white p-3 rounded-xl shadow-xl border border-slate-700 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.fill }} />
          <span className="font-bold text-slate-100">{data.category || 'Other'}</span>
        </div>
        <p className="font-semibold text-cyan-400">{formatCurrency(data.amount, currency)}</p>
        <p className="text-[11px] text-slate-400">{data.percentage}% of total {data.count ? `(${data.count} txns)` : ''}</p>
      </div>
    );
  }
  return null;
};

export const CategoryDonutChart = ({
  data = [],
  currency = 'INR',
  totalSpent = 0,
  layout = 'auto', // 'auto' | 'vertical' | 'horizontal'
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
        No category data available for this period.
      </div>
    );
  }

  const chartData = data.map((item, index) => ({
    ...item,
    category: item.category || 'Other',
    fill: categoryColorMap[item.category] || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  const containerClasses =
    layout === 'vertical'
      ? 'flex flex-col items-center gap-4 w-full'
      : layout === 'horizontal'
      ? 'flex flex-col sm:flex-row items-center justify-between gap-5 w-full'
      : 'flex flex-col xl:flex-row items-center justify-between gap-5 w-full';

  return (
    <div className={containerClasses}>
      {/* Donut Chart */}
      <div className="relative w-36 h-36 sm:w-40 sm:h-40 shrink-0 mx-auto">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={46}
              outerRadius={66}
              paddingAngle={3}
              dataKey="amount"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
          <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
            Total Spent
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(totalSpent, currency)}
          </span>
        </div>
      </div>

      {/* Category Breakdown Legend */}
      <div className="flex-1 w-full space-y-1.5 max-h-56 overflow-y-auto pr-0.5 text-xs">
        {chartData.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800/70 transition gap-2"
          >
            {/* Category label and color dot */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: item.fill }}
              />
              <span className="font-semibold text-slate-800 dark:text-slate-100 truncate text-xs">
                {item.category}
              </span>
            </div>

            {/* Amount and Percentage */}
            <div className="flex items-center gap-1.5 shrink-0 text-right">
              <span className="font-bold text-slate-900 dark:text-white text-xs">
                {formatCurrency(item.amount, currency)}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/60 px-1.5 py-0.5 rounded-md text-right shrink-0">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
