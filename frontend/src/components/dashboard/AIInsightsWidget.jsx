import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export const AIInsightsWidget = ({ insights = [], onRefresh, refreshing = false }) => {
  if (!insights || insights.length === 0) {
    return (
      <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
        No active spending insights yet.
      </div>
    );
  }

  const getSeverityStyle = (sev) => {
    if (sev === 'warning' || sev === 'high') {
      return {
        card: 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/50 text-amber-900 dark:text-amber-200',
        badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
      };
    }
    if (sev === 'success') {
      return {
        card: 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200',
        badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        icon: <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
      };
    }
    return {
      card: 'bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-200/80 dark:border-cyan-800/50 text-cyan-900 dark:text-cyan-200',
      badge: 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
      icon: <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
    };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
          <span>AI Spending Observations</span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition disabled:opacity-50"
            title="Recalculate AI insights"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {insights.slice(0, 3).map((item, idx) => {
          const style = getSeverityStyle(item.severity);
          return (
            <div
              key={item.id || idx}
              className={`p-3.5 rounded-xl border transition-all duration-150 ${style.card}`}
            >
              <div className="flex items-start gap-2.5">
                {style.icon}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-xs font-bold truncate">{item.title}</h4>
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border ${style.badge}`}>
                      {item.type || 'insight'}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{item.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 text-center">
        <Link
          to="/insights"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          View all insights & recommendations
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
