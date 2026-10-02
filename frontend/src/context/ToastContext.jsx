import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, message, type = 'info', duration = 4000 }) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((t) => {
          let bg = 'bg-slate-900 border-slate-700 text-white';
          let icon = <Info className="w-5 h-5 text-indigo-400 shrink-0" />;

          if (t.type === 'success') {
            bg = 'bg-emerald-900/90 border-emerald-700 text-white';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
          } else if (t.type === 'error') {
            bg = 'bg-rose-900/90 border-rose-700 text-white';
            icon = <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          } else if (t.type === 'warning') {
            bg = 'bg-amber-900/90 border-amber-700 text-white';
            icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 ${bg}`}
            >
              {icon}
              <div className="flex-1 text-sm">
                {t.title && <p className="font-semibold">{t.title}</p>}
                {t.message && <p className="text-slate-200 mt-0.5">{t.message}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white transition-colors p-1"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
