import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'We encountered an error loading your data. Please try again.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-rose-50/50 border border-rose-200/80 rounded-2xl shadow-sm my-4">
      <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-rose-900 mb-1">{title}</h3>
      <p className="text-sm text-rose-600 max-w-md mb-5">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-700 bg-white border border-rose-300 hover:bg-rose-50 rounded-xl transition shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
};
