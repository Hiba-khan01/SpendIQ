import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, TrendingUp, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export const AIInsightsWidget = ({ insights = [], onRefresh, refreshing = false }) => {
  if (!insights || insights.length === 0) {
    return (
      <div className="py-6 text-center text-slate-400 text-xs">
        No active spending insights yet.
      </div>
    );
  }

  const getSeverityStyle = (sev) => {
    if (sev === 'warning' || sev === 'high') {
      return {
        card: 'bg-amber-50/70 border-amber-200/80 text-amber-900',
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
      };
    }
    if (sev === 'success') {
      return {
        card: 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
      };
    }
    return {
      card: 'bg-indigo-50/70 border-indigo-200/80 text-indigo-900',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      icon: <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
    };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>AI Spending Observations</span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition disabled:opacity-50"
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
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          View all insights & recommendations
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
