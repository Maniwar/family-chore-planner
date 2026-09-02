import React, { useState, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Search, 
  CheckCircle2, 
  Sparkles, 
  Plus, 
  BarChart3,
  Home,
  Users,
  Check,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  LayoutGrid,
  LayoutList,
  Sunrise,
  Sun,
  Moon,
  Bed,
  Clock
} from 'lucide-react';
import { Chore, ChoreAssignmentLog, HouseholdMember, ChoreCategory, TimeOfDay, ViewMode } from '../types';
import { ChoreCard } from './ChoreCard';
import { Avatar } from './Avatar';
import { WeeklyWorkloadChart } from './WeeklyWorkloadChart';
import { 
  formatDisplayDate, 
  parseLocalDate, 
  getTodayDateString, 
  isChoreScheduledForDate, 
  getChoreAssigneeForDate,
  loadStoredDailyLayout,
  saveDailyLayout 
} from '../utils/storage';
import { soundFX } from '../utils/audio';
import { SupportedLanguage, getTranslation, getCategoryTranslation } from '../utils/i18n';
import { ThemePreset, THEMES, isGlassTheme } from '../utils/theme';
import { BadgeStyle } from './CategoryBadge';

const ALL_CATEGORIES: ChoreCategory[] = [
  'Kitchen',
  'Living Room',
  'Bedrooms',
  'Bathrooms',
  'Pets',
  'Laundry',
  'Yard & Outdoor',
  'Daily Routine',
  'General',
];

interface DailyScheduleViewProps {
  currentDateStr: string;
  onDateChange: (dateStr: string) => void;
  chores: Chore[];
  logs: ChoreAssignmentLog[];
  members: HouseholdMember[];
  selectedMemberId: string;
  onSelectMember?: (memberId: string) => void;
  isMomMode: boolean;
  language?: SupportedLanguage;
  currentTheme?: ThemePreset;
  badgeStyle?: BadgeStyle;
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
  onMarkComplete: (choreId: string, note?: string, checklist?: { [key: number]: boolean }) => void;
  onOpenInspect: (chore: Chore, log: ChoreAssignmentLog) => void;
  onQuickApprove: (choreId: string, logId: string) => void;
  onOpenNewChore: () => void;
  onBatchApproveAll: (logsToApprove: { chore: Chore; log: ChoreAssignmentLog }[]) => void;
  onEditChore: (chore: Chore) => void;
  onOpenAIAssign?: () => void;
  onOpenGoogleCalendar?: () => void;
  onNavigateView?: (view: ViewMode) => void;
}

