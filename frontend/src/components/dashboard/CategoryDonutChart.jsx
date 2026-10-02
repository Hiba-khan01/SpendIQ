import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { CATEGORIES } from '../../utils/constants';

const categoryColorMap = CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = cat.color;
  return acc;
}, {});

const DEFAULT_COLORS = ['#F97316', '#10B981', '#0EA5E9', '#EC4899', '#8B5CF6', '#EF4444', '#06B6D4', '#F59E0B', '#6366F1', '#3B82F6', '#64748B'];

const CustomTooltip = ({ active, payload, currency }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl border border-slate-700 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.fill }} />
          <span className="font-bold text-slate-100">{data.category}</span>
        </div>
        <p className="font-semibold text-emerald-400">{formatCurrency(data.amount, currency)}</p>
        <p className="text-[11px] text-slate-400">{data.percentage}% of total ({data.count} txns)</p>
      </div>
    );
  }
  return null;
};

export const CategoryDonutChart = ({ data = [], currency = 'INR', totalSpent = 0 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        No category data available for this period.
      </div>
    );
  }

  const chartData = data.map((item, index) => ({
    ...item,
    fill: categoryColorMap[item.category] || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      {/* Donut Chart */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={3}
              dataKey="amount"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Spent</span>
          <span className="text-base font-extrabold text-slate-900 tracking-tight">
            {formatCurrency(totalSpent, currency)}
          </span>
        </div>
      </div>

      {/* Category Breakdown Legend */}
      <div className="flex-1 grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1 w-full text-xs">
        {chartData.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
              <span className="font-medium text-slate-700 truncate">{item.category}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-bold text-slate-900">{formatCurrency(item.amount, currency)}</span>
              <span className="text-[11px] text-slate-400 w-10 text-right">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
