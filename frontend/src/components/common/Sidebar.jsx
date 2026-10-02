import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  ScanLine,
  PieChart,
  Sparkles,
  FileText,
  User,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SpendIQLogo } from './SpendIQLogo';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/expenses', label: 'Expenses', icon: Receipt },
    { to: '/expenses/add', label: 'Add Expense', icon: PlusCircle },
    { to: '/expenses/scan', label: 'Receipt Scanner', icon: ScanLine, badge: 'AI' },
    { to: '/budgets', label: 'Budgets', icon: PieChart },
    { to: '/insights', label: 'AI Insights', icon: Sparkles, badge: 'Smart' },
    { to: '/reports', label: 'Monthly Reports', icon: FileText },
    { to: '/profile', label: 'Profile & Settings', icon: User },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 h-screen bg-slate-900 dark:bg-slate-950 text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-slate-800 dark:border-slate-800/60 shadow-2xl lg:shadow-none select-none`}
      >
        {/* Brand & Scrollable Navigation */}
        <div className="flex flex-col min-h-0 flex-1">
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800/80 shrink-0">
            <NavLink to="/dashboard" className="flex items-center group" onClick={() => onClose && onClose()}>
              <SpendIQLogo variant="full" size="md" theme="dark" showTagline={true} />
            </NavLink>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/expenses'}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 opacity-90" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer: User Profile & Logout (Always Pinned) */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/70 space-y-2.5 shrink-0">
          {/* User Profile Card */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-800/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-100 truncate">{user?.name || 'User'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || ''}</p>
              </div>
            </div>
          </div>

          {/* Sign Out Button (Exclusive to Sidebar) */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition border border-rose-500/30 cursor-pointer shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
