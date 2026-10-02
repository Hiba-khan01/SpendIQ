import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { TrendingUp, Sparkles, ShieldCheck, PieChart, ScanLine } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8 relative z-10">
        <Link to="/login" className="inline-flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center p-2.5 shadow-xl shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
              Spend<span className="text-emerald-400">IQ</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Understand your spending. Improve your finances.</p>
          </div>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-700/80">
          <Outlet />
        </div>

        {/* Feature Highlights beneath auth box */}
        <div className="mt-8 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400">
          <div className="flex flex-col items-center gap-1">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>AI Expense Parsing</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ScanLine className="w-4 h-4 text-emerald-400" />
            <span>Smart Receipt OCR</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>Secure & Isolated</span>
          </div>
        </div>
      </div>
    </div>
  );
};
