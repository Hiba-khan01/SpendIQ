import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EmptyState = ({
  icon: Icon = Sparkles,
  title = 'No records found',
  description = 'Start tracking to gain intelligent insights into your financial habits.',
  actionText,
  actionLink,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-white/60 border border-slate-200/80 rounded-2xl shadow-sm my-4">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
      
      {actionLink && actionText && (
        <Link
          to={actionLink}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-200"
        >
          {actionText}
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}

      {!actionLink && onAction && actionText && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-200"
        >
          {actionText}
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
