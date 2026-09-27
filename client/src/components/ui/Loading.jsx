import React from 'react';
import { Loader2, Wrench } from 'lucide-react';

/**
 * Reusable Loading Component
 * Supports inline, container, or full-screen viewport overlays
 */
const Loading = ({
  message = 'Loading...',
  fullScreen = false,
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div className={`flex flex-col items-center justify-center p-6 text-center space-y-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        <Loader2 className={`${sizeMap[size] || sizeMap.md} text-blue-500 animate-spin`} />
        {size === 'lg' && (
          <Wrench className="w-5 h-5 text-blue-400 absolute animate-pulse" />
        )}
      </div>
      {message && (
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;
