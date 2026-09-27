import React from 'react';
import { ClipboardList, Plus } from 'lucide-react';

/**
 * Reusable EmptyState Component
 * For zero-data states (e.g. no tickets, no search results, no notifications)
 */
const EmptyState = ({
  icon: Icon = ClipboardList,
  title = 'No items found',
  description = 'There are no records to display at this moment.',
  actionText = null,
  onAction = null,
  className = '',
}) => {
  return (
    <div className={`p-10 sm:p-14 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center space-y-5 max-w-md mx-auto ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-500 shadow-inner">
        <Icon className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
        <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {actionText && onAction && (
        <div className="pt-1">
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{actionText}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
