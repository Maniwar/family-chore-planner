import React from 'react';
import { 
  X, 
  Sparkles, 
  BellRing, 
  CheckCircle2, 
  CalendarPlus, 
  AlertCircle,
  Clock,
  ChevronRight
} from 'lucide-react';
import { 
  Chore, 
  HouseholdMember, 
  PersonStatusType 
} from '../types';
import { Avatar } from './Avatar';
import { PersonStatusSummary } from '../utils/penaltyEngine';
import { soundFX } from '../utils/audio';
import { formatDisplayDate } from '../utils/storage';
import { ThemeConfig, THEMES } from '../utils/theme';
import { useBottomSheet } from '../hooks/useBottomSheet';
import { BottomSheetGrabber } from './BottomSheetGrabber';

interface PersonStatusDrawerProps {
  activePersonSummary: PersonStatusSummary;
  onClose: () => void;
  isMomMode: boolean;
  theme?: ThemeConfig;
  onOpenNudge: (member: HouseholdMember, chore?: Chore) => void;
  onBatchWaivePenalties?: (items: { choreId: string; logId?: string; memberId: string; date: string; title?: string }[], reason: string) => void;
  onWaivePenalty: (choreId: string, logId: string, memberId: string, reason: string, choreDate?: string) => void;
  setWaiveTarget: (target: any) => void;
  setExtendTarget: (target: any) => void;
  getStatusBadge: (status: PersonStatusType) => React.ReactNode;
}

