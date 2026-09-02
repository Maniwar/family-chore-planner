import React, { useState, useRef, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  MessageSquareQuote,
  CheckSquare,
  Square,
  Edit2,
  ChevronRight,
  Hand,
  X,
  User,
  Info,
  Check,
  RotateCcw
} from 'lucide-react';
import { Chore, ChoreAssignmentLog, HouseholdMember } from '../types';
import { formatTimeDisplay } from '../utils/storage';
import { soundFX } from '../utils/audio';
import { SupportedLanguage, getTranslation, getCategoryTranslation } from '../utils/i18n';
import { Avatar } from './Avatar';
import { BottomSheetGrabber } from './BottomSheetGrabber';
import { CategoryBadge, StarPointsBadge, BadgeStyle } from './CategoryBadge';
import { calculateDaysLate, getPenaltyTierInfo } from '../utils/penaltyEngine';
import { ThemePreset, THEMES, isGlassTheme } from '../utils/theme';

interface ChoreCardProps {
  chore: Chore;
  log?: ChoreAssignmentLog;
  assignee?: HouseholdMember;
  isMomMode: boolean;
  language?: SupportedLanguage;
  currentTheme?: ThemePreset;
  badgeStyle?: BadgeStyle;
  viewMode?: 'list' | 'grid';
  onMarkComplete: (choreId: string, note?: string, checklist?: { [key: number]: boolean }) => void;
  onOpenInspect: (chore: Chore, log: ChoreAssignmentLog) => void;
  onQuickApprove: (choreId: string, logId: string) => void;
  onEditChore?: (chore: Chore) => void;
  onDeleteChore?: (choreId: string) => void;
}

