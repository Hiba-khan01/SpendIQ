import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle = ({ className = "", compact = false }) => {
  const { theme, isDark, toggleTheme } = useTheme();

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        className={`p-2 rounded-xl border transition-all duration-200 flex items-center justify-center ${
          isDark
            ? 'bg-slate-800/80 hover:bg-slate-700 text-amber-300 border-slate-700 hover:border-slate-600 shadow-sm'
            : 'bg-slate-100 hover:bg-slate-200 text-indigo-600 border-slate-200 hover:border-slate-300 shadow-sm'
        } ${className}`}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <Sun className="w-4 h-4 transition-transform hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 transition-transform hover:-rotate-12" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
        isDark
          ? 'bg-slate-800/90 hover:bg-slate-800 text-slate-200 border-slate-700 shadow-sm'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-sm'
      } ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      aria-label="Toggle theme"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 transition-transform rotate-0" />
        )}
      </div>
      <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
    </button>
  );
};

export default ThemeToggle;