export const PersonStatusDrawer: React.FC<PersonStatusDrawerProps> = ({
  activePersonSummary,
  onClose,
  isMomMode,
  theme = THEMES.rose,
  onOpenNudge,
  onBatchWaivePenalties,
  onWaivePenalty,
  setWaiveTarget,
  setExtendTarget,
  getStatusBadge,
}) => {
  const { sheetStyle, dragHandleProps, handleDismiss } = useBottomSheet({
    onClose,
    threshold: 60,
  });

  const member = activePersonSummary.member;
  const overdueCount = activePersonSummary.overdueItems.length;

  return (
    <div 
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={handleDismiss}
    >
      <div
        style={sheetStyle}
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200/90 max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200 safe-area-pb"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Interactive Grabber Touch-Bar (Click, Drag, or Tap to Dismiss) */}
        <BottomSheetGrabber
          dragHandleProps={dragHandleProps}
          onClose={handleDismiss}
        />

        {/* Sheet Header (Also responsive to drag down) */}
        <div 
          className={`px-4 sm:px-5 py-3.5 border-b ${theme.headerBorder || 'border-slate-100'} flex items-center justify-between bg-slate-50/80`}
        >
          <div 
            className="flex items-center gap-3 min-w-0 flex-1 select-none cursor-grab active:cursor-grabbing"
            onTouchStart={dragHandleProps.onTouchStart}
            onPointerDown={dragHandleProps.onPointerDown}
          >
            <Avatar
              photoUrl={member.avatarPhotoUrl}
              emoji={member.avatarEmoji}
              name={member.name}
              size="md"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">
                  {member.name}
                </h3>
                {getStatusBadge(activePersonSummary.status)}
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate">
                ⭐ {member.currentPoints || 0} pts balance • {activePersonSummary.totalDueThisWeek} chores this week
              </p>
            </div>
          </div>

          <button
            type="button"
            data-no-drag="true"
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="p-2 rounded-full bg-slate-200/80 text-slate-600 hover:bg-slate-300 transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-90 hover:scale-105 shrink-0 ml-2 z-20"
            title="Close modal"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Sheet Content: List of Overdue Chores and Redos */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 pb-10 sm:pb-5">
          {/* Section Header & Grouped Admin Quick Actions */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Unresolved Items ({overdueCount})
              </span>
            </div>

            {isMomMode && overdueCount > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenNudge(member)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold transition-all min-h-[32px] cursor-pointer active:scale-95 border border-slate-200/60"
                  title={`Send reminder nudge to ${member.name}`}
                >
                  <BellRing className="w-3.5 h-3.5 text-amber-600" />
                  <span>Nudge</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFX.playStarChime(5);
                    const itemsToWaive = activePersonSummary.overdueItems.map(i => ({
                      choreId: i.chore.id,
                      logId: i.log?.id,
                      memberId: member.id,
                      date: i.originalDueDate || i.effectiveDueDate,
                      title: i.chore.title,
                    }));
                    if (onBatchWaivePenalties) {
                      onBatchWaivePenalties(itemsToWaive, `Parent waived past overdue backlog for ${member.name}`);
                    } else {
                      itemsToWaive.forEach(item => {
                        onWaivePenalty(item.choreId, item.logId || `log_${item.choreId}_${item.date}`, item.memberId, 'Parent waived backlog', item.date);
                      });
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full ${theme.primaryBg} ${theme.primaryHover} ${theme.primaryText} text-xs font-black shadow-xs transition-all min-h-[32px] cursor-pointer active:scale-95`}
                  title={`Waive all ${overdueCount} overdue chores for ${member.name}`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Waive All ({overdueCount})</span>
                </button>
              </div>
            )}
          </div>

          {overdueCount === 0 ? (
            <div className={`border ${theme.badgeBorder || 'border-emerald-200'} ${theme.badgeBg || 'bg-emerald-50'} rounded-2xl p-6 text-center space-y-1`}>
              <CheckCircle2 className={`w-8 h-8 ${theme.badgeText || 'text-emerald-600'} mx-auto mb-1`} />
              <h4 className={`text-sm font-black ${theme.badgeText || 'text-emerald-900'}`}>All Caught Up!</h4>
              <p className="text-xs font-medium text-slate-500">
                {member.name} has no overdue chores or pending redo items.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activePersonSummary.overdueItems.map((item, idx) => {
                const formattedDate = formatDisplayDate(item.effectiveDueDate);
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:border-slate-300 transition-all space-y-3"
                  >
                    {/* Top Meta Header: Status Badge + Due Date on Left, Points on Right */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold border shrink-0 ${item.tierInfo.severityColor}`}>
                          {item.isRedo ? '🔄 Redo' : `${item.daysLate}d Late`}
                        </span>
                        <span className="text-xs text-slate-500 font-medium truncate flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">Due: {formattedDate}</span>
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-900 rounded-md text-xs font-black border border-amber-200/80 shrink-0">
                        ⭐ {item.chore.defaultPoints} pts
                      </span>
                    </div>

                    {/* Chore Title */}
                    <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug break-words">
                      {item.chore.title}
                    </h4>

                    {/* Penalty Tier Status & Next Worsening Forecast (Apple Inset Box) */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Penalty State:</span>
                        <span className="font-black text-slate-900 text-right">{item.tierInfo.tierLabel}</span>
                      </div>
                      {item.tierInfo.nextWorseningNotice && (
                        <div className="flex items-start gap-1.5 pt-1.5 border-t border-slate-200/60 text-[11px] font-semibold text-rose-600 leading-tight">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                          <span>{item.tierInfo.nextWorseningNotice}</span>
                        </div>
                      )}
                    </div>

                    {/* Parent Administrative Actions: Waive / Extend (Equal-width iOS Grid) */}
                    {isMomMode && (
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            soundFX.playPop();
                            setWaiveTarget({ ...item, member });
                          }}
                          className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 border border-emerald-300/80 rounded-xl text-xs font-black cursor-pointer min-h-[38px] active:scale-98 transition-all shadow-2xs whitespace-nowrap"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Waive</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            soundFX.playPop();
                            setExtendTarget({ ...item, member });
                          }}
                          className={`inline-flex items-center justify-center gap-1.5 py-2 px-3 ${theme.badgeBg} hover:brightness-95 active:scale-98 ${theme.badgeText} border ${theme.badgeBorder} rounded-xl text-xs font-black cursor-pointer min-h-[38px] transition-all shadow-2xs whitespace-nowrap`}
                        >
                          <CalendarPlus className="w-3.5 h-3.5 shrink-0" />
                          <span>Extend</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
