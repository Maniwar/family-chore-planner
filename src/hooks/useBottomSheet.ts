import React, { useState, useRef, useCallback, useEffect } from 'react';
import { soundFX } from '../utils/audio';

interface UseBottomSheetOptions {
  onClose: () => void;
  threshold?: number;
  playSound?: boolean;
}

export function useBottomSheet({ onClose, threshold = 45, playSound = true }: UseBottomSheetOptions) {
  const [dragY, setDragY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  const handleDismiss = useCallback(() => {
    if (playSound) {
      soundFX.playPop();
    }
    onClose();
  }, [onClose, playSound]);

  // Helper to check if event was triggered on interactive child elements
  const isInteractiveElement = (target: EventTarget | null) => {
    if (!target || !(target instanceof HTMLElement)) return false;
    return !!target.closest('button, a, input, select, textarea, [data-no-drag="true"]');
  };

  // Window-level move & end handlers to ensure rock-solid tracking
  const finishDrag = useCallback((clientY: number) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    const deltaY = clientY - startYRef.current;
    const deltaTime = Math.max(1, Date.now() - startTimeRef.current);
    const velocity = deltaY / deltaTime; // px per ms

    // Quick tap or click detection
    if (Math.abs(deltaY) < 6 && deltaTime < 350) {
      handleDismiss();
      return;
    }

    // Dragged past threshold (>45px) or swiped down quickly (>0.25 px/ms)
    if (deltaY >= threshold || (deltaY > 15 && velocity > 0.25)) {
      handleDismiss();
    } else {
      setDragY(0);
    }
  }, [threshold, handleDismiss]);

  const updateDrag = useCallback((clientY: number) => {
    if (!isDraggingRef.current) return;
    currentYRef.current = clientY;
    const deltaY = clientY - startYRef.current;
    
    // Allow downward drag with gentle upward resistance
    if (deltaY > 0) {
      setDragY(deltaY);
    } else {
      setDragY(deltaY * 0.15); // rubberband upward
    }
  }, []);

  // Global window listeners while dragging
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      updateDrag(e.clientY);
    };

    const handlePointerUp = (e: PointerEvent) => {
      finishDrag(e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        updateDrag(e.touches[0].clientY);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches[0]) {
        finishDrag(e.changedTouches[0].clientY);
      } else {
        finishDrag(currentYRef.current);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', handlePointerUp, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isDragging, updateDrag, finishDrag]);

  // Touch & Pointer Start handlers
  const startDrag = useCallback((clientY: number, target: EventTarget | null) => {
    if (isInteractiveElement(target)) {
      return;
    }
    startYRef.current = clientY;
    currentYRef.current = clientY;
    startTimeRef.current = Date.now();
    isDraggingRef.current = true;
    setIsDragging(true);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches[0]) {
      startDrag(e.touches[0].clientY, e.target);
    }
  }, [startDrag]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only respond to main primary pointer / left button
    if (e.button !== 0) return;
    startDrag(e.clientY, e.target);
  }, [startDrag]);

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
    transform: dragY !== 0 ? `translateY(${dragY}px)` : 'translateY(0px)',
    transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
    touchAction: 'pan-y',
  };

  const handleBarClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    handleDismiss();
  }, [handleDismiss]);

  const handleBarKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      handleDismiss();
    }
  }, [handleDismiss]);

  return {
    dragY,
    isDragging,
    sheetStyle,
    handleDismiss,
    dragHandleProps: {
      onTouchStart,
      onPointerDown,
      onClick: handleBarClick,
      onKeyDown: handleBarKeyDown,
      role: 'button' as const,
      'aria-label': 'Drag down or tap to dismiss',
      tabIndex: 0,
    }
  };
}