export const DailyScheduleView: React.FC<DailyScheduleViewProps> = ({
  currentDateStr,
  onDateChange,
  chores,
  logs,
  members,
  selectedMemberId,
  onSelectMember,
  isMomMode,
  language = 'en',
  currentTheme = 'rose',
  badgeStyle = 'pastel',
  viewMode: propViewMode,
  onViewModeChange,
  onMarkComplete,
  onOpenInspect,
  onQuickApprove,
  onOpenNewChore,
  onBatchApproveAll,
  onEditChore,
  onOpenAIAssign,
  onOpenGoogleCalendar,
  onNavigateView,
}) => {
  const t = getTranslation(language);
  const theme = THEMES[currentTheme] || THEMES.rose;
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showWorkloadChart, setShowWorkloadChart] = useState<boolean>(false);
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  const [internalViewMode, setInternalViewMode] = useState<'list' | 'grid'>(() => loadStoredDailyLayout());

  const effectiveViewMode = propViewMode !== undefined ? propViewMode : internalViewMode;

  const handleToggleViewMode = (newMode: 'list' | 'grid') => {
    soundFX.playPop();
    setInternalViewMode(newMode);
    saveDailyLayout(newMode);
    if (onViewModeChange) {
      onViewModeChange(newMode);
    }
  };

  // Swipe Gestures for Day Navigation
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);

  const isToday = currentDateStr === getTodayDateString();

  // Navigation handlers
  const handlePrevDay = () => {
    soundFX.playPop();
    const d = parseLocalDate(currentDateStr);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    soundFX.playPop();
    const d = parseLocalDate(currentDateStr);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleJumpToday = () => {
    soundFX.playPop();
    onDateChange(getTodayDateString());
  };

  // Day Container Swipe Listener
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    isHorizontalSwipeRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartXRef.current;
    const diffY = touch.clientY - touchStartYRef.current;

    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > 12 || Math.abs(diffY) > 12) {
        isHorizontalSwipeRef.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null && isHorizontalSwipeRef.current === true) {
      const touch = e.changedTouches[0];
      const diffX = touch.clientX - touchStartXRef.current;
      const SWIPE_DAY_THRESHOLD = 90;

      if (diffX > SWIPE_DAY_THRESHOLD) {
        // Swiped Right -> Go to Previous Day
        handlePrevDay();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(15); } catch {}
        }
      } else if (diffX < -SWIPE_DAY_THRESHOLD) {
        // Swiped Left -> Go to Next Day
        handleNextDay();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(15); } catch {}
        }
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    isHorizontalSwipeRef.current = null;
  };

  // Generate 7-day ribbon centered on current date
  const generateWeekRibbon = () => {
    const curr = parseLocalDate(currentDateStr);
    const days = [];
    for (let offset = -3; offset <= 3; offset++) {
      const d = new Date(curr);
      d.setDate(curr.getDate() + offset);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString(language === 'tl' ? 'fil-PH' : 'en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const isSelected = dateStr === currentDateStr;
      const isDateToday = dateStr === getTodayDateString();
      const choreCount = chores.filter(c => isChoreScheduledForDate(c, dateStr)).length;
      days.push({ dateStr, dayName, dayNum, isSelected, isDateToday, choreCount });
    }
    return days;
  };

  const weekDaysRibbon = generateWeekRibbon();

  // Find assigned chores for this date
  const scheduledChores = chores.filter((chore) => {
    if (!isChoreScheduledForDate(chore, currentDateStr)) {
      return false;
    }
    const effectiveAssigneeId = getChoreAssigneeForDate(chore, currentDateStr);
    if (selectedMemberId !== 'all' && effectiveAssigneeId !== selectedMemberId) {
      return false;
    }
    return true;
  });

  // Pair chores with their logs for this date
  const choresWithLogs = scheduledChores.map((chore) => {
    const log = logs.find((l) => l.choreId === chore.id && l.date === currentDateStr);
    const effectiveAssigneeId = getChoreAssigneeForDate(chore, currentDateStr);
    const assignee = members.find((m) => m.id === effectiveAssigneeId);
    return { chore, log, assignee };
  });

  // Calculate metrics
  const totalChores = choresWithLogs.length;
  const approvedCount = choresWithLogs.filter((item) => item.log?.status === 'approved').length;
  const reviewCount = choresWithLogs.filter((item) => item.log?.status === 'needs_review').length;
  const redoCount = choresWithLogs.filter((item) => item.log?.status === 'needs_redo').length;
  const pendingCount = choresWithLogs.filter((item) => !item.log || item.log.status === 'pending' || item.log.status === 'needs_redo').length;
  const pointsEarnedToday = choresWithLogs
    .filter((item) => item.log?.status === 'approved')
    .reduce((sum, item) => sum + (item.log?.pointsAwarded || item.chore.defaultPoints) + (item.log?.bonusPoints || 0), 0);

  const completionPercentage = totalChores > 0 ? Math.round((approvedCount / totalChores) * 100) : 0;

  // Filter items
  const filtered = choresWithLogs.filter(({ chore, log, assignee }) => {
    if (selectedTimeFilter !== 'all') {
      if (selectedTimeFilter === 'morning' && chore.timeOfDay !== 'morning') return false;
      if (selectedTimeFilter === 'afternoon' && chore.timeOfDay !== 'afternoon') return false;
      if (selectedTimeFilter === 'evening' && chore.timeOfDay !== 'evening') return false;
      if (selectedTimeFilter === 'bedtime' && chore.timeOfDay !== 'bedtime') return false;
    }

    if (selectedCategoryFilter !== 'all' && chore.category !== selectedCategoryFilter) {
      return false;
    }

    if (selectedStatusFilter !== 'all') {
      const status = log?.status || 'pending';
      if (selectedStatusFilter === 'pending' && status !== 'pending') return false;
      if (selectedStatusFilter === 'needs_review' && status !== 'needs_review') return false;
      if (selectedStatusFilter === 'approved' && status !== 'approved') return false;
      if (selectedStatusFilter === 'needs_redo' && status !== 'needs_redo') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = chore.title.toLowerCase().includes(q);
      const matchDesc = chore.description?.toLowerCase().includes(q);
      const matchMember = assignee?.name.toLowerCase().includes(q);
      const matchCat = chore.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchMember && !matchCat) return false;
    }

    return true;
  });

  // Intelligent Sorting for Daily Tasks (Apple HIG & Information Architecture):
  // 1. Status Priority: Needs Redo (urgent) -> Pending (to-do) -> Needs Review (in-progress) -> Approved (done)
  // 2. Chronological Scheduled Time: Morning (8:00 AM) -> Afternoon -> Evening -> Bedtime -> Anytime
  // 3. Title alphabetically for clean predictability
  const getStatusRank = (status?: string): number => {
    switch (status) {
      case 'needs_redo': return 0;
      case 'pending':
      case undefined: return 1;
      case 'needs_review': return 2;
      case 'approved': return 3;
      default: return 1;
    }
  };

  const getChoreSortTime = (chore: Chore): number => {
    if (chore.scheduledTime && chore.scheduledTime.includes(':')) {
      const [h, m] = chore.scheduledTime.split(':').map(Number);
      return (isNaN(h) ? 12 : h) * 60 + (isNaN(m) ? 0 : m);
    }
    switch (chore.timeOfDay) {
      case 'morning': return 8 * 60; // 8:00 AM
      case 'afternoon': return 13 * 60; // 1:00 PM
      case 'evening': return 18 * 60; // 6:00 PM
      case 'bedtime': return 20 * 60; // 8:00 PM
      default: return 12 * 60; // 12:00 PM
    }
  };

  const sortedFiltered = [...filtered].sort((a, b) => {
    const rankA = getStatusRank(a.log?.status);
    const rankB = getStatusRank(b.log?.status);
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    const timeA = getChoreSortTime(a.chore);
    const timeB = getChoreSortTime(b.chore);
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    return a.chore.title.localeCompare(b.chore.title);
  });

  const pendingInspectionItems = choresWithLogs
    .filter((item) => item.log && item.log.status === 'needs_review')
    .map((item) => ({ chore: item.chore, log: item.log! }));

  const categories = ALL_CATEGORIES;
  const selectedMemberObj = members.find((m) => m.id === selectedMemberId);

  const activeFilterCount = 
    (selectedTimeFilter !== 'all' ? 1 : 0) + 
    (selectedCategoryFilter !== 'all' ? 1 : 0) + 
    (selectedStatusFilter !== 'all' ? 1 : 0) + 
    (searchQuery.trim() ? 1 : 0);

  return (
    <div 
      className="space-y-3 sm:space-y-5 pb-16 sm:pb-4"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile iOS Ultra-Compact Header & Unified Filter Architecture */}
      <div className={`sm:hidden ${isGlassTheme(currentTheme) ? 'apple-glass-dock' : 'bg-white border border-slate-200'} rounded-3xl p-3 space-y-2.5 shadow-sm transition-all`}>
        {/* Row 1: Apple HIG Date Header with Navigation & View Controls */}
        <div className="flex items-center justify-between gap-2 px-0.5">
          {/* Date Segment with Touch Targets */}
          <div className="flex items-center gap-1 min-w-0">
            <button
              onClick={handlePrevDay}
              aria-label="Previous day"
              className={`p-1.5 rounded-xl transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer active:scale-95 shrink-0 ${
                isGlassTheme(currentTheme)
                  ? 'hover:bg-white/60 text-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="min-w-0">
              <h1 className="text-sm font-black tracking-tight text-slate-950 leading-tight whitespace-nowrap flex items-center gap-1.5">
                <span>{isToday ? 'Today' : formatDisplayDate(currentDateStr).split(',')[0]}</span>
                <span className="text-xs font-semibold text-slate-600">
                  {formatDisplayDate(currentDateStr).split(',').slice(1).join(',')}
                </span>
              </h1>
            </div>

            <button
              onClick={handleNextDay}
              aria-label="Next day"
              className={`p-1.5 rounded-xl transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer active:scale-95 shrink-0 ${
                isGlassTheme(currentTheme)
                  ? 'hover:bg-white/60 text-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {/* Header Right Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!isToday && (
              <button
                onClick={handleJumpToday}
                className={`text-[11px] font-extrabold ${theme.badgeText} ${theme.badgeBg} border ${theme.badgeBorder} px-2.5 py-1 rounded-full active:scale-95 cursor-pointer min-h-[30px] shadow-2xs`}
              >
                Today
              </button>
            )}

            {/* Layout Toggle (List vs Grid) */}
            <div className={`flex items-center p-0.5 rounded-xl border ${
              isGlassTheme(currentTheme) ? 'bg-white/30 border-white/20' : 'bg-slate-100/90 border-slate-200'
            }`}>
              <button
                onClick={() => handleToggleViewMode('list')}
                className={`p-1 rounded-lg transition-all min-h-[28px] min-w-[28px] flex items-center justify-center cursor-pointer ${
                  effectiveViewMode === 'list' 
                    ? 'bg-white text-slate-950 shadow-xs font-black' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="List View"
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleToggleViewMode('grid')}
                className={`p-1 rounded-lg transition-all min-h-[28px] min-w-[28px] flex items-center justify-center cursor-pointer ${
                  effectiveViewMode === 'grid' 
                    ? 'bg-white text-slate-950 shadow-xs font-black' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: 7-Day Week Ribbon (Grid of 7 equal columns) */}
        <div className={`${isGlassTheme(currentTheme) ? 'bg-white/40 border border-white/20' : 'bg-slate-50 border border-slate-200'} rounded-2xl p-1 shadow-2xs`}>
          <div className="grid grid-cols-7 gap-1">
            {weekDaysRibbon.map((item) => (
              <button
                key={item.dateStr}
                onClick={() => {
                  soundFX.playPop();
                  onDateChange(item.dateStr);
                }}
                className={`w-full py-1.5 px-0.5 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer min-h-[42px] touch-target ${
                  item.isSelected
                    ? `${theme.primaryBg} ${theme.primaryText} shadow-xs font-black scale-[1.02]`
                    : item.isDateToday
                    ? `${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder} font-bold`
                    : 'bg-transparent text-slate-800 hover:bg-white/80'
                }`}
              >
                <span className="text-[10px] uppercase font-black tracking-wider opacity-85 leading-none">
                  {item.dayName.slice(0, 3)}
                </span>
                <span className="text-xs font-black mt-1 leading-none">
                  {item.dayNum}
                </span>
                {item.choreCount > 0 && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-1 ${item.isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Daily Summary Metric Bar */}
        <div className="flex items-center justify-between gap-1.5 px-0.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className={`inline-flex items-center gap-1 font-bold text-slate-900 ${
              isGlassTheme(currentTheme) ? 'bg-white/40 border-white/20' : 'bg-slate-100/90 border-slate-200/80'
            } px-2.5 py-1 rounded-full border text-[11px] shadow-2xs shrink-0`}>
              <span className="text-emerald-600 font-black">✓</span>
              <span>{approvedCount}/{totalChores} done</span>
            </span>
            <span className="inline-flex items-center gap-1 font-black text-amber-950 bg-amber-50/90 px-2.5 py-1 rounded-full border border-amber-200/80 text-[11px] shadow-2xs shrink-0">
              <span>⭐</span>
              <span>+{pointsEarnedToday} pts</span>
            </span>
          </div>

          {/* Quick Matrix View Shortcut */}
          {onNavigateView && (
            <button
              onClick={() => onNavigateView('weekly')}
              className={`text-[11px] font-black text-indigo-900 ${
                isGlassTheme(currentTheme) ? 'bg-indigo-50/90 border-indigo-200/90' : 'bg-indigo-50 border-indigo-200/80'
              } border px-2.5 py-1 rounded-full active:scale-95 cursor-pointer shadow-2xs shrink-0 ml-auto`}
            >
              Weekly Matrix 📅
            </button>
          )}
        </div>

        {/* Row 4: Horizontal Helper & Time Filter Bar with Smooth Scroll & Full Bleed */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 -mx-2 px-2 touch-pan-x" onTouchStart={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
          {/* Quick Search & Filter Trigger */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer min-h-[32px] shrink-0 active:scale-95 shadow-2xs ${
              activeFilterCount > 0 || showMobileFilters
                ? (isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : 'bg-indigo-600 text-white border-indigo-600 shadow-xs')
                : isGlassTheme(currentTheme)
                ? 'bg-white/40 border-white/20 text-slate-800 hover:bg-white'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Search and Filters"
          >
            <Filter className="w-3 h-3" />
            <span>{activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filter'}</span>
          </button>

          {/* All Helpers Chip */}
          <button
            onClick={() => {
              soundFX.playPop();
              if (onSelectMember) onSelectMember('all');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[32px] active:scale-95 border shadow-2xs ${
              selectedMemberId === 'all'
                ? `${theme.primaryBg} ${theme.primaryText} border-transparent font-black`
                : isGlassTheme(currentTheme)
                ? 'bg-white/40 text-slate-800 hover:bg-white border-white/20'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <Home className="w-3 h-3" />
            <span>All ({chores.filter(c => isChoreScheduledForDate(c, currentDateStr)).length})</span>
          </button>

          {members.map((m) => {
            const isSelected = selectedMemberId === m.id;
            const count = chores.filter(c => c.assignedMemberId === m.id && isChoreScheduledForDate(c, currentDateStr)).length;
            return (
              <button
                key={m.id}
                onClick={() => {
                  soundFX.playPop();
                  if (onSelectMember) onSelectMember(m.id);
                }}
                className={`px-2.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[32px] active:scale-95 border shadow-2xs ${
                  isSelected
                    ? `${theme.primaryBg} ${theme.primaryText} border-transparent font-black`
                    : isGlassTheme(currentTheme)
                    ? 'bg-white/40 hover:bg-white text-slate-800 border-white/20'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <Avatar photoUrl={m.avatarPhotoUrl} emoji={m.avatarEmoji} name={m.name} size="xs" showBorder={false} />
                <span>{m.name.split(' ')[0]}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isSelected ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}

          {/* Time-of-Day Quick Pills */}
          {[
            { id: 'morning', label: 'Morning', icon: Sunrise },
            { id: 'afternoon', label: 'Afternoon', icon: Sun },
            { id: 'evening', label: 'Evening', icon: Moon },
            { id: 'bedtime', label: 'Bedtime', icon: Bed },
          ].map((timeTab) => {
            const Icon = timeTab.icon;
            const isSelected = selectedTimeFilter === timeTab.id;
            const count = choresWithLogs.filter(c => c.chore.timeOfDay === timeTab.id).length;
            if (count === 0 && selectedTimeFilter !== timeTab.id) return null;
            return (
              <button
                key={timeTab.id}
                onClick={() => {
                  soundFX.playPop();
                  setSelectedTimeFilter(isSelected ? 'all' : timeTab.id);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[32px] active:scale-95 border ${
                  isSelected
                    ? 'bg-amber-500 text-white border-amber-500 shadow-2xs font-bold'
                    : isGlassTheme(currentTheme)
                    ? 'bg-white/30 hover:bg-white/40 text-slate-600 border-white/20  shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{timeTab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Expandable Search & Filters Drawer for Mobile */}
        {showMobileFilters && (
          <div className={`p-3 rounded-2xl border space-y-2.5 shadow-xs animate-in slide-in-from-top-2 duration-150 ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20' : 'bg-white border-slate-200'}`}>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t.searchChoresPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <select
                value={selectedTimeFilter}
                onChange={(e) => setSelectedTimeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs font-semibold"
              >
                <option value="all">⏰ All Times</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="bedtime">Bedtime</option>
              </select>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs font-semibold"
              >
                <option value="all">🏠 All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{getCategoryTranslation(cat, language)}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              {activeFilterCount > 0 ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTimeFilter('all');
                    setSelectedCategoryFilter('all');
                    setSelectedStatusFilter('all');
                  }}
                  className="text-xs font-bold text-rose-600 p-1 cursor-pointer"
                >
                  Reset All Filters
                </button>
              ) : <div />}

              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Actionable Redo Notification for Helpers */}
        {redoCount > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs text-rose-900 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">🔄</span>
              <span className="font-bold truncate">
                {redoCount} {redoCount === 1 ? 'chore needs' : 'chores need'} a touch-up to get approved!
              </span>
            </div>
            <button
              onClick={() => {
                soundFX.playPop();
                setSelectedStatusFilter('needs_redo');
              }}
              className="text-[11px] font-black bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg shrink-0 cursor-pointer shadow-2xs"
            >
              View
            </button>
          </div>
        )}
      </div>

      {/* Desktop Top Banner / Date Control Bar */}
      <div className={`hidden sm:block ${isGlassTheme(currentTheme) ? 'apple-glass-card' : theme.cardBg} rounded-2xl border ${isGlassTheme(currentTheme) ? 'border-white/20' : theme.cardBorder} p-4 sm:p-6 shadow-xs transition-colors duration-200`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          
          {/* Date Selector (Desktop) */}
          <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-start">
            <div className={`flex items-center ${isGlassTheme(currentTheme) ? 'apple-glass-pill' : 'bg-slate-100/90 border-slate-200'} p-1 rounded-xl border shadow-2xs`}>
              <button
                id="daily-prev-day-btn"
                onClick={handlePrevDay}
                className={`p-2 ${isGlassTheme(currentTheme) ? 'hover:bg-white/40' : 'hover:bg-white'} rounded-lg text-slate-700 transition-colors cursor-pointer active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center`}
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-2.5 sm:px-3 py-1 text-xs font-bold text-slate-900 flex items-center gap-1.5 whitespace-nowrap">
                <Calendar className={`w-3.5 h-3.5 ${theme.badgeText}`} />
                <span>{formatDisplayDate(currentDateStr)}</span>
                {isToday && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isGlassTheme(currentTheme) ? 'apple-glass-pill text-sky-950' : `${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}`}>
                    Today
                  </span>
                )}
              </div>

              <button
                id="daily-next-day-btn"
                onClick={handleNextDay}
                className={`p-2 ${isGlassTheme(currentTheme) ? 'hover:bg-white/40' : 'hover:bg-white'} rounded-lg text-slate-700 transition-colors cursor-pointer active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center`}
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {!isToday && (
              <button
                id="daily-jump-today-btn"
                onClick={handleJumpToday}
                className={`text-xs font-bold ${isGlassTheme(currentTheme) ? 'apple-glass-button text-slate-800' : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200'} px-3 py-2 rounded-xl transition-colors border cursor-pointer active:scale-95 min-h-[44px]`}
              >
                {t.jumpToToday}
              </button>
            )}

            {onNavigateView && (
              <div className="flex items-center gap-1.5 ml-1">
                <button
                  onClick={() => onNavigateView('weekly')}
                  className={`text-xs font-bold ${isGlassTheme(currentTheme) ? 'apple-glass-button text-indigo-950 bg-indigo-50/70 border-indigo-200/80' : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200'} border px-3 py-2 rounded-xl transition-colors cursor-pointer active:scale-95 flex items-center gap-1 min-h-[44px]`}
                  title="Switch to 7-Day Weekly Chore Matrix"
                >
                  <span>📅</span>
                  <span>Weekly Matrix</span>
                </button>
                <button
                  onClick={() => onNavigateView('reports')}
                  className={`text-xs font-bold ${isGlassTheme(currentTheme) ? 'apple-glass-button text-rose-950 bg-rose-50/70 border-rose-200/80' : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200'} border px-3 py-2 rounded-xl transition-colors cursor-pointer active:scale-95 flex items-center gap-1 min-h-[44px]`}
                  title="Print Fridge Chore Schedules & Punchcards"
                >
                  <span>🖨️</span>
                  <span>Print Chart</span>
                </button>
                <button
                  onClick={() => onNavigateView('calendar')}
                  className={`text-xs font-bold ${isGlassTheme(currentTheme) ? 'apple-glass-button text-slate-800' : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200'} border px-3 py-2 rounded-xl transition-colors cursor-pointer active:scale-95 flex items-center gap-1 min-h-[44px]`}
                  title="Switch to Monthly Calendar"
                >
                  <span>🗓️</span>
                  <span>Calendar</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Stats Metric Pills */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3">
            <div className={`${isGlassTheme(currentTheme) ? 'apple-glass-pill' : 'bg-slate-50 border border-slate-200'} rounded-xl px-3 py-1.5 flex items-center justify-between sm:justify-start gap-2 border shadow-2xs`}>
              <div className="text-left sm:text-right">
                <p className="text-[10px] uppercase font-extrabold text-slate-400">Total Done</p>
                <p className="text-sm font-extrabold text-slate-900">{approvedCount} / {totalChores}</p>
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                {completionPercentage}%
              </div>
            </div>

            <div className={`${isGlassTheme(currentTheme) ? 'apple-glass-pill' : 'bg-slate-50 border border-slate-200'} rounded-xl px-3 py-1.5 flex items-center justify-between sm:justify-start gap-2 border shadow-2xs`}>
              <div className="text-left sm:text-right">
                <p className="text-[10px] uppercase font-extrabold text-slate-400">Points Awarded</p>
                <p className="text-sm font-extrabold text-amber-900">+{pointsEarnedToday} {t.pts}</p>
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                ⭐
              </div>
            </div>
          </div>
        </div>

        {/* Completion Progress Bar */}
        <div className="mt-3.5 pt-3 border-t border-slate-100/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700 truncate mr-2">
              {selectedMemberObj ? `${selectedMemberObj.name}'s Progress` : 'Family Daily Progress'} ({approvedCount} approved, {reviewCount} waiting review)
            </span>
            <span className="font-extrabold text-slate-900 shrink-0">{completionPercentage}%</span>
          </div>
          <div className={`w-full ${isGlassTheme(currentTheme) ? 'bg-black/10 border border-white/40' : 'bg-slate-100'} rounded-full h-2.5 overflow-hidden flex`}>
            <div 
              className="bg-emerald-500 h-full transition-all duration-500" 
              style={{ width: `${(approvedCount / (totalChores || 1)) * 100}%` }}
              title="Approved Chores"
            />
            <div 
              className="bg-amber-400 h-full transition-all duration-500 animate-pulse" 
              style={{ width: `${(reviewCount / (totalChores || 1)) * 100}%` }}
              title="Awaiting Mom's Inspection"
            />
          </div>
        </div>

        {/* Mom Inspection Action Banner */}
        {isMomMode && pendingInspectionItems.length > 0 && (
          <div className="mt-3.5 p-3 sm:p-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs border border-white/40">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-base shrink-0">
                ✨
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">
                  {pendingInspectionItems.length} {pendingInspectionItems.length > 1 ? 'chores are' : 'chore is'} waiting for Mom's quality check!
                </p>
                <p className="text-[11px] text-amber-100">
                  Inspect checklist criteria, award stars, and give encouragement.
                </p>
              </div>
            </div>

            <button
              id="batch-approve-all-btn"
              onClick={() => {
                soundFX.playFanfare();
                onBatchApproveAll(pendingInspectionItems);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-white text-amber-900 hover:bg-amber-50 shadow-xs transition-transform active:scale-[0.98] whitespace-nowrap cursor-pointer min-h-[44px]"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{t.quickBatchApprove} (5⭐)</span>
            </button>
          </div>
        )}
      </div>

      {/* Desktop Contextual Helper Filter Chips */}
      {onSelectMember && (
        <div className={`hidden sm:block ${isGlassTheme(currentTheme) ? 'apple-glass-card' : theme.cardBg} rounded-2xl border ${isGlassTheme(currentTheme) ? 'border-white/20' : theme.cardBorder} p-3 sm:p-4 shadow-xs space-y-2`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${isGlassTheme(currentTheme) ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500'}`}>
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>Filter Chores by Helper</span>
            </span>
            {selectedMemberId !== 'all' && (
              <button
                onClick={() => {
                  soundFX.playPop();
                  onSelectMember('all');
                }}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors p-1 cursor-pointer"
              >
                Clear (Show All)
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs" onTouchStart={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
            {/* All Helpers Chip */}
            <button
              id="daily-filter-all-helpers"
              onClick={() => {
                soundFX.playPop();
                onSelectMember('all');
              }}
              className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 border ${
                selectedMemberId === 'all'
                  ? isGlassTheme(currentTheme)
                    ? (isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : 'bg-sky-500 text-white border-white/20 shadow-md font-black')
                    : 'bg-slate-900 text-white shadow-xs border-transparent'
                  : isGlassTheme(currentTheme)
                  ? 'apple-glass-pill text-slate-800'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-transparent'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>{t.wholeFamily}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                selectedMemberId === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
              }`}>
                {chores.filter(c => isChoreScheduledForDate(c, currentDateStr)).length}
              </span>
            </button>

            {/* Per-Member Filter Chips */}
            {members.map((m) => {
              const isSelected = selectedMemberId === m.id;
              const memberChoreCount = chores.filter(c => c.assignedMemberId === m.id && isChoreScheduledForDate(c, currentDateStr)).length;
              return (
                <button
                  key={m.id}
                  id={`daily-filter-member-${m.id}`}
                  onClick={() => {
                    soundFX.playPop();
                    onSelectMember(m.id);
                  }}
                  className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-2 shrink-0 cursor-pointer active:scale-95 border ${
                    isSelected
                      ? isGlassTheme(currentTheme)
                        ? (isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : 'bg-sky-500 text-white border-white/20 shadow-md font-black')
                        : `${theme.primaryBg} text-white shadow-xs border-transparent`
                      : isGlassTheme(currentTheme)
                      ? 'apple-glass-pill text-slate-800'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-transparent'
                  }`}
                >
                  <Avatar
                    photoUrl={m.avatarPhotoUrl}
                    emoji={m.avatarEmoji}
                    name={m.name}
                    size="xs"
                    showBorder={false}
                  />
                  <span className="truncate max-w-[100px]">{m.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isSelected ? 'bg-black/20 text-white' : 'bg-slate-200/80 text-slate-700'
                  }`}>
                    {memberChoreCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Desktop Filter and Search Bar */}
      <div className={`hidden sm:block ${isGlassTheme(currentTheme) ? 'apple-glass-card' : theme.cardBg} rounded-2xl border ${isGlassTheme(currentTheme) ? 'border-white/20' : theme.cardBorder} p-3 sm:p-4 space-y-3 shadow-xs transition-colors duration-200`}>
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search box */}
          <div className="relative w-full lg:w-64 xl:w-80 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.searchChoresPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border ${
                isGlassTheme(currentTheme)
                  ? 'apple-glass-input bg-white/70 border-white/20 text-slate-900 placeholder:text-slate-500'
                  : `border-slate-200 focus:outline-hidden focus:ring-2 ${theme.accentRing} bg-slate-50/50`
              }`}
            />
          </div>

          {/* Quick Filter Bar */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Time Filter */}
            <select
              value={selectedTimeFilter}
              onChange={(e) => {
                soundFX.playPop();
                setSelectedTimeFilter(e.target.value);
              }}
              className={`${
                isGlassTheme(currentTheme)
                  ? 'apple-glass-pill bg-white/20 border-white/20 text-slate-900 shadow-2xs font-bold'
                  : 'bg-slate-50 border border-slate-200 text-slate-700'
              } py-2 px-2.5 rounded-xl text-xs font-semibold cursor-pointer border`}
            >
              <option value="all">⏰ {t.filterAllTimes}</option>
              <option value="morning">{t.todMorning}</option>
              <option value="afternoon">{t.todAfternoon}</option>
              <option value="evening">{t.todEvening}</option>
              <option value="bedtime">{t.todBedtime}</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => {
                soundFX.playPop();
                setSelectedCategoryFilter(e.target.value);
              }}
              className={`${
                isGlassTheme(currentTheme)
                  ? 'apple-glass-pill bg-white/20 border-white/20 text-slate-900 shadow-2xs font-bold'
                  : 'bg-slate-50 border border-slate-200 text-slate-700'
              } py-2 px-2.5 rounded-xl text-xs font-semibold cursor-pointer border`}
            >
              <option value="all">🏠 {t.filterAllCategories}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{getCategoryTranslation(cat, language)}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                soundFX.playPop();
                setSelectedStatusFilter(e.target.value);
              }}
              className={`${
                isGlassTheme(currentTheme)
                  ? 'apple-glass-pill bg-white/20 border-white/20 text-slate-900 shadow-2xs font-bold'
                  : 'bg-slate-50 border border-slate-200 text-slate-700'
              } py-2 px-2.5 rounded-xl text-xs font-semibold cursor-pointer border`}
            >
              <option value="all">📌 {t.filterAllStatuses}</option>
              <option value="pending">Pending</option>
              <option value="needs_review">Awaiting Inspection</option>
              <option value="approved">Approved & Graded</option>
              <option value="needs_redo">Needs Redo</option>
            </select>

            {/* Workload Balance Chart Toggle */}
            <button
              onClick={() => {
                soundFX.playPop();
                setShowWorkloadChart(!showWorkloadChart);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer active:scale-95 ${
                showWorkloadChart
                  ? (isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : 'bg-indigo-600 text-white border-indigo-600 shadow-xs')
                  : isGlassTheme(currentTheme)
                  ? 'apple-glass-button text-slate-800'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="Toggle Weekly Workload Balance Chart"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.workloadChart}</span>
            </button>

            {/* AI Auto-Assign Shortcut (Mom Mode Only) */}
            {isMomMode && onOpenAIAssign && (
              <button
                onClick={() => {
                  soundFX.playPop();
                  onOpenAIAssign();
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold ${
                  isGlassTheme(currentTheme)
                    ? 'apple-glass-button-primary'
                    : (isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : 'bg-indigo-600 hover:bg-indigo-700 text-white')
                } shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95`}
                title="AI Auto-Assign Chores"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">{t.aiAutoAssign}</span>
              </button>
            )}

            {/* Google Calendar Shortcut */}
            {onOpenGoogleCalendar && (
              <button
                onClick={() => {
                  soundFX.playPop();
                  onOpenGoogleCalendar();
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold ${
                  isGlassTheme(currentTheme)
                    ? 'apple-glass-button text-slate-800'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                } border transition-colors flex items-center gap-1 shrink-0 cursor-pointer active:scale-95`}
                title="Google Calendar Sync"
              >
                <span>📅</span>
                <span className="hidden sm:inline">{t.googleCalendar}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Conditionally Expanded Workload Distribution Chart */}
      {showWorkloadChart && (
        <WeeklyWorkloadChart
          chores={chores}
          members={members}
          centerDateStr={currentDateStr}
          onSelectDate={(d) => {
            soundFX.playPop();
            onDateChange(d);
          }}
          showInsights={true}
        />
      )}

      {/* Scheduled Chores Prominent Glass Section Header Bar (Mobile & Desktop) */}
      <div className={`${isGlassTheme(currentTheme) ? 'apple-glass-dock p-3 sm:p-4 rounded-2xl border border-white/20' : 'bg-white/40 p-3 sm:p-4 rounded-2xl border border-slate-200/80'} flex flex-wrap items-center justify-between gap-3 shadow-2xs transition-all`}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className={`w-8 h-8 rounded-xl ${isGlassTheme(currentTheme) ? 'bg-white/40 text-sky-600 shadow-2xs border border-white/20' : 'bg-slate-100 text-slate-700'} flex items-center justify-center font-bold text-sm shrink-0`}>
            📋
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate">
              {selectedMemberObj ? `${selectedMemberObj.name}'s Chores` : <><span className="hidden sm:inline">Scheduled Chores</span><span className="sm:hidden">Chores</span></>}
            </h2>
            <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full shrink-0 ${
              isGlassTheme(currentTheme)
                ? 'apple-glass-pill bg-white/20 text-sky-950 border border-white/20 shadow-2xs'
                : 'bg-slate-200/80 text-slate-700'
            }`}>
              {filtered.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {/* Desktop/Tablet Layout Toggle */}
          <div className={`hidden sm:flex items-center ${isGlassTheme(currentTheme) ? 'apple-glass-pill' : 'bg-slate-100 border-slate-200'} p-0.5 rounded-xl border shadow-2xs`}>
            <button
              onClick={() => handleToggleViewMode('list')}
              className={`p-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-1 cursor-pointer ${
                effectiveViewMode === 'list' 
                  ? isGlassTheme(currentTheme)
                    ? 'apple-glass-pill bg-white/20 text-slate-950 font-black shadow-xs border-white/20'
                    : 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="List View"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="text-[11px]">List</span>
            </button>
            <button
              onClick={() => handleToggleViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-1 cursor-pointer ${
                effectiveViewMode === 'grid' 
                  ? isGlassTheme(currentTheme)
                    ? 'apple-glass-pill bg-white/20 text-slate-950 font-black shadow-xs border-white/20'
                    : 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Compact Tiles View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-[11px]">Compact</span>
            </button>
          </div>

          {/* Mom Mode Add Chore Action - Contextually placed right above chores list */}
          {isMomMode && (
            <button
              id="contextual-add-chore-btn"
              onClick={() => {
                soundFX.playPop();
                onOpenNewChore();
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black ${
                isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : `${theme.primaryBg} ${theme.primaryText} ${theme.primaryHover}`
              } shadow-xs transition-all active:scale-95 cursor-pointer min-h-[36px]`}
              title="Create New Chore"
            >
              <Plus className="w-4 h-4" />
              <span>Add Chore</span>
            </button>
          )}
        </div>
      </div>

      {/* Chore Cards Grid */}
      {filtered.length === 0 ? (
        <div className={`${isGlassTheme(currentTheme) ? 'apple-glass-card' : 'bg-white'} rounded-2xl border ${isGlassTheme(currentTheme) ? 'border-white/20' : 'border-dashed border-slate-300'} p-8 sm:p-12 text-center`}>
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100/80 mx-auto flex items-center justify-center text-3xl mb-3">
            🎉
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {t.noChoresFound}
          </h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto mb-4">
            {scheduledChores.length === 0 
              ? t.allChoresDoneSubtitle 
              : t.addCustomChore}
          </p>
          {isMomMode && (
            <button
              onClick={() => {
                soundFX.playPop();
                onOpenNewChore();
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold ${theme.primaryBg} ${theme.primaryText} ${theme.primaryHover} transition-all shadow-xs cursor-pointer active:scale-95`}
            >
              <Plus className="w-4 h-4" />
              <span>{t.newChore}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {(() => {
            const timeGroups = [
              { id: 'morning', label: 'Morning Routines', emoji: '🌅', timeRange: '8:00 AM' },
              { id: 'afternoon', label: 'Afternoon Chores', emoji: '☀️', timeRange: '12:00 PM' },
              { id: 'evening', label: 'Evening Tasks', emoji: '🌆', timeRange: '5:00 PM' },
              { id: 'bedtime', label: 'Bedtime & Night', emoji: '🌙', timeRange: '8:00 PM' },
              { id: 'anytime', label: 'Anytime Today', emoji: '⭐', timeRange: 'Flexible' },
            ];

            // If a specific time of day is selected (and not 'all'), show just that group
            const visibleGroups = selectedTimeFilter === 'all'
              ? timeGroups
              : timeGroups.filter(g => g.id === selectedTimeFilter);

            // Collect chores into their respective time groups
            const groupedChores = visibleGroups.map(group => {
              const items = sortedFiltered.filter(item => {
                const tod = item.chore.timeOfDay || 'anytime';
                return tod === group.id;
              });
              return { ...group, items };
            }).filter(g => g.items.length > 0);

            // Fallback if no specific groups matched (or any leftover items)
            const matchedChoreIds = new Set(groupedChores.flatMap(g => g.items.map(i => i.chore.id)));
            const unassignedItems = sortedFiltered.filter(i => !matchedChoreIds.has(i.chore.id));
            if (unassignedItems.length > 0) {
              groupedChores.push({
                id: 'other',
                label: 'Other Household Routines',
                emoji: '📋',
                timeRange: 'Daily',
                items: unassignedItems,
              });
            }

            return groupedChores.map((group) => {
              const totalGroupPoints = group.items.reduce((sum, item) => sum + (item.chore.defaultPoints || 0), 0);
              const completedCount = group.items.filter(item => item.log?.status === 'approved').length;

              return (
                <div key={group.id} className="space-y-3">
                  {/* Apple VisionOS Frosted Glass Section Header Band */}
                  <div className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl ${
                    isGlassTheme(currentTheme) 
                      ? 'apple-glass-pill border-white/20 shadow-xs' 
                      : 'bg-slate-100/90 text-slate-900 border border-slate-200/80 shadow-2xs'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-base sm:text-lg shrink-0">{group.emoji}</span>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                        <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight truncate">
                          {group.label}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full shrink-0">
                          {group.timeRange}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                      <span className="text-[11px] font-extrabold text-slate-600 hidden sm:inline">
                        {completedCount}/{group.items.length} done
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 ${isGlassTheme(currentTheme) ? 'apple-glass-pill text-amber-900 dark:text-amber-200' : 'text-amber-900 bg-amber-100/90 rounded-full border border-amber-200/80 shadow-2xs'}`}>
                        <span>⭐</span>
                        <span>+{totalGroupPoints} pts</span>
                      </span>
                    </div>
                  </div>

                  {/* Chore Cards Grid */}
                  <div className={
                    effectiveViewMode === 'grid' 
                      ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3" 
                      : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
                  }>
                    {group.items.map(({ chore, log, assignee }) => (
                      <ChoreCard
                        key={`${chore.id}_${currentDateStr}`}
                        chore={chore}
                        log={log}
                        assignee={assignee}
                        isMomMode={isMomMode}
                        language={language}
                        currentTheme={currentTheme}
                        badgeStyle={badgeStyle}
                        viewMode={effectiveViewMode}
                        onMarkComplete={onMarkComplete}
                        onOpenInspect={onOpenInspect}
                        onQuickApprove={onQuickApprove}
                        onEditChore={onEditChore}
                      />
                    ))}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
};