export const ChoreCard: React.FC<ChoreCardProps> = ({
  chore,
  log,
  assignee,
  isMomMode,
  language = 'en',
  currentTheme = 'rose',
  badgeStyle = 'pastel',
  viewMode = 'list',
  onMarkComplete,
  onOpenInspect,
  onQuickApprove,
  onEditChore,
}) => {
  const t = getTranslation(language);
  const theme = THEMES[currentTheme] || THEMES.rose;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<{ [key: number]: boolean }>(
    log?.checklistStatus || {}
  );
  const [kidNote, setKidNote] = useState(log?.completedNote || '');

  // Swipe Gesture State
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeActionTriggered, setSwipeActionTriggered] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);
  const hasHapticFiredRef = useRef(false);

  const status = log?.status || 'pending';
  const SWIPE_THRESHOLD = 75;

  const handleToggleChecklistItem = (index: number) => {
    if (status === 'approved') return;
    soundFX.playPop();
    const updated = { ...checkedItems, [index]: !checkedItems[index] };
    setCheckedItems(updated);
  };

  const handleChildSubmit = () => {
    soundFX.playComplete();
    onMarkComplete(chore.id, kidNote, checkedItems);
    setIsDetailOpen(false);
  };

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (status === 'approved') return;
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    isHorizontalSwipeRef.current = null;
    hasHapticFiredRef.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartXRef.current;
    const diffY = touch.clientY - touchStartYRef.current;

    // Detect if this is horizontal swipe vs vertical scroll
    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        isHorizontalSwipeRef.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (isHorizontalSwipeRef.current === true) {
      // In Kid mode, only swipe right is active. In Mom mode, both right & left are active.
      let effectiveDiff = diffX;
      if (!isMomMode && diffX < 0) {
        effectiveDiff = diffX * 0.15; // resistance
      }
      
      // Dampen drag past threshold
      const maxDrag = 140;
      const clamped = Math.max(-maxDrag, Math.min(maxDrag, effectiveDiff));
      setDragOffset(clamped);

      // Trigger light haptic feedback once threshold is crossed
      if (Math.abs(clamped) >= SWIPE_THRESHOLD && !hasHapticFiredRef.current) {
        hasHapticFiredRef.current = true;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(15); } catch {}
        }
      } else if (Math.abs(clamped) < SWIPE_THRESHOLD && hasHapticFiredRef.current) {
        hasHapticFiredRef.current = false;
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (isHorizontalSwipeRef.current) {
      if (dragOffset >= SWIPE_THRESHOLD) {
        // Trigger Swiped Right Action
        setSwipeActionTriggered(true);
        if (isMomMode && status === 'needs_review' && log) {
          soundFX.playStarChime(5);
          onQuickApprove(chore.id, log.id);
        } else {
          handleChildSubmit();
        }
        setTimeout(() => {
          setDragOffset(0);
          setSwipeActionTriggered(false);
        }, 300);
      } else if (dragOffset <= -SWIPE_THRESHOLD && isMomMode) {
        // Trigger Swiped Left Action (Inspect & Grade)
        soundFX.playPop();
        const targetLog = log || {
          id: `quick_log_${chore.id}`,
          choreId: chore.id,
          memberId: chore.assignedMemberId,
          date: new Date().toISOString().split('T')[0],
          status: 'pending'
        };
        onOpenInspect(chore, targetLog);
        setDragOffset(0);
      } else {
        // Snap back
        setDragOffset(0);
      }
    } else {
      setDragOffset(0);
    }
    isHorizontalSwipeRef.current = null;
  };

  // Category badge colors
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Kitchen': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Living Room': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Bedrooms': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Bathrooms': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Pets': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Laundry': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Yard & Outdoor': return 'bg-lime-50 text-lime-800 border-lime-200';
      case 'Daily Routine': return 'bg-amber-50 text-amber-800 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const completedChecklistCount = Object.values(checkedItems).filter(Boolean).length;
  const totalChecklistCount = chore.qualityChecklist.length;

  const isSwipeRightActive = dragOffset > 20;
  const isSwipeLeftActive = dragOffset < -20;
  const isThresholdMetRight = dragOffset >= SWIPE_THRESHOLD;
  const isThresholdMetLeft = dragOffset <= -SWIPE_THRESHOLD;

  // Handle whole card click (Intentional Tap)
  const handleCardClick = () => {
    // If the user was dragging/swiping, ignore click
    if (Math.abs(dragOffset) > 6) return;
    soundFX.playPop();

    if (viewMode === 'grid') {
      if (isMomMode) {
        const targetLog = log || {
          id: `quick_log_${chore.id}`,
          choreId: chore.id,
          memberId: chore.assignedMemberId,
          date: new Date().toISOString().split('T')[0],
          status: 'pending'
        };
        onOpenInspect(chore, targetLog);
      } else {
        setIsDetailOpen(true);
      }
    } else {
      // List view mode
      if (totalChecklistCount > 0) {
        setIsExpanded(prev => !prev);
      } else if (isMomMode) {
        const targetLog = log || {
          id: `quick_log_${chore.id}`,
          choreId: chore.id,
          memberId: chore.assignedMemberId,
          date: new Date().toISOString().split('T')[0],
          status: 'pending'
        };
        onOpenInspect(chore, targetLog);
      } else {
        setIsDetailOpen(true);
      }
    }
  };

  // Reusable Chore Detail & Quality Checklist Modal
  const renderDetailModal = () => {
    if (!isDetailOpen) return null;

    return (
      <div 
        className="fixed inset-0 z-50 backdrop-blur-sm bg-black/50  flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        onClick={(e) => {
          e.stopPropagation();
          setIsDetailOpen(false);
        }}
      >
        <div 
          className={`${isGlassTheme(currentTheme) ? 'apple-glass-panel border-white/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'} rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border animate-in slide-in-from-bottom duration-200`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* iOS Grabber for Mobile */}
          <div className="shrink-0 border-b border-slate-200/50 dark:border-slate-800/50 pb-2 bg-white/10 dark:bg-black/10 rounded-t-3xl sm:hidden">
            <BottomSheetGrabber onClose={() => setShowDetails(false)} variant={isGlassTheme(currentTheme) ? 'white' : 'default'} />
          </div>

          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CategoryBadge category={chore.category} size="md" style={badgeStyle} />

                <StarPointsBadge points={chore.defaultPoints} suffix={t.pts} size="md" style={badgeStyle} />

                {status === 'approved' ? (
                  <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ✅ Done & Approved
                  </span>
                ) : status === 'needs_review' ? (
                  <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
                    ✨ Waiting for Review
                  </span>
                ) : status === 'needs_redo' ? (
                  <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                    🔄 Touch-up Needed
                  </span>
                ) : null}
              </div>

              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                {chore.title}
              </h3>
            </div>

            <button
              onClick={() => setIsDetailOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            {/* Description if available */}
            {chore.description && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <p className="font-semibold text-slate-800 dark:text-slate-200 mb-0.5 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-500" />
                  Instructions:
                </p>
                {chore.description}
              </div>
            )}

            {/* Chore Meta Details (Time & Assignee) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  Scheduled Time
                </span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatTimeDisplay(chore.scheduledTime, chore.timeOfDay)}</span>
                  {chore.estimatedMinutes && (
                    <span className="text-slate-400 font-normal">({chore.estimatedMinutes}m)</span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  Assigned Helper
                </span>
                {assignee ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Avatar photoUrl={assignee.avatarPhotoUrl} emoji={assignee.avatarEmoji} name={assignee.name} size="xs" showBorder={false} />
                    <span className="truncate">{assignee.name}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">Unassigned</span>
                )}
              </div>
            </div>

            {/* Touch-up feedback alert if needs redo */}
            {status === 'needs_redo' && log?.feedbackNote && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Mom's Feedback:</span>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-400 italic bg-white/80 dark:bg-slate-900/60 p-2 rounded-xl border border-rose-100 dark:border-rose-900">
                  "{log.feedbackNote}"
                </p>
              </div>
            )}

            {/* Quality Checklist Items */}
            {totalChecklistCount > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-indigo-500" />
                    <span>Quality Criteria Checklist ({completedChecklistCount}/{totalChecklistCount})</span>
                  </span>
                  {completedChecklistCount === totalChecklistCount && (
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      All criteria met! 🎉
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {chore.qualityChecklist.map((item, idx) => {
                    const isChecked = !!checkedItems[idx];
                    return (
                      <div
                        key={idx}
                        role="checkbox"
                        aria-checked={isChecked}
                        tabIndex={0}
                        onClick={() => handleToggleChecklistItem(idx)}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            handleToggleChecklistItem(idx);
                          }
                        }}
                        className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all active:scale-[0.99] touch-target select-none border ${
                          isChecked
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800 shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="shrink-0 flex items-center justify-center">
                          {isChecked ? (
                            <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                              <CheckSquare className="w-3.5 h-3.5 text-white" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-lg border-2 border-slate-400 bg-white dark:bg-slate-800 flex items-center justify-center" />
                          )}
                        </div>
                        <span className={`text-xs sm:text-sm leading-snug font-semibold flex-1 ${isChecked ? 'line-through opacity-75' : ''}`}>
                          {item}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 text-center">
                ✨ No specific checklist criteria for this chore. Complete it according to house standards!
              </div>
            )}

            {/* Completed Note input if pending or needs redo */}
            {status !== 'approved' && (
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <MessageSquareQuote className="w-3.5 h-3.5 text-slate-400" />
                  <span>Note for Mom (optional):</span>
                </label>
                <input
                  type="text"
                  value={kidNote}
                  onChange={(e) => setKidNote(e.target.value)}
                  placeholder="e.g. Cleaned under the microwave and wiped counters!"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}
          </div>

          {/* Modal Sticky Bottom Action Bar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              onClick={() => setIsDetailOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px]"
            >
              Close
            </button>

            {status === 'approved' ? (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-4 py-2.5 rounded-xl border border-emerald-200 min-h-[44px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Awarded +{ (log?.pointsAwarded || chore.defaultPoints) + (log?.bonusPoints || 0) } {t.pts}</span>
              </div>
            ) : status === 'needs_review' ? (
              isMomMode ? (
                <button
                  onClick={() => {
                    setIsDetailOpen(false);
                    if (log) onOpenInspect(chore, log);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-transform active:scale-95 cursor-pointer min-h-[44px] flex-1"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Inspect & Grade</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-4 py-2.5 rounded-xl border border-amber-200 flex items-center gap-1.5 min-h-[44px]">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Waiting for Mom's Review</span>
                </span>
              )
            ) : (
              <button
                onClick={handleChildSubmit}
                className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black ${theme.primaryBg} ${theme.primaryHover} ${theme.primaryText} shadow-md transition-all active:scale-95 cursor-pointer min-h-[44px] flex-1`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>{status === 'needs_redo' ? t.fixedSubmit : `${t.markDone} (+${chore.defaultPoints} pts)`}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // COMPACT GRID / 2-COLUMN VIEW MODE
  if (viewMode === 'grid') {
    return (
      <>
        {renderDetailModal()}
        <div 
          id={`chore-card-grid-${chore.id}`}
          className="relative rounded-2xl overflow-hidden shadow-2xs select-none touch-pan-y"
        >
          {/* Background Swipe Actions Layer */}
          <div 
            className={`absolute inset-0 flex items-center justify-between px-3 font-black text-[11px] transition-colors duration-200 rounded-2xl ${
              isSwipeRightActive
                ? isThresholdMetRight ? 'bg-emerald-600 text-white z-0' : 'bg-emerald-500/90 text-white z-0'
                : isSwipeLeftActive && isMomMode
                ? isThresholdMetLeft ? 'bg-amber-600 text-white z-0' : 'bg-amber-500/90 text-white z-0'
                : 'bg-transparent pointer-events-none opacity-0'
            }`}
          >
            <div className={`flex items-center gap-1 transition-transform ${isSwipeRightActive ? 'opacity-100 scale-105' : 'opacity-0 scale-95'}`}>
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span className="text-[10px] uppercase font-black tracking-tight">{isThresholdMetRight ? 'Done!' : 'Done'}</span>
            </div>
            {isMomMode && (
              <div className={`flex items-center gap-1 transition-transform ml-auto ${isSwipeLeftActive ? 'opacity-100 scale-105' : 'opacity-0 scale-95'}`}>
                <span className="text-[10px] uppercase font-black tracking-tight">Grade</span>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Foreground Card */}
          <div
            onClick={handleCardClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: `translateX(${dragOffset}px)`,
              transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
            className={`relative z-10 ${
              isGlassTheme(currentTheme) ? 'apple-glass-card' : theme.cardBg
            } rounded-2xl border p-3 flex flex-col justify-between min-h-[146px] cursor-pointer hover:shadow-xs transition-all duration-200 active:scale-[0.99] ${
              status === 'needs_review'
                ? isGlassTheme(currentTheme)
                  ? 'border-amber-400/80 ring-1 ring-amber-400/50 shadow-[inset_0_0_20px_rgba(251,191,36,0.12)]'
                  : 'border-amber-300 bg-amber-50/80 dark:bg-amber-950/30 text-slate-900 ring-1 ring-amber-300'
                : status === 'approved'
                ? isGlassTheme(currentTheme)
                  ? 'border-emerald-400/80 ring-1 ring-emerald-400/50 shadow-[inset_0_0_20px_rgba(52,211,153,0.10)]'
                  : 'border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20'
                : status === 'needs_redo'
                ? isGlassTheme(currentTheme)
                  ? 'border-rose-400/80 ring-1 ring-rose-400/50 shadow-[inset_0_0_20px_rgba(244,63,94,0.12)]'
                  : 'border-rose-300 bg-rose-50/80 dark:bg-rose-950/30 ring-1 ring-rose-200'
                : isGlassTheme(currentTheme)
                ? 'border-white/20'
                : `${theme.cardBorder} ${theme.cardHoverBorder}`
            }`}
          >
            <div>
              {/* Top meta row: Category Badge + Star Points Badge */}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <CategoryBadge category={chore.category} size="sm" style={badgeStyle} />

                <StarPointsBadge points={chore.defaultPoints} size="sm" style={badgeStyle} />
              </div>

              {/* Title */}
              <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug line-clamp-2 mb-1">
                {chore.title}
              </h4>

              {/* Time & Duration */}
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mb-1">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{formatTimeDisplay(chore.scheduledTime, chore.timeOfDay)}</span>
                {chore.estimatedMinutes && (
                  <span className="text-slate-400 font-normal">({chore.estimatedMinutes}m)</span>
                )}
                {totalChecklistCount > 0 && (
                  <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                    isGlassTheme(currentTheme) 
                      ? 'bg-white/20 dark:bg-black/20 border-white/40 dark:border-white/10 text-slate-900 dark:text-slate-100 backdrop-blur-md shadow-glass' 
                      : 'text-indigo-600 bg-indigo-50/80 border-indigo-100/80'
                  }`}>
                    {completedChecklistCount}/{totalChecklistCount} ✓
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Row: Assignee + Apple-style Checkmark / Inspection Circle Control */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
              {assignee ? (
                <div className="flex items-center gap-2 min-w-0 flex-1" title={`${t.cardAssignedTo} ${assignee.name}`}>
                  <Avatar
                    photoUrl={assignee.avatarPhotoUrl}
                    emoji={assignee.avatarEmoji}
                    name={assignee.name}
                    size="sm"
                    showBorder={false}
                  />
                  <span className="text-xs font-semibold text-slate-700 truncate max-w-[95px]">
                    {assignee.name.split(' ')[0]}
                  </span>
                </div>
              ) : <div className="flex-1" />}

              {/* Apple HIG Checkbox & State Action Button */}
              {status === 'approved' ? (
                <div 
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-2xs shrink-0 ${
                    isGlassTheme(currentTheme)
                      ? 'bg-emerald-500/80 text-white border-emerald-400/50 border backdrop-blur-md'
                      : 'bg-emerald-500 text-white'
                  }`}
                  title="Completed & Approved"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              ) : status === 'needs_review' ? (
                isMomMode ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFX.playStarChime(5);
                      if (log) onQuickApprove(chore.id, log.id);
                    }}
                    className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-2xs active:scale-90 cursor-pointer shrink-0 transition-transform"
                    title="Quick Approve 5⭐"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </button>
                ) : (
                  <div 
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-2xs shrink-0 ${
                      isGlassTheme(currentTheme)
                        ? 'apple-glass-pill bg-amber-400/20 text-amber-200 border-amber-300/60 shadow-glass'
                        : 'bg-amber-100 border border-amber-300 text-amber-700'
                    }`}
                    title="Waiting for Mom's Review"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                )
              ) : status === 'needs_redo' ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChildSubmit();
                  }}
                  className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shadow-2xs active:scale-90 cursor-pointer shrink-0 transition-all ${
                    isGlassTheme(currentTheme)
                      ? 'border-rose-400/50 bg-rose-500/20 hover:bg-rose-500/40 text-rose-100 hover:text-white backdrop-blur-md'
                      : 'border-rose-400 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white'
                  }`}
                  title="Touch-up completed, submit for review"
                >
                  <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChildSubmit();
                  }}
                  className="w-7 h-7 rounded-lg border-2 border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-500 text-slate-300 hover:text-white flex items-center justify-center shadow-2xs active:scale-90 cursor-pointer shrink-0 transition-all group"
                  title="Mark as Done"
                >
                  <Check className="w-4 h-4 stroke-[2.5] opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // STANDARD COMPACT LIST VIEW MODE
  return (
    <>
      {renderDetailModal()}
      <div 
        id={`chore-card-${chore.id}`}
        className="relative rounded-2xl overflow-hidden shadow-2xs select-none touch-pan-y"
      >
        {/* Background Swipe Actions Layer */}
        <div 
          className={`absolute inset-0 flex items-center justify-between px-4 font-black text-xs transition-colors duration-200 rounded-2xl ${
            isSwipeRightActive
              ? isThresholdMetRight
                ? 'bg-emerald-600 text-white z-0'
                : 'bg-emerald-500/90 text-white z-0'
              : isSwipeLeftActive
              ? isThresholdMetLeft
                ? 'bg-amber-600 text-white z-0'
                : 'bg-amber-500/90 text-white z-0'
              : 'bg-transparent pointer-events-none opacity-0'
          }`}
        >
          {/* Left/Right Action Indicators revealed under the card */}
          <div className={`flex items-center gap-1.5 transition-transform duration-150 ${isSwipeRightActive ? 'opacity-100 scale-105' : 'opacity-0 scale-95'}`}>
            <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center">
              {isMomMode && status === 'needs_review' ? (
                <Sparkles className="w-4 h-4 text-white" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-white" />
              )}
            </div>
            <span className="text-xs uppercase tracking-tight font-black">
              {isThresholdMetRight 
                ? (isMomMode && status === 'needs_review' ? 'Release: 5⭐' : 'Release: Done!')
                : (isMomMode && status === 'needs_review' ? 'Swipe: 5⭐' : 'Swipe: Done')}
            </span>
          </div>

          <div className={`flex items-center gap-1.5 transition-transform duration-150 ml-auto ${isSwipeLeftActive && isMomMode ? 'opacity-100 scale-105' : 'opacity-0 scale-95'}`}>
            <span className="text-xs uppercase tracking-tight font-black">
              {isThresholdMetLeft ? 'Release: Grade' : 'Swipe: Inspect'}
            </span>
            <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Foreground Swipeable Card Surface */}
        <div
          onClick={handleCardClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: `translateX(${dragOffset}px)`,
            transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
          className={`relative z-10 ${
            isGlassTheme(currentTheme) ? 'apple-glass-card' : theme.cardBg
          } rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer hover:shadow-xs ${
            status === 'needs_review'
              ? isGlassTheme(currentTheme)
                ? 'border-amber-400/80 ring-1 ring-amber-400/50 shadow-[inset_0_0_20px_rgba(251,191,36,0.12)]'
                : 'border-amber-300 bg-amber-50/80 dark:bg-amber-950/30 ring-1 ring-amber-300'
              : status === 'approved'
              ? isGlassTheme(currentTheme)
                ? 'border-emerald-400/80 ring-1 ring-emerald-400/50 shadow-[inset_0_0_20px_rgba(52,211,153,0.10)]'
                : 'border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20'
              : status === 'needs_redo'
              ? isGlassTheme(currentTheme)
                ? 'border-rose-400/80 ring-1 ring-rose-400/50 shadow-[inset_0_0_20px_rgba(244,63,94,0.12)]'
                : 'border-rose-300 bg-rose-50/80 dark:bg-rose-950/30 ring-1 ring-rose-200'
              : isGlassTheme(currentTheme)
              ? 'border-white/20'
              : `${theme.cardBorder} ${theme.cardHoverBorder}`
          }`}
        >
          <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
            <div>
              {/* Top Meta Line: Category, Time, Points & Assignee */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <CategoryBadge category={chore.category} size="md" style={badgeStyle} />

                  <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium whitespace-nowrap">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatTimeDisplay(chore.scheduledTime, chore.timeOfDay)}
                    {chore.estimatedMinutes && (
                      <span className="text-slate-400 font-normal">({chore.estimatedMinutes}m)</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StarPointsBadge points={chore.defaultPoints} suffix={t.pts} size="md" style={badgeStyle} />

                  {assignee && (
                    <div 
                      className="flex items-center gap-1.5 bg-slate-100/70 hover:bg-slate-100 pl-0.5 pr-2.5 py-0.5 rounded-full border border-slate-200/80 shadow-2xs transition-colors"
                      title={`${t.cardAssignedTo} ${assignee.name}`}
                    >
                      <Avatar
                        photoUrl={assignee.avatarPhotoUrl}
                        emoji={assignee.avatarEmoji}
                        name={assignee.name}
                        size="sm"
                        showBorder={false}
                      />
                      <span className="text-xs font-semibold text-slate-700 max-w-[85px] truncate">
                        {assignee.name.split(' ')[0]}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug break-words mb-0.5">
                {chore.title}
              </h3>
              {chore.description && (
                <p className="text-[11px] text-slate-500 line-clamp-1 mb-1">
                  {chore.description}
                </p>
              )}

              {/* Status Feedback Block (Approved or Needs Redo) */}
              {status === 'approved' && log && (
                <div className="my-1.5 p-2 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="flex text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < (log.qualityScore || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-black text-emerald-800">
                      {log.qualityGrade || 'A+'} Grade
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 whitespace-nowrap">
                    +{ (log.pointsAwarded || chore.defaultPoints) + (log.bonusPoints || 0) } {t.pts}
                  </span>
                </div>
              )}

              {status === 'needs_redo' && log && (
                <div className="my-1.5 p-2 bg-rose-50 rounded-xl border border-rose-200 text-xs">
                  <div className="flex items-center gap-1.5 text-rose-800 font-bold text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{t.momRequestedRedo}</span>
                  </div>
                  {log.feedbackNote && (
                    <p className="mt-0.5 text-[11px] text-rose-700 bg-white/80 p-1.5 rounded-lg border border-rose-100 italic break-words">
                      "{log.feedbackNote}"
                    </p>
                  )}
                </div>
              )}

              {/* Quality Checklist Expandable (if opened) */}
              {totalChecklistCount > 0 && isExpanded && (
                <div 
                  className="mt-2 space-y-1.5 pt-2 border-t border-slate-100 pb-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {chore.qualityChecklist.map((item, idx) => {
                    const isChecked = !!checkedItems[idx];
                    return (
                      <div 
                        key={idx}
                        role="checkbox"
                        aria-checked={isChecked}
                        tabIndex={0}
                        onClick={() => handleToggleChecklistItem(idx)}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            handleToggleChecklistItem(idx);
                          }
                        }}
                        className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98] min-h-[48px] touch-target select-none ${
                          isChecked 
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs' 
                            : 'bg-slate-50 text-slate-800 hover:bg-slate-100 border border-slate-200/80'
                        }`}
                      >
                        <div className="shrink-0 flex items-center justify-center">
                          {isChecked ? (
                            <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                              <CheckSquare className="w-3.5 h-3.5 text-white" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-md border-2 border-slate-400 bg-white flex items-center justify-center" />
                          )}
                        </div>
                        <span className={`text-xs sm:text-sm leading-snug break-words font-medium flex-1 ${isChecked ? 'line-through opacity-75' : ''}`}>
                          {item}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Unified Compact Action Bar (Checklist Pill + Done/Review CTA on Single Row) */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-1">
              {/* Checklist Toggle Pill */}
              {totalChecklistCount > 0 ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFX.playPop();
                    setIsExpanded(!isExpanded);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer min-h-[36px] active:scale-95 ${
                    isGlassTheme(currentTheme)
                      ? completedChecklistCount === totalChecklistCount
                        ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/40 backdrop-blur-md shadow-glass'
                        : 'bg-white/10 dark:bg-black/20 text-slate-800 dark:text-slate-200 border-white/30 dark:border-white/10 backdrop-blur-md shadow-glass hover:bg-white/20'
                      : completedChecklistCount === totalChecklistCount
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <CheckCircle2 className={`w-3 h-3 ${completedChecklistCount === totalChecklistCount ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>Checklist ({completedChecklistCount}/{totalChecklistCount})</span>
                  {isExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                </button>
              ) : (
                <div className="text-[10px] text-slate-400 font-medium hidden xs:block">
                  {status !== 'approved' && 'Tap card for details →'}
                </div>
              )}

              {/* Action State Controls - Apple HIG Tactile Controls */}
              <div className="flex items-center gap-2 ml-auto">
                {/* PENDING / NEEDS REDO */}
                {(status === 'pending' || status === 'needs_redo') && (
                  <>
                    {isMomMode && (
                      <button
                        id={`btn-instant-approve-${chore.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          soundFX.playPop();
                          const tempLog = log || {
                            id: `quick_log_${chore.id}`,
                            choreId: chore.id,
                            memberId: chore.assignedMemberId,
                            date: new Date().toISOString().split('T')[0],
                            status: 'pending'
                          };
                          onOpenInspect(chore, tempLog);
                        }}
                        className={`w-8 h-8 rounded-xl transition-colors shrink-0 active:scale-90 cursor-pointer flex items-center justify-center shadow-2xs ${
                          isGlassTheme(currentTheme)
                            ? 'apple-glass-pill text-amber-100 bg-amber-500/20 hover:bg-amber-500/40 border-amber-300/60'
                            : 'text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200/80'
                        }`}
                        title={t.inspectAndGrade}
                        aria-label="Inspect and Grade"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                      </button>
                    )}

                    {status === 'needs_redo' ? (
                      <button
                        id={`btn-complete-chore-${chore.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChildSubmit();
                        }}
                        className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center shadow-2xs transition-all active:scale-90 cursor-pointer shrink-0 ${
                          isGlassTheme(currentTheme)
                            ? 'apple-glass-pill border-rose-400/60 bg-rose-500/20 hover:bg-rose-500/40 text-rose-100 hover:text-white'
                            : 'border-rose-400 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white'
                        }`}
                        title="Touch-up completed, submit for review"
                        aria-label="Resubmit Chore"
                      >
                        <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    ) : (
                      <button
                        id={`btn-complete-chore-${chore.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChildSubmit();
                        }}
                        className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center shadow-2xs transition-all active:scale-90 cursor-pointer shrink-0 group ${
                          isGlassTheme(currentTheme)
                            ? 'border-white/40 dark:border-white/20 bg-white/10 dark:bg-black/20 hover:bg-emerald-500/80 hover:border-emerald-400/80 text-slate-800 dark:text-slate-300 backdrop-blur-md'
                            : 'border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-500 text-slate-400 hover:text-white'
                        }`}
                        title="Mark as Done (or swipe right)"
                        aria-label="Mark Chore as Done"
                      >
                        <Check className="w-4 h-4 stroke-[2.5] opacity-60 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </>
                )}

                {/* NEEDS REVIEW */}
                {status === 'needs_review' && log && (
                  isMomMode ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        id={`btn-inspect-grade-${chore.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          soundFX.playPop();
                          onOpenInspect(chore, log);
                        }}
                        className="w-8 h-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-2xs transition-transform active:scale-90 cursor-pointer shrink-0"
                        title="Inspect & Grade"
                        aria-label="Inspect and Grade"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>

                      <button
                        id={`btn-quick-approve-${chore.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          soundFX.playStarChime(5);
                          onQuickApprove(chore.id, log.id);
                        }}
                        className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-2xs transition-transform active:scale-90 cursor-pointer shrink-0"
                        title={t.quickApproveTitle}
                        aria-label="Quick Approve 5 Stars"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      className={`h-8 px-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-2xs ${
                        isGlassTheme(currentTheme)
                          ? 'apple-glass-pill bg-amber-400/20 border-amber-300/60 text-amber-200'
                          : 'bg-amber-50 border border-amber-200/90 text-amber-800'
                      }`}
                      title="Waiting for Mom's Review"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>Reviewing</span>
                    </div>
                  )
                )}

                {/* APPROVED */}
                {status === 'approved' && (
                  <div className="flex items-center gap-1.5">
                    <div 
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs shrink-0 ${
                        isGlassTheme(currentTheme)
                          ? 'bg-emerald-500/80 text-white border-emerald-400/50 border backdrop-blur-md'
                          : 'bg-emerald-500 text-white'
                      }`}
                      title="Completed & Approved"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    {isMomMode && log && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          soundFX.playPop();
                          onOpenInspect(chore, log);
                        }}
                        className="text-[11px] text-slate-400 hover:text-slate-700 underline font-medium px-1 py-1 min-h-[32px] flex items-center cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

