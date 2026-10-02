import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, ScanLine } from 'lucide-react';
import { SpendIQLogo } from '../components/common/SpendIQLogo';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-900 dark:bg-[#070A11] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors">
      {/* Top right theme toggle */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle compact={true} />
      </div>

      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8 relative z-10 flex flex-col items-center">
        <Link to="/login" className="inline-flex items-center group mb-2 hover:scale-[1.02] transition-transform">
          <SpendIQLogo variant="full" size="lg" theme="dark" showTagline={true} />
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/90 dark:bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-700/80 dark:border-slate-800">
          <Outlet />
        </div>

        {/* Feature Highlights beneath auth box */}
        <div className="mt-8 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400">
          <div className="flex flex-col items-center gap-1">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>AI Expense Parsing</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ScanLine className="w-4 h-4 text-emerald-400" />
            <span>Smart Receipt OCR</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Secure & Isolated</span>
          </div>
        </div>
      </div>
    </div>
  );
};
