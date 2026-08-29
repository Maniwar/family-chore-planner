import React from 'react';

interface BottomSheetGrabberProps {
  dragHandleProps?: {
    onTouchStart?: (e: React.TouchEvent) => void;
    onTouchMove?: (e: React.TouchEvent) => void;
    onTouchEnd?: (e: React.TouchEvent) => void;
    onTouchCancel?: (e: React.TouchEvent) => void;
    onPointerDown?: (e: React.PointerEvent) => void;
    onPointerMove?: (e: React.PointerEvent) => void;
    onPointerUp?: (e: React.PointerEvent) => void;
    onPointerCancel?: (e: React.PointerEvent) => void;
    onClick?: (e: React.MouseEvent) => void;
    role?: 'button';
    'aria-label'?: string;
    tabIndex?: number;
    onKeyDown?: (e: React.KeyboardEvent) => void;
  };
  onClose?: () => void;
  className?: string;
  barClassName?: string;
}

export const BottomSheetGrabber: React.FC<BottomSheetGrabberProps> = ({
  dragHandleProps,
  onClose,
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

  return (
    <div
      {...dragHandleProps}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      aria-label="Drag down or tap to close sheet"
      tabIndex={0}
      title="Drag down or tap to dismiss"
      className={`w-full py-2.5 flex items-center justify-center cursor-grab active:cursor-grabbing group select-none touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 rounded-t-3xl transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-800/50 shrink-0 ${className}`}
    >
      <div
        className={`w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-slate-400 dark:group-hover:bg-slate-500 group-active:bg-slate-500 group-hover:scale-105 transition-all duration-150 shadow-2xs ${barClassName}`}
      />
    </div>
  );
};
