import React from 'react';
import { AlertCircle, RotateCcw, AlertTriangle } from 'lucide-react';

/**
 * Reusable Error Component
 * Supports banner alert, card state, or full screen view
 */
const ErrorMessage = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while communicating with the server.',
  onRetry = null,
  variant = 'card', // 'card' | 'banner' | 'fullscreen'
  className = '',
}) => {
  if (variant === 'banner') {
    return (
      <div className={`p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-200 flex items-start gap-3 text-xs ${className}`}>
        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          {title && <span className="font-bold block text-rose-300">{title}</span>}
          <span>{message}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg font-semibold text-[11px] flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Retry
          </button>
        )}
      </div>
    );
  }

  const content = (
    <div className={`p-10 rounded-2xl bg-slate-900/50 border border-slate-800/60 text-center space-y-5 max-w-md mx-auto ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">{message}</p>
      </div>

      {onRetry && (
        <div className="pt-1">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-sm font-semibold hover:-translate-y-0.5 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      )}
    </div>
  );

  if (variant === 'fullscreen') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return content;
};

export default ErrorMessage;
