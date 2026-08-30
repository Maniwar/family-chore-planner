import React from 'react';

interface BottomSheetGrabberProps {
  dragHandleProps?: {
    onTouchStart?: (e: React.TouchEvent) => void;
    onPointerDown?: (e: React.PointerEvent) => void;
    onClick?: (e: React.MouseEvent) => void;
    role?: 'button';
    'aria-label'?: string;
    tabIndex?: number;
    onKeyDown?: (e: React.KeyboardEvent) => void;
  };
  onClose?: () => void;
  variant?: 'default' | 'white' | 'dark' | 'glass';
  className?: string;
  barClassName?: string;
}

export const BottomSheetGrabber: React.FC<BottomSheetGrabberProps> = ({
  dragHandleProps,
  onClose,
  variant = 'default',
  className = '',
  barClassName = '',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (dragHandleProps?.onClick) {
      dragHandleProps.onClick(e);
    } else if (onClose) {
      e.stopPropagation();
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (dragHandleProps?.onKeyDown) {
      dragHandleProps.onKeyDown(e);
    } else if (onClose && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClose();
    }
  };

  const getBarVariantStyles = () => {
    if (variant === 'white') {
      return 'bg-white/70 group-hover:bg-white/95 group-active:bg-white shadow-[0_1px_2px_rgba(0,0,0,0.15)]';
    }
    if (variant === 'dark') {
      return 'bg-slate-600 group-hover:bg-slate-500 group-active:bg-slate-400';
    }
    if (variant === 'glass') {
      return 'bg-slate-400/60 dark:bg-slate-500/60 group-hover:bg-slate-500/80 group-active:bg-slate-600';
    }
    return 'bg-slate-300 dark:bg-slate-600 group-hover:bg-slate-400 dark:group-hover:bg-slate-500 group-active:bg-slate-500 shadow-2xs';
  };

  const getContainerVariantStyles = () => {
    if (variant === 'white') {
      return 'hover:bg-white/10 active:bg-white/15 focus-visible:ring-white/50';
    }
    return 'hover:bg-slate-100/70 dark:hover:bg-slate-800/50 active:bg-slate-200/50 focus-visible:ring-rose-400';
  };

  return (
    <div
      {...dragHandleProps}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      aria-label="Drag down or tap to close sheet"
      tabIndex={0}
      title="Drag down or tap to dismiss"
      className={`w-full py-3 min-h-[32px] flex items-center justify-center cursor-grab active:cursor-grabbing group select-none touch-none focus:outline-none focus-visible:ring-2 rounded-t-3xl transition-all shrink-0 ${getContainerVariantStyles()} ${className}`}
    >
      <div
        className={`w-14 h-1.5 rounded-full transition-all duration-150 group-hover:w-16 group-active:scale-95 ${getBarVariantStyles()} ${barClassName}`}
      />
    </div>
  );
};
