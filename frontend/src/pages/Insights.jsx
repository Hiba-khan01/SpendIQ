import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Zap,
  Info,
  Lightbulb,
} from 'lucide-react';
import { insightService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';

export const Insights = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [insights, setInsights] = useState([]);
  const [filter, setFilter] = useState('All'); // 'All', 'warning', 'savings', 'trend'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await insightService.getInsights();
      setInsights(data);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Could not load AI insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleGenerateFresh = async () => {
    setRefreshing(true);
    try {
      const fresh = await insightService.generateInsights();
      setInsights(fresh);
      toast({
        type: 'success',
        title: 'Insights Recalculated!',
        message: 'SpendIQ AI re-analyzed your latest transactions and budgets.',
      });
    } catch (err) {
      toast({
        type: 'error',
        title: 'Recalculation Failed',
        message: 'Could not regenerate insights.',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const filteredInsights = insights.filter((item) => {
    if (filter === 'All') return true;
    if (filter === 'warning') return item.severity === 'warning' || item.severity === 'high' || item.type === 'warning';
    if (filter === 'savings') return item.severity === 'success' || item.type === 'savings' || item.type === 'opportunity';
    if (filter === 'trend') return item.type === 'trend' || item.type === 'anomaly';
    return true;
  });

  const getSeverityStyle = (sev) => {
    if (sev === 'warning' || sev === 'high') {
      return {
        card: 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200',
        badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
      };
    }
    if (sev === 'success') {
      return {
        card: 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200',
        badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        icon: <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
      };
    }
    return {
      card: 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200/80 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200',
      badge: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      icon: <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />,
    };
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>AI Spending Insights</span>
            <span className="px-2 py-0.5 text-xs font-extrabold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg">
              Live Engine
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Personalized, data-backed observations computed from your verified transactions.
          </p>
        </div>

        <button
          onClick={handleGenerateFresh}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Recalculate AI Insights</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'All', label: `All Insights (${insights.length})` },
          { id: 'warning', label: 'Warnings & Limits' },
          { id: 'savings', label: 'Savings & Opportunities' },
          { id: 'trend', label: 'Patterns & Trends' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition ${
              filter === tab.id
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Insights Content */}
      {loading ? (
        <LoadingSpinner text="Computing personalized financial insights..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchInsights} />
      ) : filteredInsights.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No insights match this filter"
          description="Record more expenses or switch filter tabs to see observations."
          actionText="View All Insights"
          onAction={() => setFilter('All')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredInsights.map((item, idx) => {
            const style = getSeverityStyle(item.severity);
            return (
              <div
                key={item.id || idx}
                className={`p-5 sm:p-6 rounded-2xl border transition-all duration-200 hover:shadow-md ${style.card} flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-white/60 dark:border-slate-700 flex items-center justify-center shadow-xs">
                        {style.icon}
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
                        <span className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${style.badge}`}>
                          {item.type || 'observation'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 my-2">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Data Verified by SpendIQ</span>
                  <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">{item.severity} Severity</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
