import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Star, 
  Clock, 
  MessageSquare, 
  History,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Edit2,
  Award,
  Check,
  ArrowRight,
  SlidersHorizontal
} from 'lucide-react';
import { Chore, ChoreAssignmentLog, HouseholdMember } from '../types';
import { formatDisplayDate, formatTimeDisplay } from '../utils/storage';
import { soundFX } from '../utils/audio';
import { SupportedLanguage, getCategoryShortDisplay } from '../utils/i18n';
import { Avatar } from './Avatar';
import { ThemePreset, THEMES, isGlassTheme } from '../utils/theme';
import { CategoryBadge, StarPointsBadge, BadgeStyle } from './CategoryBadge';

interface InspectionQueueViewProps {
  chores: Chore[];
  logs: ChoreAssignmentLog[];
  members: HouseholdMember[];
  language?: SupportedLanguage;
  currentTheme?: ThemePreset;
  badgeStyle?: BadgeStyle;
  onOpenInspect: (chore: Chore, log: ChoreAssignmentLog) => void;
  onQuickApprove: (choreId: string, logId: string) => void;
  onBatchApproveAll: (items: { chore: Chore; log: ChoreAssignmentLog }[]) => void;
}

const SWIPE_THRESHOLD = 80;

export const InspectionQueueView: React.FC<InspectionQueueViewProps> = ({
  chores,
  logs,
  members,
  language = 'en',
  currentTheme = 'rose',
  badgeStyle = 'pastel',
  onOpenInspect,
  onQuickApprove,
  onBatchApproveAll,
}) => {
  const theme = THEMES[currentTheme] || THEMES.rose;
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');
  const [expandedChecklistIds, setExpandedChecklistIds] = useState<{ [logId: string]: boolean }>({});

  // Touch & Swipe state map per item
  const [swipingLogId, setSwipingLogId] = useState<string | null>(null);
  const [dragOffsets, setDragOffsets] = useState<{ [logId: string]: number }>({});
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);
  const hasTriggeredHapticRef = useRef<boolean>(false);

  // Category badge colors
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Kitchen': return 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'Living Room': return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Bedrooms': return 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'Bathrooms': return 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      case 'Pets': return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Laundry': return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Yard & Outdoor': return 'bg-lime-50 dark:bg-lime-950/40 text-lime-800 dark:text-lime-300 border-lime-200 dark:border-lime-800';
      case 'Daily Routine': return 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default: return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  // Find all logs waiting for review
  const pendingReviewLogs = logs.filter(l => l.status === 'needs_review');

  const pendingItems = pendingReviewLogs.map(log => {
    const chore = chores.find(c => c.id === log.choreId);
    const member = members.find(m => m.id === log.memberId);
    return { log, chore, member };
  }).filter((item): item is { log: ChoreAssignmentLog; chore: Chore; member: HouseholdMember } => 
    !!item.chore && !!item.member
  );

  const filteredPending = selectedMemberFilter === 'all'
    ? pendingItems
    : pendingItems.filter(item => item.member.id === selectedMemberFilter);

  // Total points waiting to be distributed
  const totalPendingPoints = filteredPending.reduce((sum, item) => sum + (item.chore.defaultPoints + 5), 0);

  // Recent reviewed history logs
  const recentApprovedLogs = logs
    .filter(l => l.status === 'approved' && l.reviewedAt)
    .sort((a, b) => (b.reviewedAt || '').localeCompare(a.reviewedAt || ''))
    .slice(0, 20)
    .map(log => {
      const chore = chores.find(c => c.id === log.choreId);
      const member = members.find(m => m.id === log.memberId);
      return { log, chore, member };
    }).filter((item): item is { log: ChoreAssignmentLog; chore: Chore; member: HouseholdMember } => 
      !!item.chore && !!item.member
    );

  const toggleChecklistExpanded = (logId: string) => {
    soundFX.playPop();
    setExpandedChecklistIds(prev => ({ ...prev, [logId]: !prev[logId] }));
  };

  const handleBatchApprove = () => {
    soundFX.playStarChime(5);
    onBatchApproveAll(filteredPending.map(p => ({ chore: p.chore, log: p.log })));
  };

  // Touch gesture handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent, logId: string) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isHorizontalSwipeRef.current = null;
    hasTriggeredHapticRef.current = false;
    setSwipingLogId(logId);
  };

  const handleTouchMove = (e: React.TouchEvent, logId: string) => {
    if (swipingLogId !== logId) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartXRef.current;
    const diffY = currentY - touchStartYRef.current;

    // Detect gesture direction lock
    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        isHorizontalSwipeRef.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (!isHorizontalSwipeRef.current) return;

    // Apply spring dampening resistance
    let dampedOffset = diffX;
    if (Math.abs(diffX) > SWIPE_THRESHOLD) {
      const excess = Math.abs(diffX) - SWIPE_THRESHOLD;
      dampedOffset = Math.sign(diffX) * (SWIPE_THRESHOLD + excess * 0.35);
    }

    // Limit maximum drag
    dampedOffset = Math.max(-140, Math.min(140, dampedOffset));

    // Dynamic threshold haptic snap
    if (Math.abs(dampedOffset) >= SWIPE_THRESHOLD && !hasTriggeredHapticRef.current) {
      hasTriggeredHapticRef.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([15, 30]);
      }
      soundFX.playPop();
    } else if (Math.abs(dampedOffset) < SWIPE_THRESHOLD && hasTriggeredHapticRef.current) {
      hasTriggeredHapticRef.current = false;
    }

    setDragOffsets(prev => ({ ...prev, [logId]: dampedOffset }));
  };

  const handleTouchEnd = (logId: string, chore: Chore, log: ChoreAssignmentLog) => {
    const offset = dragOffsets[logId] || 0;

    if (isHorizontalSwipeRef.current) {
      if (offset >= SWIPE_THRESHOLD) {
        // SWIPE RIGHT: Quick Pass 5-star
        soundFX.playStarChime(5);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([20, 40, 20]);
        }
        onQuickApprove(chore.id, log.id);
        setDragOffsets(prev => ({ ...prev, [logId]: 0 }));
      } else if (offset <= -SWIPE_THRESHOLD) {
        // SWIPE LEFT: Open full Inspect & Grade sheet
        soundFX.playPop();
        onOpenInspect(chore, log);
        setDragOffsets(prev => ({ ...prev, [logId]: 0 }));
      } else {
        // Snap back with spring
        setDragOffsets(prev => ({ ...prev, [logId]: 0 }));
      }
    } else {
      setDragOffsets(prev => ({ ...prev, [logId]: 0 }));
    }

    setSwipingLogId(null);
    isHorizontalSwipeRef.current = null;
    hasTriggeredHapticRef.current = false;
  };

  return (
    <div className="space-y-4 sm:space-y-5 max-w-4xl mx-auto pb-10">
      
      {/* 1. APPLE INSET HERO & HEADER (Information Architecture) */}
      <div className={`rounded-3xl p-4 sm:p-6 shadow-2xs ${isGlassTheme(currentTheme) ? 'apple-glass-panel border-white/20' : 'bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-slate-100 dark:from-amber-950/30 dark:to-slate-900 border border-amber-200/70 dark:border-slate-800'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-md shadow-amber-500/20">
                🔍
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Inspection Queue
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border transition-colors ${
                    pendingItems.length > 0
                      ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200'
                  }`}>
                    {pendingItems.length > 0 ? `${pendingItems.length} Waiting for Review` : 'All Clean & Verified ✨'}
                  </span>
                  {pendingItems.length > 0 && (
                    <span className={`text-xs font-bold ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-500 dark:text-slate-400'}`}>
                      • {totalPendingPoints} pts pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Top iOS Segmented Controller (Queue / History) */}
          <div className={`flex items-center p-1 rounded-2xl shrink-0 self-start sm:self-auto border shadow-2xs ${isGlassTheme(currentTheme) ? 'apple-glass-pill border-white/20' : 'bg-slate-200/90 dark:bg-slate-800 border-slate-300/60 dark:border-slate-700'}`}>
            <button
              onClick={() => {
                soundFX.playPop();
                setActiveTab('queue');
              }}
              className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                activeTab === 'queue'
                  ? (isGlassTheme(currentTheme) ? 'bg-white/40 text-slate-900 shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs')
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>To Inspect</span>
              {pendingItems.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'queue' 
                    ? 'bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-200' 
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {pendingItems.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                soundFX.playPop();
                setActiveTab('history');
              }}
              className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                activeTab === 'history'
                  ? (isGlassTheme(currentTheme) ? 'bg-white/40 text-slate-900 shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs')
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
              {recentApprovedLogs.length > 0 && (
                <span className="text-[10px] text-slate-500 font-bold">
                  ({recentApprovedLogs.length})
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. QUEUE TAB CONTENT */}
      {activeTab === 'queue' && (
        <div className="space-y-3.5">
          
          {/* Helper Filter Carousel & Quick Batch Action Bar */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${isGlassTheme(currentTheme) ? 'apple-glass-card' : 'bg-white dark:bg-slate-900'} p-2.5 sm:p-3 rounded-2xl border ${isGlassTheme(currentTheme) ? 'border-white/20' : 'border-slate-200/90 dark:border-slate-800'} shadow-2xs`}>
            
            {/* Helper Horizontal Pills Carousel */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 -mx-0.5 px-0.5">
              <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider whitespace-nowrap mr-0.5">
                Filter:
              </span>

              <button
                onClick={() => {
                  soundFX.playPop();
                  setSelectedMemberFilter('all');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[40px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${
                  selectedMemberFilter === 'all'
                    ? `${theme.primaryBg} ${theme.primaryText} shadow-2xs font-extrabold`
                    : (isGlassTheme(currentTheme) ? 'bg-white/20 text-slate-800 hover:bg-white/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80')
                }`}
              >
                <span>All Helpers</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  selectedMemberFilter === 'all' 
                    ? 'bg-black/20 text-white' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {pendingItems.length}
                </span>
              </button>

              {members.filter(m => m.role !== 'parent').map((member) => {
                const count = pendingItems.filter(p => p.member.id === member.id).length;
                const isSelected = selectedMemberFilter === member.id;
                return (
                  <button
                    key={member.id}
                    onClick={() => {
                      soundFX.playPop();
                      setSelectedMemberFilter(member.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[40px] cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${
                      isSelected
                        ? `${theme.primaryBg} ${theme.primaryText} shadow-2xs font-extrabold`
                        : (isGlassTheme(currentTheme) ? 'bg-white/20 text-slate-800 hover:bg-white/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80')
                    }`}
                  >
                    <Avatar
                      photoUrl={member.avatarPhotoUrl}
                      emoji={member.avatarEmoji}
                      name={member.name}
                      size="xs"
                      showBorder={false}
                    />
                    <span>{member.name.split(' ')[0]}</span>
                    {count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                        isSelected ? 'bg-black/20 text-white' : 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Batch Approve CTA */}
            {filteredPending.length > 0 && (
              <button
                onClick={handleBatchApprove}
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black shadow-2xs transition-all cursor-pointer min-h-[40px] shrink-0 self-stretch sm:self-auto active:scale-95 ${isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                title="Quick approve all waiting chores with 5-star quality"
              >
                <ThumbsUp className="w-3.5 h-3.5 text-white" />
                <span>Pass All 5⭐ ({filteredPending.length})</span>
              </button>
            )}
          </div>

          {/* Empty State */}
          {filteredPending.length === 0 ? (
            <div className={`rounded-3xl border p-8 sm:p-12 text-center shadow-xs ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 mx-auto flex items-center justify-center text-3xl mb-3 shadow-2xs animate-bounce">
                ✨
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-1">
                All Caught Up, Mom!
              </h3>
              <p className={`text-xs sm:text-sm ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-500 dark:text-slate-400'} max-w-md mx-auto leading-relaxed`}>
                There are no completed chores waiting for inspection in this filter. Check back once helpers finish and submit their tasks!
              </p>
            </div>
          ) : (
            /* Inspection Items Feed with Mobile Swipe Gestures */
            <div className="grid grid-cols-1 gap-3.5 sm:gap-4">
              {filteredPending.map(({ log, chore, member }) => {
                const checklistDone = Object.values(log.checklistStatus || {}).filter(Boolean).length;
                const checklistTotal = chore.qualityChecklist.length;
                const isExpanded = !!expandedChecklistIds[log.id];
                const catShort = getCategoryShortDisplay(chore.category, language);
                
                const currentOffset = dragOffsets[log.id] || 0;
                const isSwipingThis = swipingLogId === log.id;
                const isSwipeRight = currentOffset > 15;
                const isSwipeLeft = currentOffset < -15;
                const isThresholdMetRight = currentOffset >= SWIPE_THRESHOLD;
                const isThresholdMetLeft = currentOffset <= -SWIPE_THRESHOLD;

                return (
                  <div
                    key={log.id}
                    id={`inspection-card-${log.id}`}
                    className="relative rounded-3xl overflow-hidden shadow-2xs select-none touch-pan-y"
                  >
                    {/* Background Swipe Actions Layer (Apple HIG Spring Sheet) */}
                    <div 
                      className={`absolute inset-0 flex items-center justify-between px-5 font-black text-xs transition-colors duration-200 rounded-3xl ${
                        isSwipeRight
                          ? isThresholdMetRight 
                            ? 'bg-emerald-600 text-white z-0' 
                            : 'bg-emerald-500 text-white z-0'
                          : isSwipeLeft
                          ? isThresholdMetLeft 
                            ? 'bg-amber-600 text-white z-0' 
                            : 'bg-amber-500 text-white z-0'
                          : 'bg-transparent pointer-events-none opacity-0'
                      }`}
                    >
                      {/* Left side: Swipe Right to Pass 5-star */}
                      <div className={`flex items-center gap-2 transition-all ${
                        isSwipeRight ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                      }`}>
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="uppercase tracking-wider font-black">
                          {isThresholdMetRight ? 'Release: Pass 5⭐!' : 'Swipe: Pass 5⭐'}
                        </span>
                      </div>

                      {/* Right side: Swipe Left to Inspect */}
                      <div className={`flex items-center gap-2 transition-all ml-auto ${
                        isSwipeLeft ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                      }`}>
                        <span className="uppercase tracking-wider font-black">
                          {isThresholdMetLeft ? 'Release: Inspect & Grade' : 'Swipe: Inspect'}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Foreground Interactive Card (With Spring Physics) */}
                    <div
                      onTouchStart={(e) => handleTouchStart(e, log.id)}
                      onTouchMove={(e) => handleTouchMove(e, log.id)}
                      onTouchEnd={() => handleTouchEnd(log.id, chore, log)}
                      style={{
                        transform: `translateX(${currentOffset}px)`,
                        transition: isSwipingThis ? 'none' : 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.15)',
                      }}
                      className={`relative z-10 ${
                        isGlassTheme(currentTheme) ? 'apple-glass-card' : theme.cardBg
                      } rounded-3xl border ${
                        isGlassTheme(currentTheme) ? 'border-white/20' : 'border-amber-300/80 dark:border-amber-900/60'
                      } p-4 sm:p-5 shadow-sm transition-shadow hover:shadow-md flex flex-col justify-between`}
                    >
                      <div>
                        {/* Top Meta Strip: Helper, Date, Category & Base Points */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          
                          {/* Helper Profile */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar
                              photoUrl={member.avatarPhotoUrl}
                              emoji={member.avatarEmoji}
                              name={member.name}
                              size="md"
                            />
                            <div className="min-w-0">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block leading-tight truncate">
                                {member.name}
                              </span>
                              <span className={`text-[11px] ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-500 dark:text-slate-400'} font-medium flex items-center gap-1`}>
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{formatDisplayDate(log.date)}</span>
                              </span>
                            </div>
                          </div>

                          {/* Category & Points */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <CategoryBadge category={chore.category} size="sm" style={badgeStyle} />
                            <StarPointsBadge points={chore.defaultPoints} suffix="pts" size="sm" style={badgeStyle} />
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div className="mb-3">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                            {chore.title}
                          </h3>
                          {chore.description && (
                            <p className={`text-xs ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-500 dark:text-slate-400'} mt-0.5 leading-relaxed`}>
                              {chore.description}
                            </p>
                          )}
                        </div>

                        {/* Helper's Submission Note */}
                        {log.completedNote && (
                          <div className="p-3 bg-amber-50/90 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 mb-3 text-xs flex items-start gap-2.5">
                            <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-amber-900 dark:text-amber-300">
                                {member.name.split(' ')[0]}'s Submission Note:
                              </span>
                              <p className="text-amber-800 dark:text-amber-200 italic mt-0.5 leading-snug">
                                "{log.completedNote}"
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Quality Checklist Summary & Accordion */}
                        {checklistTotal > 0 && (
                          <div className={`mb-3 rounded-2xl border p-3 text-xs ${isGlassTheme(currentTheme) ? 'bg-white/20 border-white/40' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80'}`}>
                            <button
                              onClick={() => toggleChecklistExpanded(log.id)}
                              className="w-full flex items-center justify-between font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer min-h-[32px]"
                            >
                              <span className="flex items-center gap-2">
                                <CheckCircle2 className={`w-4 h-4 ${checklistDone === checklistTotal ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>Checklist ({checklistDone}/{checklistTotal} verified)</span>
                              </span>
                              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                                <span>{isExpanded ? 'Hide' : 'Review'}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-700 space-y-2">
                                {chore.qualityChecklist.map((item, idx) => {
                                  const isDone = !!log.checklistStatus?.[idx];
                                  return (
                                    <div key={idx} className="flex items-start gap-2 text-xs leading-tight">
                                      <span className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                                        isDone 
                                          ? 'bg-emerald-100 text-emerald-700 font-black dark:bg-emerald-900/60 dark:text-emerald-300' 
                                          : 'bg-slate-200 text-slate-400 dark:bg-slate-700'
                                      }`}>
                                        {isDone ? '✓' : '○'}
                                      </span>
                                      <span className={isDone ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-400 line-through'}>
                                        {item}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Apple Bottom Actions (44pt+ Touch Targets + Gesture Pill) */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                        
                        {/* Mobile Swipe Guidance Hint */}
                        <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 hidden sm:flex items-center gap-1.5">
                          <span>👉 Swipe right to Pass 5⭐</span>
                          <span>•</span>
                          <span>👈 Swipe left to Inspect</span>
                        </div>

                        {/* Dual Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              soundFX.playPop();
                              onOpenInspect(chore, log);
                            }}
                            className={`flex-1 sm:flex-initial min-h-[44px] px-4 py-2.5 rounded-2xl text-xs font-black active:scale-95 shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                          >
                            <Sparkles className="w-4 h-4 text-white" />
                            <span>Inspect & Grade</span>
                          </button>

                          <button
                            onClick={() => {
                              soundFX.playStarChime(5);
                              onQuickApprove(chore.id, log.id);
                            }}
                            className={`flex-1 sm:flex-initial min-h-[44px] px-5 py-2.5 rounded-2xl text-xs font-black active:scale-95 shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                            title="Instant 5-star approval"
                          >
                            <CheckCircle2 className="w-4 h-4 text-white" />
                            <span>Pass 5⭐</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. HISTORY TAB CONTENT (Apple Inset Table View) */}
      {activeTab === 'history' && (
        <div className={`rounded-3xl border shadow-xs overflow-hidden ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
          <div className={`px-5 py-4 flex items-center justify-between border-b ${isGlassTheme(currentTheme) ? 'bg-white/10 border-white/30' : 'bg-slate-50/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-800'}`}>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Recent Quality Inspections & Grades
              </span>
            </div>
            <span className={`text-xs ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-500 dark:text-slate-400'} font-bold`}>
              {recentApprovedLogs.length} Reviewed
            </span>
          </div>

          {recentApprovedLogs.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs italic">
              No recent inspections recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentApprovedLogs.map(({ log, chore, member }) => {
                const catShort = getCategoryShortDisplay(chore.category, language);
                const totalPts = (log.pointsAwarded || chore.defaultPoints) + (log.bonusPoints || 0);

                return (
                  <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <Avatar
                        photoUrl={member.avatarPhotoUrl}
                        emoji={member.avatarEmoji}
                        name={member.name}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {chore.title}
                          </span>
                          <CategoryBadge category={chore.category} size="xs" style={badgeStyle} />
                        </div>

                        <div className={`flex items-center gap-2 text-xs ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-500 dark:text-slate-400'} font-medium`}>
                          <span>{member.name}</span>
                          <span>•</span>
                          <span>{formatDisplayDate(log.date)}</span>
                        </div>

                        {log.feedbackNote && (
                          <p className="mt-1.5 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-900/60 italic leading-snug">
                            "{log.feedbackNote}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center pt-2 sm:pt-0">
                      <div className="flex items-center gap-1.5">
                        <div className="flex text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < (log.qualityScore || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                          {log.qualityGrade || 'A+'}
                        </span>
                      </div>

                      <span className="text-xs font-black text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950 px-3 py-1.5 rounded-2xl border border-amber-200 dark:border-amber-800 whitespace-nowrap shadow-2xs">
                        +{totalPts} pts
                      </span>

                      <button
                        onClick={() => {
                          soundFX.playPop();
                          onOpenInspect(chore, log);
                        }}
                        className="min-h-[38px] min-w-[38px] p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
                        title="Edit Grade & Feedback"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

