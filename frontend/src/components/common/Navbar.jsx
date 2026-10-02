import React from 'react';
import { Menu, Plus, ScanLine, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SpendIQLogo } from './SpendIQLogo';
import { ThemeToggle } from './ThemeToggle';

export const Navbar = ({ onOpenSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-8 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      {/* Left side: Hamburger (on mobile) & SpendIQ Brand */}
      <div className="flex items-center gap-3 select-none">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* SpendIQ Brand Header (No Tagline) */}
        <Link to="/dashboard" className="flex items-center gap-1 group">
          <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center">
            Spend<span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">IQ</span>
          </span>
        </Link>
      </div>

      {/* Right side: Quick Actions, Theme Toggle, & Profile (Constant Across All Pages) */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Quick Scan Receipt Button */}
        <Link
          to="/expenses/scan"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition shadow-xs"
        >
          <ScanLine className="w-3.5 h-3.5 text-cyan-500" />
          <span>Scan Receipt</span>
        </Link>

        {/* Quick Add Expense Button */}
        <Link
          to="/expenses/add"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline">Add Expense</span>
        </Link>

        {/* Theme Toggle Button */}
        <ThemeToggle compact={true} />

        {/* Currency Tag */}
        <span className="hidden md:inline-flex px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          {user?.currency || 'INR'}
        </span>

        {/* User Profile Avatar Link */}
        <Link
          to="/profile"
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition"
          title={`Profile (${user?.name || 'Account'})`}
        >
          <UserIcon className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
};
