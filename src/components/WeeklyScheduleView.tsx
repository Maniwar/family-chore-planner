import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Printer, 
  ArrowRight,
  Home,
  Users,
  Layers,
  CalendarDays
} from 'lucide-react';
import { Chore, ChoreAssignmentLog, HouseholdMember } from '../types';
import { getWeekDates, parseLocalDate, isChoreScheduledForDate, formatTimeDisplay } from '../utils/storage';
import { WeeklyWorkloadChart } from './WeeklyWorkloadChart';
import { Avatar } from './Avatar';
import { soundFX } from '../utils/audio';
import { ThemePreset, THEMES } from '../utils/theme';

interface WeeklyScheduleViewProps {
  currentDateStr: string;
  onSelectDate: (dateStr: string) => void;
  chores: Chore[];
  logs: ChoreAssignmentLog[];
  members: HouseholdMember[];
  selectedMemberId: string;
  currentTheme?: ThemePreset;
  onSelectMember: (id: string) => void;
  onOpenInspect: (chore: Chore, log: ChoreAssignmentLog) => void;
  onOpenPrintView: () => void;
}

export const WeeklyScheduleView: React.FC<WeeklyScheduleViewProps> = ({
  currentDateStr,
  onSelectDate,
  chores,
  logs,
  members,
  selectedMemberId,
  currentTheme = 'rose',
  onSelectMember,
  onOpenInspect,
  onOpenPrintView,
}) => {
  const theme = THEMES[currentTheme] || THEMES.rose;
  const [centerDate, setCenterDate] = useState<string>(currentDateStr);
  const [selectedMobileDay, setSelectedMobileDay] = useState<string>(currentDateStr);
  const [mobileViewMode, setMobileViewMode] = useState<'single_day' | 'all_days'>('single_day');

  const weekDays = getWeekDates(centerDate);

  // Keep selectedMobileDay valid when week changes
  useEffect(() => {
    if (!weekDays.some(d => d.dateStr === selectedMobileDay)) {
      const todayInWeek = weekDays.find(d => d.isToday);
      setSelectedMobileDay(todayInWeek ? todayInWeek.dateStr : weekDays[0].dateStr);
    }
  }, [centerDate, weekDays, selectedMobileDay]);

  const handlePrevWeek = () => {
    soundFX.playPop();
    const d = parseLocalDate(centerDate);
    d.setDate(d.getDate() - 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const nextDate = `${yyyy}-${mm}-${dd}`;
    setCenterDate(nextDate);
    setSelectedMobileDay(nextDate);
  };

  const handleNextWeek = () => {
    soundFX.playPop();
    const d = parseLocalDate(centerDate);
    d.setDate(d.getDate() + 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const nextDate = `${yyyy}-${mm}-${dd}`;
    setCenterDate(nextDate);
    setSelectedMobileDay(nextDate);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-8">
      {/* iOS Navigation Header & Family Filter */}
      <div className="space-y-3">
        {/* Top Week Range & Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Weekly Schedule
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Week of {weekDays[0].dayName}, {weekDays[0].dateStr.slice(5)} — {weekDays[6].dayName}, {weekDays[6].dateStr.slice(5)}
            </p>
          </div>

          {/* Week Date Pager & Print Button */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            <div className="inline-flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-2xs">
              <button
                onClick={handlePrevWeek}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95"
                title="Previous Week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  soundFX.playPop();
                  const today = new Date().toISOString().split('T')[0];
                  setCenterDate(today);
                  setSelectedMobileDay(today);
                }}
                className="text-xs font-bold px-3.5 py-1.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-white transition-all cursor-pointer min-h-[38px] flex items-center"
              >
                This Week
              </button>

              <button
                onClick={handleNextWeek}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95"
                title="Next Week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                soundFX.playPop();
                onOpenPrintView();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer active:scale-95 shadow-2xs min-h-[44px]"
            >
              <Printer className="w-4 h-4" />
              <span>Print Grid</span>
            </button>
          </div>
        </div>

        {/* Member Filter Chips (Apple Horizontal Carousel) */}
        <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 shrink-0 ml-1 mr-0.5">
            Helper:
          </span>

          <button
            id="weekly-filter-all-members"
            onClick={() => {
              soundFX.playPop();
              onSelectMember('all');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 shrink-0 cursor-pointer min-h-[40px] active:scale-95 ${
              selectedMemberId === 'all'
                ? `${theme.primaryBg} ${theme.primaryText} shadow-xs font-black`
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Whole Family</span>
          </button>

          {members.filter(m => m.role !== 'parent').map((m) => {
            const isSelected = selectedMemberId === m.id;
            return (
              <button
                key={m.id}
                id={`weekly-filter-member-${m.id}`}
                onClick={() => {
                  soundFX.playPop();
                  onSelectMember(m.id);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 shrink-0 cursor-pointer min-h-[40px] active:scale-95 ${
                  isSelected
                    ? `${theme.primaryBg} ${theme.primaryText} shadow-xs font-black`
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <Avatar
                  photoUrl={m.avatarPhotoUrl}
                  emoji={m.avatarEmoji}
                  name={m.name}
                  size="xs"
                  showBorder={false}
                />
                <span>{m.name.split(' ')[0]}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isSelected ? 'bg-black/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {m.currentPoints} pts
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Workload Distribution & Balancing Chart */}
      <WeeklyWorkloadChart
        chores={chores}
        members={members}
        centerDateStr={centerDate}
        onSelectDate={onSelectDate}
        showInsights={true}
      />

      {/* Mobile Day Selector Strip (Visible on small screens < md) */}
      <div className="md:hidden space-y-3">
        {/* iOS Weekday Picker Strip */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-3 shadow-2xs">
          <div className="flex items-center justify-between px-1 py-1 mb-2 border-b border-slate-100 pb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Select Day:
            </span>
            <button
              onClick={() => {
                soundFX.playPop();
                setMobileViewMode(mobileViewMode === 'single_day' ? 'all_days' : 'single_day');
              }}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95 min-h-[32px]"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{mobileViewMode === 'single_day' ? 'Expand All Days' : 'Focus Single Day'}</span>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((day) => {
              const isSelected = selectedMobileDay === day.dateStr;
              const scheduled = chores.filter(c => isChoreScheduledForDate(c, day.dateStr));
              const filteredScheduled = selectedMemberId === 'all'
                ? scheduled
                : scheduled.filter(c => c.assignedMemberId === selectedMemberId);
              
              const dayLogs = logs.filter(l => l.date === day.dateStr);
              const approvedCount = dayLogs.filter(l => l.status === 'approved' && filteredScheduled.some(c => c.id === l.choreId)).length;
              const hasReview = dayLogs.some(l => l.status === 'needs_review' && filteredScheduled.some(c => c.id === l.choreId));

              return (
                <button
                  key={day.dateStr}
                  onClick={() => {
                    soundFX.playPop();
                    setSelectedMobileDay(day.dateStr);
                    setMobileViewMode('single_day');
                  }}
                  className={`py-2.5 px-1 rounded-2xl text-center transition-all flex flex-col items-center justify-center relative cursor-pointer min-h-[64px] active:scale-95 ${
                    isSelected
                      ? `${theme.primaryBg} ${theme.primaryText} shadow-xs font-extrabold`
                      : day.isToday
                      ? `${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? 'opacity-90' : 'text-slate-400'}`}>
                    {day.dayName.slice(0, 3)}
                  </span>
                  <span className="text-base font-black leading-tight my-0.5">
                    {day.dayNumber}
                  </span>
                  <span className={`text-[10px] font-bold ${isSelected ? 'opacity-95' : 'text-slate-500'}`}>
                    {approvedCount}/{filteredScheduled.length}
                  </span>
                  {hasReview && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse ring-2 ring-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Focused Day Card (when in single_day mode) */}
        {mobileViewMode === 'single_day' && (() => {
          const focusedDay = weekDays.find(d => d.dateStr === selectedMobileDay) || weekDays[0];
          const scheduled = chores.filter(c => isChoreScheduledForDate(c, focusedDay.dateStr));
          const filteredScheduled = selectedMemberId === 'all'
            ? scheduled
            : scheduled.filter(c => c.assignedMemberId === selectedMemberId);

          const dayLogs = logs.filter(l => l.date === focusedDay.dateStr);
          const approvedCount = dayLogs.filter(l => l.status === 'approved' && filteredScheduled.some(c => c.id === l.choreId)).length;
          const reviewCount = dayLogs.filter(l => l.status === 'needs_review' && filteredScheduled.some(c => c.id === l.choreId)).length;

          return (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      {focusedDay.dayName}, {focusedDay.dateStr}
                    </h3>
                    {focusedDay.isToday && (
                      <span className={`px-2.5 py-0.5 rounded-full ${theme.primaryBg} ${theme.primaryText} text-[10px] font-black`}>
                        TODAY
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {approvedCount} of {filteredScheduled.length} completed
                    {reviewCount > 0 && ` • ${reviewCount} waiting inspection`}
                  </p>
                </div>

                <button
                  onClick={() => onSelectDate(focusedDay.dateStr)}
                  className={`px-4 py-2 rounded-xl ${theme.primaryBg} ${theme.primaryText} ${theme.primaryHover} text-xs font-black flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer min-h-[40px]`}
                >
                  <span>Open Day</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Chores list */}
              {filteredScheduled.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  No chores scheduled for this day
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredScheduled.map((chore) => {
                    const log = logs.find(l => l.choreId === chore.id && l.date === focusedDay.dateStr);
                    const assignee = members.find(m => m.id === chore.assignedMemberId);
                    const status = log?.status || 'pending';

                    return (
                      <div
                        key={`${chore.id}_${focusedDay.dateStr}`}
                        onClick={() => {
                          if (status === 'needs_review' && log) {
                            onOpenInspect(chore, log);
                          } else {
                            onSelectDate(focusedDay.dateStr);
                          }
                        }}
                        className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 active:scale-[0.99] min-h-[56px] ${
                          status === 'approved'
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                            : status === 'needs_review'
                            ? 'bg-amber-50 border-amber-300 text-amber-950 ring-1 ring-amber-200'
                            : status === 'needs_redo'
                            ? 'bg-rose-50 border-rose-200 text-rose-950'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {assignee && (
                            <Avatar
                              photoUrl={assignee.avatarPhotoUrl}
                              emoji={assignee.avatarEmoji}
                              name={assignee.name}
                              size="sm"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-xs truncate text-slate-900">
                              {chore.title}
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {formatTimeDisplay(chore.scheduledTime, chore.timeOfDay)} • ⭐ {chore.defaultPoints} pts
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {status === 'approved' && (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              {log?.qualityGrade || 'A+'}
                            </span>
                          )}
                          {status === 'needs_review' && (
                            <span className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-xs">
                              Inspect 🔍
                            </span>
                          )}
                          {status === 'pending' && (
                            <span className="text-slate-400 text-sm font-bold pr-1">
                              →
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* 7-Day Columns Matrix (Desktop OR when Mobile 'all_days' mode is selected) */}
      <div className={`grid grid-cols-1 md:grid-cols-7 gap-3 ${mobileViewMode === 'single_day' ? 'hidden md:grid' : 'grid'}`}>
        {weekDays.map((day) => {
          const scheduled = chores.filter(c => isChoreScheduledForDate(c, day.dateStr));
          const filteredScheduled = selectedMemberId === 'all'
            ? scheduled
            : scheduled.filter(c => c.assignedMemberId === selectedMemberId);

          const dayLogs = logs.filter(l => l.date === day.dateStr);
          const approvedCount = dayLogs.filter(l => l.status === 'approved' && filteredScheduled.some(c => c.id === l.choreId)).length;
          const reviewCount = dayLogs.filter(l => l.status === 'needs_review' && filteredScheduled.some(c => c.id === l.choreId)).length;

          return (
            <div
              key={day.dateStr}
              className={`bg-white rounded-2xl border transition-all flex flex-col min-h-[380px] overflow-hidden ${
                day.isToday
                  ? 'border-rose-300 ring-2 ring-rose-100 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              {/* Day Column Header */}
              <div 
                onClick={() => onSelectDate(day.dateStr)}
                className={`p-3 border-b text-center cursor-pointer transition-colors ${
                  day.isToday
                    ? 'bg-rose-50/70 border-rose-100 text-rose-900'
                    : 'bg-slate-50/70 border-slate-100 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
                  <span>{day.dayName}</span>
                  {day.isToday && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-black">
                      TODAY
                    </span>
                  )}
                </div>
                <div className="text-lg font-black text-slate-900">
                  {day.dayNumber}
                </div>

                <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-slate-500 font-medium">
                  <span className="font-bold">{approvedCount}/{filteredScheduled.length}</span> done
                  {reviewCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse ml-0.5" title={`${reviewCount} need review`} />
                  )}
                </div>
              </div>

              {/* Chores List in Day Column */}
              <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[420px]">
                {filteredScheduled.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-slate-400 italic">
                    No chores
                  </div>
                ) : (
                  filteredScheduled.map((chore) => {
                    const log = logs.find(l => l.choreId === chore.id && l.date === day.dateStr);
                    const assignee = members.find(m => m.id === chore.assignedMemberId);
                    const status = log?.status || 'pending';

                    return (
                      <div
                        key={`${chore.id}_${day.dateStr}`}
                        onClick={() => {
                          if (status === 'needs_review' && log) {
                            onOpenInspect(chore, log);
                          } else {
                            onSelectDate(day.dateStr);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all active:scale-[0.98] ${
                          status === 'approved'
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            : status === 'needs_review'
                            ? 'bg-amber-50 border-amber-300 text-amber-900 ring-1 ring-amber-200'
                            : status === 'needs_redo'
                            ? 'bg-rose-50 border-rose-200 text-rose-900'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-lg bg-slate-100 text-slate-600">
                            {formatTimeDisplay(chore.scheduledTime, chore.timeOfDay).split(' ')[0]}
                          </span>

                          <span className="text-[10px] font-black text-amber-700">
                            ⭐{chore.defaultPoints}
                          </span>
                        </div>

                        <p className="font-bold text-[11px] leading-tight line-clamp-2 mb-1.5">
                          {chore.title}
                        </p>

                        <div className="flex items-center justify-between text-[10px]">
                          {assignee && (
                            <span className="flex items-center gap-1 text-slate-500 font-semibold">
                              <span>{assignee.avatarEmoji}</span>
                              <span className="truncate max-w-[50px]">{assignee.name.split(' ')[0]}</span>
                            </span>
                          )}

                          {status === 'approved' && (
                            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              {log?.qualityGrade || 'A+'}
                            </span>
                          )}

                          {status === 'needs_review' && (
                            <span className="text-amber-800 font-bold bg-amber-100 px-1.5 py-0.2 rounded-md text-[9px]">
                              Inspect
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Day Footer Action */}
              <div className="p-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => onSelectDate(day.dateStr)}
                  className="w-full text-[11px] font-bold text-slate-500 hover:text-slate-900 py-1 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Open Day</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
