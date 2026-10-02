import React from 'react';
import { Menu, Plus, ScanLine, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Navbar = ({ onOpenSidebar, pageTitle = 'Dashboard' }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-8 bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-all">
      {/* Left side: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{pageTitle}</h2>
        </div>
      </div>

      {/* Right side: Quick Action Buttons & Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Quick Scan Receipt Button */}
        <Link
          to="/expenses/scan"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl transition"
        >
          <ScanLine className="w-3.5 h-3.5 text-indigo-600" />
          <span>Scan Receipt</span>
        </Link>

        {/* Quick Add Expense Button */}
        <Link
          to="/expenses/add"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition shadow-indigo-200"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline">Add Expense</span>
        </Link>

        {/* Currency Tag */}
        <span className="hidden md:inline-flex px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg border border-slate-200">
          {user?.currency || 'INR'}
        </span>

        {/* User Profile Avatar Link */}
        <Link
          to="/profile"
          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 transition"
          title="Account Profile"
        >
          <UserIcon className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
};
