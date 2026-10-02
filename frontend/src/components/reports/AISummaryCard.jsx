import React from 'react';
import { Sparkles, CheckCircle, Lightbulb } from 'lucide-react';

export const AISummaryCard = ({ summaryText, recommendations = [] }) => {
  return (
    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-700/50">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white">AI Financial Executive Summary</h3>
          <p className="text-xs text-indigo-200/70">Generated based on verified monthly transactions</p>
        </div>
      </div>

      {/* Summary Narrative */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-xs sm:text-sm text-slate-100 leading-relaxed mb-6 font-normal">
        {summaryText || 'Your spending across categories was tracked accurately for this monthly reporting period.'}
      </div>

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Lightbulb className="w-4 h-4" />
            <span>Personalized Actionable Recommendations</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
