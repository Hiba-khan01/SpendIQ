import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2, ChevronDown, ChevronUp, Info } from 'lucide-react';

export const BudgetHealthGauge = ({ healthData }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!healthData) return null;

  const score = healthData.score || 0;
  const status = healthData.status || 'Moderate';
  const reasons = healthData.reasons || [];
  const factors = healthData.factors || [];

  // Determine colors based on status
  let statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  let strokeColor = '#10B981';
  let Icon = ShieldCheck;

  if (status === 'Critical') {
    statusColor = 'text-rose-600 bg-rose-50 border-rose-200';
    strokeColor = '#EF4444';
    Icon = AlertOctagon;
  } else if (status === 'Warning') {
    statusColor = 'text-amber-600 bg-amber-50 border-amber-200';
    strokeColor = '#F59E0B';
    Icon = AlertTriangle;
  } else if (status === 'Moderate') {
    statusColor = 'text-sky-600 bg-sky-50 border-sky-200';
    strokeColor = '#0EA5E9';
    Icon = CheckCircle2;
  }

  // Circular gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Budget Health Score</h3>
            <p className="text-[11px] text-slate-400">Algorithmic financial discipline index</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${statusColor}`}>
          {status}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 my-2">
        {/* SVG Circular Gauge */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="#F1F5F9"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke={strokeColor}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{score}</span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">/ 100</span>
          </div>
        </div>

        {/* Reasons Checklist */}
        <div className="flex-1 space-y-2 w-full">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Key Factors & Observations</p>
          {reasons.slice(0, 4).map((r, idx) => {
            const isNegative = r.toLowerCase().includes('exceed') || r.toLowerCase().includes('low') || r.toLowerCase().includes('critical');
            const isWarning = r.toLowerCase().includes('approach') || r.toLowerCase().includes('moderate');
            return (
              <div key={idx} className="flex items-start gap-2 text-xs">
                {isNegative ? (
                  <span className="text-rose-500 font-bold mt-0.5">✕</span>
                ) : isWarning ? (
                  <span className="text-amber-500 font-bold mt-0.5">⚠</span>
                ) : (
                  <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                )}
                <span className={`leading-relaxed ${isNegative ? 'text-rose-700' : isWarning ? 'text-amber-700' : 'text-slate-700'}`}>
                  {r}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Factor Breakdown Toggle */}
      {factors.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-700 py-1"
          >
            <span>{showDetails ? 'Hide Detailed Scoring Factors' : 'View Scoring Factors Breakdown'}</span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDetails && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 animate-in fade-in duration-150">
              {factors.map((f, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between font-semibold mb-1">
                    <span className="text-slate-800">{f.title}</span>
                    <span className={f.impact === 'positive' ? 'text-emerald-600' : f.impact === 'warning' ? 'text-amber-600' : 'text-rose-600'}>
                      {f.impact.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">{f.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
