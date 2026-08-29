import React from 'react';
import { 
  X, 
  Sparkles, 
  BellRing, 
  CheckCircle2, 
  CalendarPlus, 
  Info 
} from 'lucide-react';
import { 
  Chore, 
  HouseholdMember, 
  PersonStatusType 
} from '../types';
import { Avatar } from './Avatar';
import { PersonStatusSummary } from '../utils/penaltyEngine';
import { soundFX } from '../utils/audio';
import { useBottomSheet } from '../hooks/useBottomSheet';
import { BottomSheetGrabber } from './BottomSheetGrabber';

interface PersonStatusDrawerProps {
  activePersonSummary: PersonStatusSummary;
  onClose: () => void;
  isMomMode: boolean;
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

  return (
    <div 
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={handleDismiss}
    >
      <div
        style={sheetStyle}
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200 safe-area-pb"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Interactive Grabber Touch-Bar (Click, Drag, or Tap to Dismiss) */}
        <BottomSheetGrabber
          dragHandleProps={dragHandleProps}
          onClose={handleDismiss}
        />

        {/* Sheet Header (Also responsive to drag down) */}
        <div 
          className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 touch-none select-none cursor-grab active:cursor-grabbing"
          onTouchStart={dragHandleProps.onTouchStart}
          onTouchMove={dragHandleProps.onTouchMove}
          onTouchEnd={dragHandleProps.onTouchEnd}
          onPointerDown={dragHandleProps.onPointerDown}
          onPointerMove={dragHandleProps.onPointerMove}
          onPointerUp={dragHandleProps.onPointerUp}
        >
          <div className="flex items-center gap-3">
            <Avatar
              photoUrl={activePersonSummary.member.avatarPhotoUrl}
              emoji={activePersonSummary.member.avatarEmoji}
              name={activePersonSummary.member.name}
              size="md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  {activePersonSummary.member.name}
                </h3>
                {getStatusBadge(activePersonSummary.status)}
              </div>
              <p className="text-xs text-slate-500 font-semibold">
                ⭐ Balance: {activePersonSummary.member.currentPoints || 0} pts · {activePersonSummary.totalDueThisWeek} chores this week
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-full bg-slate-200/80 text-slate-600 hover:bg-slate-300 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-90"
            title="Close modal"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sheet Content: List of Overdue Chores and Redos */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 pb-10 sm:pb-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">
              Unresolved Items ({activePersonSummary.overdueItems.length})
            </span>
            {isMomMode && activePersonSummary.overdueItems.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenNudge(activePersonSummary.member)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-black shadow-2xs cursor-pointer min-h-[36px] active:scale-95 transition-all"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Nudge</span>
                </button>

                <button
                  onClick={() => {
                    soundFX.playStarChime(5);
                    const itemsToWaive = activePersonSummary.overdueItems.map(i => ({
                      choreId: i.chore.id,
                      logId: i.log?.id,
                      memberId: activePersonSummary.member.id,
                      date: i.originalDueDate || i.effectiveDueDate,
                      title: i.chore.title,
                    }));
                    if (onBatchWaivePenalties) {
                      onBatchWaivePenalties(itemsToWaive, `Parent waived past overdue backlog for ${activePersonSummary.member.name}`);
                    } else {
                      itemsToWaive.forEach(item => {
                        onWaivePenalty(item.choreId, item.logId || `log_${item.choreId}_${item.date}`, item.memberId, 'Parent waived backlog', item.date);
                      });
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black shadow-2xs cursor-pointer min-h-[36px] active:scale-95 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Waive All ({activePersonSummary.overdueItems.length})</span>
                </button>
              </div>
            )}
          </div>

          {activePersonSummary.overdueItems.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center text-emerald-900 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
              <h4 className="text-sm font-black">All Caught Up!</h4>
              <p className="text-xs font-medium text-emerald-700">
                No overdue chores or pending redos for this week.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activePersonSummary.overdueItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${item.tierInfo.severityColor}`}>
                          {item.isRedo ? '🔄 Redo' : `${item.daysLate}d Late`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Due: {item.effectiveDueDate}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 mt-1">
                        {item.chore.title}
                      </h4>
                    </div>

                    <span className="px-2 py-1 bg-amber-100 text-amber-900 rounded-xl text-xs font-black shrink-0 border border-amber-200">
                      ⭐ {item.chore.defaultPoints} pts
                    </span>
                  </div>

                  {/* Penalty Tier Status & Next Worsening Forecast */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">Penalty State:</span>
                      <span className="font-black text-slate-900">{item.tierInfo.tierLabel}</span>
                    </div>
                    {item.tierInfo.nextWorseningNotice && (
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                        <Info className="w-3 h-3 shrink-0" />
                        <span>{item.tierInfo.nextWorseningNotice}</span>
                      </div>
                    )}
                  </div>

                  {/* Parent Administrative Actions: Waive / Extend */}
                  {isMomMode && (
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => {
                          soundFX.playPop();
                          setWaiveTarget({ ...item, member: activePersonSummary.member });
                        }}
                        className="flex-1 py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] active:scale-95 transition-all"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>Waive Penalty</span>
                      </button>

                      <button
                        onClick={() => {
                          soundFX.playPop();
                          setExtendTarget({ ...item, member: activePersonSummary.member });
                        }}
                        className="flex-1 py-2 px-2.5 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] active:scale-95 transition-all"
                      >
                        <CalendarPlus className="w-4 h-4 text-indigo-600" />
                        <span>Extend Due Date</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
