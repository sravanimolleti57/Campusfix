import React, { useEffect } from 'react';
import { AlertTriangle, X, Check, Loader2 } from 'lucide-react';

/**
 * Reusable Confirmation Modal Component
 * Dialog overlay with accessible keyboard and backdrop dismiss
 */
const ConfirmModal = ({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone. Please confirm to proceed.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary', // 'primary' | 'danger' | 'warning'
  loading = false,
}) => {
  // Dismiss modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
      btn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20',
    },
    warning: {
      iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      btn: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20',
    },
    primary: {
      iconBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      btn: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20',
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.primary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b0f19]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl transition-colors disabled:opacity-40"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${currentVariant.iconBg}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 pt-0.5">
            <h3 id="modal-title" className="text-base font-bold text-white">
              {title}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors disabled:opacity-40"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50 ${currentVariant.btn}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
