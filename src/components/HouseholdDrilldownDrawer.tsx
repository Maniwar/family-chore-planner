import React from 'react';
import { 
  X, 
  Sparkles, 
  BellRing, 
  CheckCircle2, 
  CalendarPlus, 
  ChevronRight 
} from 'lucide-react';
import { 
  Chore, 
  ChoreAssignmentLog, 
  HouseholdMember, 
  PersonStatusType 
} from '../types';
import { Avatar } from './Avatar';
import { PersonStatusSummary } from '../utils/penaltyEngine';
import { soundFX } from '../utils/audio';
import { useBottomSheet } from '../hooks/useBottomSheet';
import { BottomSheetGrabber } from './BottomSheetGrabber';

interface HouseholdDrilldownDrawerProps {
  drilldownType: 'overdue' | 'review' | 'redo' | 'overview';
  onClose: () => void;
  theme: any;
  totalOverdue: number;
  awaitingInspectionCount: number;
  totalRedo: number;
  onTrackPercent: number;
  behindMembers: PersonStatusSummary[];
  drilldownFilterMemberId: string;
  setDrilldownFilterMemberId: (id: string) => void;
  onOpenNudge: (member: HouseholdMember, chore?: Chore) => void;
  onBatchWaivePenalties?: (items: { choreId: string; logId?: string; memberId: string; date: string; title?: string }[], reason: string) => void;
  onWaivePenalty: (choreId: string, logId: string, memberId: string, reason: string, choreDate?: string) => void;
  setWaiveTarget: (target: any) => void;
  setExtendTarget: (target: any) => void;
  setSelectedPersonSheet: (summary: PersonStatusSummary | null) => void;
  isMomMode: boolean;
  onNavigateToInspection?: () => void;
  logs: ChoreAssignmentLog[];
  chores: Chore[];
  members: HouseholdMember[];
  householdEvaluation: {
    behindMembers: PersonStatusSummary[];
    onTrackMembers: PersonStatusSummary[];
  };
  getStatusBadge: (status: PersonStatusType) => React.ReactNode;
}

