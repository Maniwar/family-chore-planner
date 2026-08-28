import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  User, 
  Printer, 
  ArrowRight,
  Filter,
  Home,
  Users
} from 'lucide-react';
import { Chore, ChoreAssignmentLog, HouseholdMember } from '../types';
import { getWeekDates, parseLocalDate, isChoreScheduledForDate, formatTimeDisplay } from '../utils/storage';
import { WeeklyWorkloadChart } from './WeeklyWorkloadChart';
import { Avatar } from './Avatar';
import { soundFX } from '../utils/audio';

interface WeeklyScheduleViewProps {
  currentDateStr: string;
  onSelectDate: (dateStr: string) => void;
  chores: Chore[];
  logs: ChoreAssignmentLog[];
  members: HouseholdMember[];
  selectedMemberId: string;
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
  onSelectMember,
  onOpenInspect,
  onOpenPrintView,
}) => {
  const [centerDate, setCenterDate] = useState<string>(currentDateStr);

  const weekDays = getWeekDates(centerDate);

  const handlePrevWeek = () => {
    soundFX.playPop();
    const d = parseLocalDate(centerDate);
    d.setDate(d.getDate() - 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setCenterDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleNextWeek = () => {
    soundFX.playPop();
    const d = parseLocalDate(centerDate);
    d.setDate(d.getDate() + 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setCenterDate(`${yyyy}-${mm}-${dd}`);
  };

  const activeMembers = selectedMemberId === 'all' 
    ? members 
    : members.filter(m => m.id === selectedMemberId);

  return (
    <div className="space-y-6">
      {/* Week Navigation & Contextual Filter Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Weekly Family Schedule Board
              </h2>
              <p className="text-xs text-slate-500">
                Week of {weekDays[0].dayName}, {weekDays[0].dateStr} — {weekDays[6].dayName}, {weekDays[6].dateStr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevWeek}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Previous Week"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                soundFX.playPop();
                setCenterDate(new Date().toISOString().split('T')[0]);
              }}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              This Week
            </button>

            <button
              onClick={handleNextWeek}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Next Week"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                soundFX.playPop();
                onOpenPrintView();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors ml-2 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Fridge Grid</span>
            </button>
          </div>
        </div>

        {/* Member Filter Chips for the Weekly Matrix */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>Filter Schedule:</span>
          </span>

          <button
            id="weekly-filter-all-members"
            onClick={() => {
              soundFX.playPop();
              onSelectMember('all');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
              selectedMemberId === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Whole Family</span>
          </button>

          {members.map((m) => {
            const isSelected = selectedMemberId === m.id;
            return (
              <button
                key={m.id}
                id={`weekly-filter-member-${m.id}`}
                onClick={() => {
                  soundFX.playPop();
                  onSelectMember(m.id);
                }}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-2 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Avatar
                  photoUrl={m.avatarPhotoUrl}
                  emoji={m.avatarEmoji}
                  name={m.name}
                  size="xs"
                  showBorder={false}
                />
                <span>{m.name}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
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

      {/* 7-Day Columns Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          // Get chores scheduled for this specific date
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
              className={`bg-white rounded-xl border transition-all flex flex-col min-h-[380px] ${
                day.isToday
                  ? 'border-rose-300 ring-2 ring-rose-100 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 shadow-xs'
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
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                  <span>{day.dayName}</span>
                  {day.isToday && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px]">
                      TODAY
                    </span>
                  )}
                </div>
                <div className="text-lg font-extrabold text-slate-900">
                  {day.dayNumber}
                </div>

                <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-slate-500">
                  <span className="font-semibold">{approvedCount}/{filteredScheduled.length}</span> done
                  {reviewCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse ml-0.5" title={`${reviewCount} need review`} />
                  )}
                </div>
              </div>

              {/* Chores List in Day Column */}
              <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[420px]">
                {filteredScheduled.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-slate-400">
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
                        className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
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
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                            {formatTimeDisplay(chore.scheduledTime, chore.timeOfDay).split(' ')[0]}
                          </span>

                          <span className="text-[10px] font-bold text-amber-700">
                            ⭐{chore.defaultPoints}
                          </span>
                        </div>

                        <p className="font-semibold text-[11px] leading-tight line-clamp-2 mb-1.5">
                          {chore.title}
                        </p>

                        <div className="flex items-center justify-between text-[10px]">
                          {assignee && (
                            <span className="flex items-center gap-1 text-slate-500">
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
                            <span className="text-amber-700 font-bold bg-amber-100 px-1 py-0.2 rounded text-[9px]">
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
                  className="w-full text-[11px] font-semibold text-slate-500 hover:text-slate-900 py-1 hover:bg-slate-50 rounded transition-colors flex items-center justify-center gap-1"
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
