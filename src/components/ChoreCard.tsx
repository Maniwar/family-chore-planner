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
  Hand
} from 'lucide-react';
import { Chore, ChoreAssignmentLog, HouseholdMember } from '../types';
import { formatTimeDisplay } from '../utils/storage';
import { soundFX } from '../utils/audio';
import { SupportedLanguage, getTranslation, getCategoryTranslation, getCategoryShortDisplay } from '../utils/i18n';
import { Avatar } from './Avatar';
import { calculateDaysLate, getPenaltyTierInfo } from '../utils/penaltyEngine';
import { ThemePreset, THEMES } from '../utils/theme';

interface ChoreCardProps {
  chore: Chore;
  log?: ChoreAssignmentLog;
  assignee?: HouseholdMember;
  isMomMode: boolean;
  language?: SupportedLanguage;
  currentTheme?: ThemePreset;
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
  viewMode = 'list',
  onMarkComplete,
  onOpenInspect,
  onQuickApprove,
  onEditChore,
}) => {
  const t = getTranslation(language);
  const theme = THEMES[currentTheme] || THEMES.rose;
  const [isExpanded, setIsExpanded] = useState(false);
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
  const catShort = getCategoryShortDisplay(chore.category, language);

  const isSwipeRightActive = dragOffset > 20;
  const isSwipeLeftActive = dragOffset < -20;
  const isThresholdMetRight = dragOffset >= SWIPE_THRESHOLD;
  const isThresholdMetLeft = dragOffset <= -SWIPE_THRESHOLD;

  // COMPACT GRID / 2-COLUMN VIEW MODE
  if (viewMode === 'grid') {
    return (
      <div 
        id={`chore-card-grid-${chore.id}`}
        className="relative rounded-2xl overflow-hidden shadow-2xs select-none touch-pan-y"
      >
        {/* Background Swipe Actions Layer */}
        <div 
          className={`absolute inset-0 flex items-center justify-between px-3 font-black text-[11px] transition-colors duration-200 rounded-2xl ${
            isSwipeRightActive
              ? isThresholdMetRight ? 'bg-emerald-600 text-white' : 'bg-emerald-500/90 text-white'
              : isSwipeLeftActive && isMomMode
              ? isThresholdMetLeft ? 'bg-amber-600 text-white' : 'bg-amber-500/90 text-white'
              : 'bg-slate-100 text-slate-400'
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: `translateX(${dragOffset}px)`,
            transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
          className={`relative z-10 bg-white rounded-2xl border p-3 flex flex-col justify-between min-h-[142px] transition-all duration-200 ${
            status === 'needs_review'
              ? 'border-amber-300 bg-gradient-to-br from-white to-amber-50/40 ring-1 ring-amber-300'
              : status === 'approved'
              ? 'border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30'
              : status === 'needs_redo'
              ? 'border-rose-300 bg-gradient-to-br from-white to-rose-50/30 ring-1 ring-rose-200'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            {/* Top row: Category pill (Emoji + Short Label) + Points + Edit */}
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border whitespace-nowrap flex items-center gap-1 ${getCategoryColor(chore.category)}`}>
                <span>{catShort.emoji}</span>
                <span>{catShort.label}</span>
              </span>

              <div className="flex items-center gap-1 shrink-0">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                  ⭐ {chore.defaultPoints}
                </span>
                {isMomMode && onEditChore && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditChore(chore);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors shrink-0 active:scale-95 touch-target min-h-[30px] min-w-[30px] flex items-center justify-center -mr-1 cursor-pointer"
                    title="Edit Chore"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Title */}
            <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug line-clamp-2 mb-1">
              {chore.title}
            </h4>

            {/* Time & Duration */}
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold mb-2">
              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{formatTimeDisplay(chore.scheduledTime, chore.timeOfDay)}</span>
              {chore.estimatedMinutes && (
                <span className="text-slate-400 font-normal">({chore.estimatedMinutes}m)</span>
              )}
            </div>
          </div>

          {/* Bottom Row: Assignee + Status / Action Button */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 mt-auto">
            {assignee ? (
              <div className="flex items-center gap-1 min-w-0 flex-1" title={`${t.cardAssignedTo} ${assignee.name}`}>
                <Avatar
                  photoUrl={assignee.avatarPhotoUrl}
                  emoji={assignee.avatarEmoji}
                  name={assignee.name}
                  size="xs"
                  showBorder={false}
                />
                <span className="text-[11px] font-bold text-slate-700 truncate max-w-[65px]">
                  {assignee.name.split(' ')[0]}
                </span>
              </div>
            ) : <div className="flex-1" />}

            {/* Action State */}
            {status === 'approved' ? (
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Done</span>
              </div>
            ) : status === 'needs_review' ? (
              isMomMode ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFX.playStarChime(5);
                    if (log) onQuickApprove(chore.id, log.id);
                  }}
                  className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black shadow-2xs active:scale-95 flex items-center gap-1 cursor-pointer min-h-[30px]"
                  title="Pass 5⭐"
                >
                  <Sparkles className="w-3 h-3 text-amber-200" />
                  <span>Pass 5⭐</span>
                </button>
              ) : (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-xl border border-amber-200">
                  Reviewing ✨
                </span>
              )
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleChildSubmit();
                }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black shadow-2xs active:scale-95 flex items-center gap-1 cursor-pointer min-h-[30px]"
                title="Mark Done"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Done</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // STANDARD COMPACT LIST VIEW MODE
  return (
    <div 
      id={`chore-card-${chore.id}`}
      className="relative rounded-2xl overflow-hidden shadow-2xs select-none touch-pan-y"
    >
      {/* Background Swipe Actions Layer */}
      <div 
        className={`absolute inset-0 flex items-center justify-between px-4 font-black text-xs transition-colors duration-200 rounded-2xl ${
          isSwipeRightActive
            ? isThresholdMetRight
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-500/90 text-white'
            : isSwipeLeftActive
            ? isThresholdMetLeft
              ? 'bg-amber-600 text-white'
              : 'bg-amber-500/90 text-white'
            : 'bg-slate-100 text-slate-400'
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        className={`relative z-10 bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
          status === 'needs_review'
            ? 'border-amber-300 bg-gradient-to-br from-white to-amber-50/40 ring-1 ring-amber-300'
            : status === 'approved'
            ? 'border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30'
            : status === 'needs_redo'
            ? 'border-rose-300 bg-gradient-to-br from-white to-rose-50/30 ring-1 ring-rose-200'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Top Meta Line: Category, Time, Points, Assignee & Edit */}
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border whitespace-nowrap flex items-center gap-1 ${getCategoryColor(chore.category)}`}>
                  <span>{catShort.emoji}</span>
                  <span>{catShort.label}</span>
                </span>

                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-semibold whitespace-nowrap">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {formatTimeDisplay(chore.scheduledTime, chore.timeOfDay)}
                  {chore.estimatedMinutes && (
                    <span className="text-slate-400 font-normal">({chore.estimatedMinutes}m)</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs whitespace-nowrap">
                  ⭐ {chore.defaultPoints} {t.pts}
                </span>

                {assignee && (
                  <div 
                    className="flex items-center gap-1 bg-slate-50 pl-1 pr-1.5 py-0.5 rounded-full border border-slate-200 shadow-2xs"
                    title={`${t.cardAssignedTo} ${assignee.name}`}
                  >
                    <Avatar
                      photoUrl={assignee.avatarPhotoUrl}
                      emoji={assignee.avatarEmoji}
                      name={assignee.name}
                      size="xs"
                      showBorder={false}
                    />
                    <span className="text-[11px] font-bold text-slate-700 max-w-[65px] truncate hidden xs:inline">
                      {assignee.name.split(' ')[0]}
                    </span>
                  </div>
                )}

                {isMomMode && onEditChore && (
                  <button
                    onClick={() => onEditChore(chore)}
                    className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors shrink-0 active:scale-95 min-h-[30px] min-w-[30px] flex items-center justify-center -mr-1 cursor-pointer"
                    title="Edit Chore"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
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
              <div className="mt-2 space-y-1.5 pt-2 border-t border-slate-100 pb-1">
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
                onClick={() => {
                  soundFX.playPop();
                  setIsExpanded(!isExpanded);
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer min-h-[36px] active:scale-95 ${
                  completedChecklistCount === totalChecklistCount
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
                {status !== 'approved' && 'Swipe right to complete →'}
              </div>
            )}

            {/* Action State Buttons */}
            <div className="flex items-center gap-1.5 ml-auto">
              {/* PENDING / NEEDS REDO */}
              {(status === 'pending' || status === 'needs_redo') && (
                <>
                  {isMomMode && (
                    <button
                      id={`btn-instant-approve-${chore.id}`}
                      onClick={() => {
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
                      className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors shrink-0 active:scale-95 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title={t.inspectAndGrade}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    </button>
                  )}

                  <button
                    id={`btn-complete-chore-${chore.id}`}
                    onClick={handleChildSubmit}
                    className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-black ${theme.primaryBg} ${theme.primaryText} ${theme.primaryHover} shadow-2xs transition-all active:scale-95 min-h-[36px] cursor-pointer`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{status === 'needs_redo' ? t.fixedSubmit : t.markDone}</span>
                  </button>
                </>
              )}

              {/* NEEDS REVIEW */}
              {status === 'needs_review' && log && (
                isMomMode ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`btn-inspect-grade-${chore.id}`}
                      onClick={() => {
                        soundFX.playPop();
                        onOpenInspect(chore, log);
                      }}
                      className="inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-black bg-amber-500 text-white hover:bg-amber-600 shadow-2xs transition-transform active:scale-95 min-h-[36px] cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>Inspect</span>
                    </button>

                    <button
                      id={`btn-quick-approve-${chore.id}`}
                      onClick={() => {
                        soundFX.playStarChime(5);
                        onQuickApprove(chore.id, log.id);
                      }}
                      className="inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition-transform active:scale-95 min-h-[36px] cursor-pointer"
                      title={t.quickApproveTitle}
                    >
                      <CheckCircle2 className="w-3 h-3 text-white shrink-0" />
                      <span>Pass 5⭐</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    <span>Reviewing ✨</span>
                  </span>
                )
              )}

              {/* APPROVED */}
              {status === 'approved' && (
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Approved</span>
                  </span>
                  {isMomMode && log && (
                    <button
                      onClick={() => {
                        soundFX.playPop();
                        onOpenInspect(chore, log);
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium p-1 min-h-[32px] flex items-center cursor-pointer"
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
  );
};