export const HouseholdDrilldownDrawer: React.FC<HouseholdDrilldownDrawerProps> = ({
  drilldownType,
  onClose,
  theme,
  totalOverdue,
  awaitingInspectionCount,
  totalRedo,
  onTrackPercent,
  behindMembers,
  drilldownFilterMemberId,
  setDrilldownFilterMemberId,
  onOpenNudge,
  onBatchWaivePenalties,
  onWaivePenalty,
  setWaiveTarget,
  setExtendTarget,
  setSelectedPersonSheet,
  isMomMode,
  onNavigateToInspection,
  logs,
  chores,
  members,
  householdEvaluation,
  getStatusBadge,
}) => {
  const { sheetStyle, dragHandleProps, handleDismiss } = useBottomSheet({
    onClose,
    threshold: 60,
  });

  return (
    <div 
      className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={handleDismiss}
    >
      <div
        style={sheetStyle}
        className="bg-white w-full max-w-xl rounded-t-[32px] sm:rounded-[28px] border-t sm:border border-slate-200/90 max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-300 safe-area-pb"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Interactive Grabber Touch Bar */}
        <BottomSheetGrabber dragHandleProps={dragHandleProps} onClose={handleDismiss} />

        {/* Modal Header */}
        <div 
          className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 touch-none select-none cursor-grab active:cursor-grabbing"
          onTouchStart={dragHandleProps.onTouchStart}
          onTouchMove={dragHandleProps.onTouchMove}
          onTouchEnd={dragHandleProps.onTouchEnd}
          onPointerDown={dragHandleProps.onPointerDown}
          onPointerMove={dragHandleProps.onPointerMove}
          onPointerUp={dragHandleProps.onPointerUp}
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-black shadow-2xs ${
              drilldownType === 'overdue' ? 'bg-rose-100 text-rose-700' :
              drilldownType === 'review' ? 'bg-amber-100 text-amber-700' :
              drilldownType === 'redo' ? 'bg-purple-100 text-purple-700' :
              `${theme.primaryBg} ${theme.primaryText}`
            }`}>
              {drilldownType === 'overdue' && '⚠️'}
              {drilldownType === 'review' && '🔍'}
              {drilldownType === 'redo' && '🔄'}
              {drilldownType === 'overview' && '📊'}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                {drilldownType === 'overdue' && `Overdue Chores (${totalOverdue})`}
                {drilldownType === 'review' && `Awaiting Inspection (${awaitingInspectionCount})`}
                {drilldownType === 'redo' && `Redo Queue (${totalRedo})`}
                {drilldownType === 'overview' && `Weekly Performance (${onTrackPercent}%)`}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {drilldownType === 'overdue' && 'Live household lateness tracking · Sorted by days late'}
                {drilldownType === 'review' && 'Chores completed by helpers awaiting parent sign-off'}
                {drilldownType === 'redo' && 'Chores needing quality corrections before star award'}
                {drilldownType === 'overview' && 'Summary of on-time completion rates across all helpers'}
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-90 cursor-pointer min-h-[36px] min-w-[36px]"
            title="Close"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Sub-Filters for Overdue or Redo */}
        {(drilldownType === 'overdue' || drilldownType === 'redo') && behindMembers.length > 1 && (
          <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => {
                soundFX.playPop();
                setDrilldownFilterMemberId('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[36px] ${
                drilldownFilterMemberId === 'all'
                  ? `${theme.primaryBg} ${theme.primaryText} shadow-xs font-black`
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Members ({drilldownType === 'overdue' ? totalOverdue : totalRedo})
            </button>
            {behindMembers.map(s => {
              const count = drilldownType === 'overdue' ? s.overdueCount : s.redoCount;
              if (count === 0) return null;
              const isSelected = drilldownFilterMemberId === s.member.id;
              return (
                <button
                  key={s.member.id}
                  onClick={() => {
                    soundFX.playPop();
                    setDrilldownFilterMemberId(s.member.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[36px] flex items-center gap-1.5 ${
                    isSelected
                      ? `${theme.primaryBg} ${theme.primaryText} shadow-xs font-black`
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{s.member.name.split(' ')[0]}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Drilldown Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          
          {/* DRILLDOWN: OVERDUE */}
          {drilldownType === 'overdue' && (
            <>
              {(() => {
                const allItems = behindMembers.flatMap(s => 
                  s.overdueItems.filter(item => !item.isRedo).map(item => ({ ...item, member: s.member }))
                ).sort((a, b) => b.daysLate - a.daysLate);

                const filtered = drilldownFilterMemberId === 'all' 
                  ? allItems 
                  : allItems.filter(i => i.member.id === drilldownFilterMemberId);

                if (filtered.length === 0) {
                  return (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center text-emerald-900 space-y-1">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                      <h4 className="text-sm font-black">No Overdue Chores!</h4>
                      <p className="text-xs font-medium text-emerald-700">
                        Great work! No overdue chores found for this selection.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2.5">
                    {isMomMode && filtered.length > 0 && (
                      <div className="flex items-center justify-between bg-slate-100/80 p-2.5 rounded-2xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-700">
                          Showing {filtered.length} overdue task{filtered.length > 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={() => {
                            soundFX.playStarChime(5);
                            const itemsToWaive = filtered.map(i => ({
                              choreId: i.chore.id,
                              logId: i.log?.id,
                              memberId: i.member.id,
                              date: i.originalDueDate || i.effectiveDueDate,
                              title: i.chore.title,
                            }));
                            if (onBatchWaivePenalties) {
                              onBatchWaivePenalties(itemsToWaive, `Household admin waived all ${drilldownFilterMemberId === 'all' ? 'overdue backlog' : 'past overdue chores'}`);
                            } else {
                              itemsToWaive.forEach(item => {
                                onWaivePenalty(item.choreId, item.logId || `log_${item.choreId}_${item.date}`, item.memberId, 'Parent batch waived backlog', item.date);
                              });
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black shadow-2xs cursor-pointer min-h-[38px] active:scale-95 transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Waive All ({filtered.length})</span>
                        </button>
                      </div>
                    )}

                    {filtered.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs hover:border-slate-300 transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar
                              photoUrl={item.member.avatarPhotoUrl}
                              emoji={item.member.avatarEmoji}
                              name={item.member.name}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-slate-900">
                                  {item.member.name}
                                </span>
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${item.tierInfo.severityColor}`}>
                                  {item.daysLate === 0 ? '< 1d Late (Today)' : `${item.daysLate}d Late`}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  Due: {item.effectiveDueDate}
                                </span>
                              </div>
                              <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                                {item.chore.title}
                              </h4>
                            </div>
                          </div>

                          <span className="px-2 py-1 bg-amber-50 text-amber-900 rounded-xl text-xs font-black shrink-0 border border-amber-200">
                            ⭐ {item.chore.defaultPoints} pts
                          </span>
                        </div>

                        {/* Penalty State Banner */}
                        <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Status:</span>
                          <span className="font-black text-slate-800">{item.tierInfo.tierLabel}</span>
                        </div>

                        {/* Administrative Quick Actions */}
                        {isMomMode && (
                          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                            <button
                              onClick={() => {
                                onOpenNudge(item.member, item.chore);
                              }}
                              className="flex-1 py-2 px-2 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer min-h-[44px] active:scale-95 transition-all"
                            >
                              <BellRing className="w-3.5 h-3.5 text-amber-600" />
                              <span>Nudge</span>
                            </button>

                            <button
                              onClick={() => {
                                soundFX.playPop();
                                setSelectedPersonSheet(behindMembers.find(s => s.member.id === item.member.id) || null);
                                setWaiveTarget({ ...item, member: item.member });
                              }}
                              className="flex-1 py-2 px-2 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer min-h-[44px] active:scale-95 transition-all"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Waive</span>
                            </button>

                            <button
                              onClick={() => {
                                soundFX.playPop();
                                setSelectedPersonSheet(behindMembers.find(s => s.member.id === item.member.id) || null);
                                setExtendTarget({ ...item, member: item.member });
                              }}
                              className="flex-1 py-2 px-2 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer min-h-[44px] active:scale-95 transition-all"
                            >
                              <CalendarPlus className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Extend</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          )}

          {/* DRILLDOWN: AWAITING REVIEW */}
          {drilldownType === 'review' && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-black text-amber-900">
                    {awaitingInspectionCount} Pending Quality Inspections
                  </h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Inspect kid submissions, award quality grades & approve stars.
                  </p>
                </div>
                {onNavigateToInspection && (
                  <button
                    onClick={() => {
                      soundFX.playPop();
                      onClose();
                      onNavigateToInspection();
                    }}
                    className={`px-3 py-2 ${theme.primaryBg} ${theme.primaryText} ${theme.primaryHover} rounded-xl text-xs font-black shadow-xs cursor-pointer min-h-[40px] whitespace-nowrap active:scale-95`}
                  >
                    Open Inspection →
                  </button>
                )}
              </div>

              {logs.filter(l => l.status === 'needs_review').length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500">
                  No submissions currently awaiting inspection.
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.filter(l => l.status === 'needs_review').map(log => {
                    const chore = chores.find(c => c.id === log.choreId);
                    const member = members.find(m => m.id === log.memberId);
                    return (
                      <div key={log.id} className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar
                            photoUrl={member?.avatarPhotoUrl}
                            emoji={member?.avatarEmoji}
                            name={member?.name || 'Helper'}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900">{member?.name}</p>
                            <p className="text-xs font-bold text-slate-700 truncate">{chore?.title || 'Chore'}</p>
                            <p className="text-[10px] text-slate-400">Date: {log.date}</p>
                          </div>
                        </div>

                        <span className="px-2 py-1 bg-amber-100 text-amber-900 rounded-xl text-xs font-black border border-amber-200 shrink-0">
                          ⭐ {chore?.defaultPoints || 10} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* DRILLDOWN: REDO QUEUE */}
          {drilldownType === 'redo' && (
            <>
              {(() => {
                const allRedo = behindMembers.flatMap(s =>
                  s.overdueItems.filter(item => item.isRedo).map(item => ({ ...item, member: s.member }))
                );

                const filtered = drilldownFilterMemberId === 'all'
                  ? allRedo
                  : allRedo.filter(i => i.member.id === drilldownFilterMemberId);

                if (filtered.length === 0) {
                  return (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center text-emerald-900 space-y-1">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                      <h4 className="text-sm font-black">Redo Queue Clear!</h4>
                      <p className="text-xs font-medium text-emerald-700">
                        No chores are currently marked as needing quality redo.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2.5">
                    {filtered.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-2xl border border-rose-200 p-3.5 shadow-2xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar
                              photoUrl={item.member.avatarPhotoUrl}
                              emoji={item.member.avatarEmoji}
                              name={item.member.name}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-slate-900">
                                  {item.member.name}
                                </span>
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                  🔄 Needs Redo
                                </span>
                              </div>
                              <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                                {item.chore.title}
                              </h4>
                            </div>
                          </div>

                          <span className="px-2 py-1 bg-rose-50 text-rose-900 rounded-xl text-xs font-black shrink-0 border border-rose-200">
                            ⭐ {item.chore.defaultPoints} pts
                          </span>
                        </div>

                        {item.log?.feedbackNote && (
                          <div className="p-2 bg-rose-50/70 rounded-xl border border-rose-100 text-xs text-rose-800">
                            <span className="font-bold">Feedback: </span>
                            {item.log.feedbackNote}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          )}

          {/* DRILLDOWN: OVERVIEW */}
          {drilldownType === 'overview' && (
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Family Performance Breakdown This Week
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="text-lg font-black text-emerald-600">{onTrackPercent}%</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">On-Time Rate</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="text-lg font-black text-rose-600">{totalOverdue}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Overdue Chores</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="text-lg font-black text-amber-600">{awaitingInspectionCount}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Awaiting Review</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="text-lg font-black text-slate-800">{totalRedo}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Redo Queue</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 px-1">
                  Helpers Overview
                </h4>
                {householdEvaluation.behindMembers.concat(householdEvaluation.onTrackMembers).map(s => (
                  <div
                    key={s.member.id}
                    onClick={() => {
                      soundFX.playPop();
                      setSelectedPersonSheet(s);
                      onClose();
                    }}
                    className="bg-white rounded-2xl border border-slate-200 p-3 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        photoUrl={s.member.avatarPhotoUrl}
                        emoji={s.member.avatarEmoji}
                        name={s.member.name}
                        size="sm"
                      />
                      <div>
                        <p className="text-xs font-black text-slate-900">{s.member.name}</p>
                        <p className="text-[11px] text-slate-500">{s.summaryLine}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(s.status)}
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
