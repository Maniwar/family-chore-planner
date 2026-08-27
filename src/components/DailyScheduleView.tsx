import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Search, 
  CheckCircle2, 
  Sparkles, 
  Plus, 
  BarChart3
} from 'lucide-react';
import { Chore, ChoreAssignmentLog, HouseholdMember, ChoreCategory, TimeOfDay } from '../types';
import { ChoreCard } from './ChoreCard';
import { WeeklyWorkloadChart } from './WeeklyWorkloadChart';
import { formatDisplayDate, parseLocalDate, getTodayDateString, isChoreScheduledForDate } from '../utils/storage';
import { soundFX } from '../utils/audio';
import { SupportedLanguage, getTranslation, getCategoryTranslation } from '../utils/i18n';
import { ThemePreset, THEMES } from '../utils/theme';

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
  isMomMode: boolean;
  language?: SupportedLanguage;
  currentTheme?: ThemePreset;
  onMarkComplete: (choreId: string, note?: string, checklist?: { [key: number]: boolean }) => void;
  onOpenInspect: (chore: Chore, log: ChoreAssignmentLog) => void;
  onQuickApprove: (choreId: string, logId: string) => void;
  onOpenNewChore: () => void;
  onBatchApproveAll: (logsToApprove: { chore: Chore; log: ChoreAssignmentLog }[]) => void;
  onEditChore: (chore: Chore) => void;
  onOpenAIAssign?: () => void;
  onOpenGoogleCalendar?: () => void;
}

export const DailyScheduleView: React.FC<DailyScheduleViewProps> = ({
  currentDateStr,
  onDateChange,
  chores,
  logs,
  members,
  selectedMemberId,
  isMomMode,
  language = 'en',
  currentTheme = 'rose',
  onMarkComplete,
  onOpenInspect,
  onQuickApprove,
  onOpenNewChore,
  onBatchApproveAll,
  onEditChore,
  onOpenAIAssign,
  onOpenGoogleCalendar,
}) => {
  const t = getTranslation(language);
  const theme = THEMES[currentTheme] || THEMES.rose;
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showWorkloadChart, setShowWorkloadChart] = useState<boolean>(false);

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

  // Find assigned chores for this date
  const scheduledChores = chores.filter((chore) => {
    if (!isChoreScheduledForDate(chore, currentDateStr)) {
      return false;
    }
    if (selectedMemberId !== 'all' && chore.assignedMemberId !== selectedMemberId) {
      return false;
    }
    return true;
  });

  // Pair chores with their logs for this date
  const choresWithLogs = scheduledChores.map((chore) => {
    const log = logs.find((l) => l.choreId === chore.id && l.date === currentDateStr);
    const assignee = members.find((m) => m.id === chore.assignedMemberId);
    return { chore, log, assignee };
  });

  // Calculate metrics
  const totalChores = choresWithLogs.length;
  const approvedCount = choresWithLogs.filter((item) => item.log?.status === 'approved').length;
  const reviewCount = choresWithLogs.filter((item) => item.log?.status === 'needs_review').length;
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

  const pendingInspectionItems = choresWithLogs
    .filter((item) => item.log && item.log.status === 'needs_review')
    .map((item) => ({ chore: item.chore, log: item.log! }));

  const categories = ALL_CATEGORIES;

  const selectedMemberObj = members.find((m) => m.id === selectedMemberId);

  return (
    <div className="space-y-5">
      {/* Top Banner / Date Control Bar */}
      <div className={`${theme.cardBg} rounded-2xl border ${theme.cardBorder} p-4 sm:p-6 shadow-xs transition-colors duration-200`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Date Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                id="daily-prev-day-btn"
                onClick={handlePrevDay}
                className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-colors cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 py-1 text-xs font-bold text-slate-900 flex items-center gap-1.5 whitespace-nowrap">
                <Calendar className={`w-3.5 h-3.5 ${theme.badgeText}`} />
                <span>{formatDisplayDate(currentDateStr)}</span>
                {isToday && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}>
                    Today
                  </span>
                )}
              </div>

              <button
                id="daily-next-day-btn"
                onClick={handleNextDay}
                className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-colors cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {!isToday && (
              <button
                id="daily-jump-today-btn"
                onClick={handleJumpToday}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors border border-slate-200 cursor-pointer"
              >
                {t.jumpToToday}
              </button>
            )}
          </div>

          {/* Quick Stats Metric Pills */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <div className="text-right">
                <p className="text-[10px] uppercase font-extrabold text-slate-400">Total Done</p>
                <p className="text-sm font-extrabold text-slate-900">{approvedCount} / {totalChores}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                {completionPercentage}%
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <div className="text-right">
                <p className="text-[10px] uppercase font-extrabold text-slate-400">Points Awarded</p>
                <p className="text-sm font-extrabold text-amber-900">+{pointsEarnedToday} {t.pts}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                ⭐
              </div>
            </div>
          </div>
        </div>

        {/* Completion Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-600">
              {selectedMemberObj ? `${selectedMemberObj.name}'s Progress` : 'Family Daily Progress'} ({approvedCount} approved, {reviewCount} awaiting review, {pendingCount} pending)
            </span>
            <span className="font-bold text-slate-900">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
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
          <div className="mt-4 p-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-base">
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
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-white text-amber-900 hover:bg-amber-50 shadow-xs transition-transform active:scale-[0.98] whitespace-nowrap"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.quickBatchApprove} (5⭐)</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className={`${theme.cardBg} rounded-2xl border ${theme.cardBorder} p-3 sm:p-4 space-y-3 shadow-xs transition-colors duration-200`}>
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.searchChoresPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 ${theme.accentRing} bg-slate-50/50`}
            />
          </div>

          {/* Filter Pills with Full Wrap Safety */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Time Filter */}
            <select
              value={selectedTimeFilter}
              onChange={(e) => {
                soundFX.playPop();
                setSelectedTimeFilter(e.target.value);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-2.5 rounded-xl text-xs font-semibold focus:ring-rose-500 focus:border-rose-500"
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
              className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-2.5 rounded-xl text-xs font-semibold focus:ring-rose-500 focus:border-rose-500"
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
              className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-2.5 rounded-xl text-xs font-semibold focus:ring-rose-500 focus:border-rose-500"
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border ${
                showWorkloadChart
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="Toggle Weekly Workload Balance Chart"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.workloadChart}</span>
            </button>

            {/* AI Auto-Assign Shortcut */}
            {onOpenAIAssign && (
              <button
                onClick={() => {
                  soundFX.playPop();
                  onOpenAIAssign();
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-xs transition-all flex items-center gap-1.5 shrink-0"
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
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1 shrink-0"
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

      {/* Chore Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-3xl mb-3">
            🎉
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {t.noChoresFound}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {scheduledChores.length === 0 
              ? t.allChoresDoneSubtitle 
              : t.addCustomChore}
          </p>
          <button
            onClick={() => {
              soundFX.playPop();
              onOpenNewChore();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newChore}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(({ chore, log, assignee }) => (
            <ChoreCard
              key={`${chore.id}_${currentDateStr}`}
              chore={chore}
              log={log}
              assignee={assignee}
              isMomMode={isMomMode}
              language={language}
              onMarkComplete={onMarkComplete}
              onOpenInspect={onOpenInspect}
              onQuickApprove={onQuickApprove}
              onEditChore={onEditChore}
            />
          ))}
        </div>
      )}
    </div>
  );
};
