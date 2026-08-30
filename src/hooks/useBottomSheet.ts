import React, { useState, useRef, useCallback, useEffect } from 'react';
import { soundFX } from '../utils/audio';

interface UseBottomSheetOptions {
  onClose: () => void;
  threshold?: number;
  playSound?: boolean;
}

export function useBottomSheet({ onClose, threshold = 65, playSound = true }: UseBottomSheetOptions) {
  const [dragY, setDragY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const handleDismiss = useCallback(() => {
    if (playSound) {
      soundFX.playPop();
    }
    onClose();
  }, [onClose, playSound]);

  // Helper to check if event was triggered on interactive child elements
  const isInteractiveElement = (target: EventTarget | null) => {
    if (!target || !(target instanceof HTMLElement)) return false;
    return !!target.closest('button, a, input, select, textarea, [data-no-drag="true"], [role="button"]:not([aria-label*="Drag"])');
  };

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (isInteractiveElement(e.target)) {
      return;
    }
    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    currentYRef.current = touch.clientY;
    startTimeRef.current = Date.now();
    setIsDragging(true);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    currentYRef.current = touch.clientY;
    const deltaY = touch.clientY - startYRef.current;
    
    // Only allow downward drag with gentle upward resistance
    if (deltaY > 0) {
      setDragY(deltaY);
    } else {
      setDragY(deltaY * 0.15); // rubberband upward
    }
  }, [isDragging]);

  const onTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const deltaY = currentYRef.current - startYRef.current;
    const deltaTime = Math.max(1, Date.now() - startTimeRef.current);
    const velocity = deltaY / deltaTime; // px per ms

    // If dragged past threshold or swiped down quickly (> 0.45 px/ms)
    if (deltaY >= threshold || (deltaY > 25 && velocity > 0.45)) {
      handleDismiss();
    } else {
      setDragY(0);
    }
  }, [isDragging, threshold, handleDismiss]);

  // Pointer / Mouse drag handlers for desktop / simulator
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (isInteractiveElement(e.target)) {
      return;
    }
    startYRef.current = e.clientY;
    currentYRef.current = e.clientY;
    startTimeRef.current = Date.now();
    setIsDragging(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    currentYRef.current = e.clientY;
    const deltaY = e.clientY - startYRef.current;
    
    if (deltaY > 0) {
      setDragY(deltaY);
    } else {
      setDragY(deltaY * 0.15);
    }
  }, [isDragging]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const deltaY = currentYRef.current - startYRef.current;
    const deltaTime = Math.max(1, Date.now() - startTimeRef.current);
    const velocity = deltaY / deltaTime;

    if (deltaY >= threshold || (deltaY > 25 && velocity > 0.45)) {
      handleDismiss();
    } else {
      setDragY(0);
    }
  }, [isDragging, threshold, handleDismiss]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDismiss]);

  const sheetStyle: React.CSSProperties = {
    transform: dragY > 0 ? `translateY(${dragY}px)` : dragY < 0 ? `translateY(${dragY}px)` : 'translateY(0px)',
    transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
    touchAction: 'none',
  };

  return {
    dragY,
    isDragging,
    sheetStyle,
    handleDismiss,
    dragHandleProps: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel: onTouchEnd,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onClick: (e: React.MouseEvent) => {
        // If it was just a tap / click (dragY is close to 0)
        if (Math.abs(dragY) < 5) {
          e.stopPropagation();
          handleDismiss();
        }
      },
      role: 'button' as const,
      'aria-label': 'Drag down or tap to close',
      tabIndex: 0,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleDismiss();
        }
      }
    }
  };
}
