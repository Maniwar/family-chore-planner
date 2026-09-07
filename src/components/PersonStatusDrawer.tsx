import { isGlassTheme } from '../utils/theme';
import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  BellRing, 
  CheckCircle2, 
  CalendarPlus, 
  AlertCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  Check,
  Eye,
  CheckSquare,
  Square,
  ClipboardList
} from 'lucide-react';
import { 
  Chore, 
  HouseholdMember, 
  PersonStatusType,
  ChoreAssignmentLog
} from '../types';
import { Avatar } from './Avatar';
import { PersonStatusSummary } from '../utils/penaltyEngine';
import { soundFX } from '../utils/audio';
import { formatDisplayDate } from '../utils/storage';
import { ThemeConfig, THEMES } from '../utils/theme';
import { useBottomSheet } from '../hooks/useBottomSheet';
import { BottomSheetGrabber } from './BottomSheetGrabber';

const getGlassySeverityColor = (severityColor: string, isGlass: boolean) => {
  if (!isGlass) return severityColor;
  if (severityColor.includes('rose')) return 'backdrop-blur-md bg-rose-500/20 border-rose-300/40 text-rose-900 shadow-xs ring-1 ring-rose-400/20';
  if (severityColor.includes('amber')) return 'backdrop-blur-md bg-amber-500/20 border-amber-300/40 text-amber-900 shadow-xs ring-1 ring-amber-400/20';
  if (severityColor.includes('emerald')) return 'backdrop-blur-md bg-emerald-500/20 border-emerald-300/40 text-emerald-900 shadow-xs ring-1 ring-emerald-400/20';
  if (severityColor.includes('purple')) return 'backdrop-blur-md bg-purple-500/20 border-purple-300/40 text-purple-900 shadow-xs ring-1 ring-purple-400/20';
  return severityColor;
};

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
  onQuickApprove?: (choreId: string, logId?: string, choreDate?: string, targetMemberId?: string) => void;
  onBatchApproveOverdue?: (items: { choreId: string; logId?: string; memberId: string; date: string; title?: string }[]) => void;
  onMarkComplete?: (choreId: string, notes?: string, checklist?: { [key: number]: boolean }, targetDate?: string, targetMemberId?: string) => void;
  onOpenInspect?: (chore: Chore, log: ChoreAssignmentLog | null) => void;
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
  onQuickApprove,
  onBatchApproveOverdue,
  onMarkComplete,
  onOpenInspect,
}) => {
  const { sheetStyle, dragHandleProps, handleDismiss } = useBottomSheet({
    onClose,
    threshold: 60,
  });

  const member = activePersonSummary.member;
  const overdueCount = activePersonSummary.overdueItems.length;

  // Track expanded checklists for each chore card
  const [expandedChoreIds, setExpandedChoreIds] = useState<Record<string, boolean>>({});
  // Track checklist check states for inline interactive checklists
  const [checkedItemsMap, setCheckedItemsMap] = useState<Record<string, Record<number, boolean>>>({});

  const toggleChecklistExpansion = (choreId: string) => {
    soundFX.playPop();
    setExpandedChoreIds(prev => ({
      ...prev,
      [choreId]: !prev[choreId]
    }));
  };

  const toggleChecklistItem = (choreId: string, index: number) => {
    soundFX.playPop();
    setCheckedItemsMap(prev => {
      const choreChecklist = prev[choreId] || {};
      return {
        ...prev,
        [choreId]: {
          ...choreChecklist,
          [index]: !choreChecklist[index]
        }
      };
    });
  };

  return (
    <div 
      className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150 ${isGlassTheme(theme.id) ? (theme.isDark ? 'bg-slate-900/40 backdrop-blur-md' : 'bg-white/30 backdrop-blur-md') : 'backdrop-blur-sm bg-black/60'}`}
      onClick={handleDismiss}
    >
      <div
        style={sheetStyle}
        className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl border-t sm:border max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200 safe-area-pb ${isGlassTheme(theme.id) ? "apple-glass-panel border-white/30" : "bg-white border-slate-200/90"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Interactive Grabber Touch-Bar (Click, Drag, or Tap to Dismiss) */}
        <BottomSheetGrabber
          dragHandleProps={dragHandleProps}
          onClose={handleDismiss}
        />

        {/* Sheet Header (Also responsive to drag down) */}
        <div 
          className={`px-4 sm:px-5 py-3.5 border-b ${theme.headerBorder || 'border-slate-100'} flex items-center justify-between ${isGlassTheme(theme.id) ? 'transparent' : 'bg-slate-50/80'}`}
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
          {/* Section Header & Grouped Quick Actions */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Unresolved Items ({overdueCount})
              </span>
            </div>

            {overdueCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {isMomMode ? (
                  <>
                    {/* Approve All Overdue Chores */}
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playStarChime(5);
                        const itemsToApprove = activePersonSummary.overdueItems.map(i => ({
                          choreId: i.chore.id,
                          logId: i.log?.id,
                          memberId: member.id,
                          date: i.effectiveDueDate || i.originalDueDate,
                          title: i.chore.title,
                        }));
                        if (onBatchApproveOverdue) {
                          onBatchApproveOverdue(itemsToApprove);
                        } else if (onQuickApprove) {
                          itemsToApprove.forEach(item => {
                            onQuickApprove(item.choreId, item.logId, item.date, item.memberId);
                          });
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black shadow-xs transition-all min-h-[32px] cursor-pointer active:scale-95"
                      title={`Approve all ${overdueCount} overdue chores for ${member.name}`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Approve All ({overdueCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenNudge(member)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold transition-all min-h-[32px] cursor-pointer active:scale-95 border border-slate-200/60"
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold transition-all min-h-[32px] cursor-pointer active:scale-95 border border-slate-200/60"
                      title={`Waive all ${overdueCount} overdue chores for ${member.name}`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Waive All</span>
                    </button>
                  </>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Tap any chore to do it & submit for review
                  </span>
                )}
              </div>
            )}
          </div>

          {overdueCount === 0 ? (
            <div className={`border ${theme.badgeBorder || 'border-emerald-200'} ${theme.badgeBg || 'bg-emerald-50'} rounded-2xl p-6 text-center space-y-1`}>
              <CheckCircle2 className={`w-8 h-8 ${theme.badgeText || 'text-emerald-600'} mx-auto mb-1`} />
              <h4 className={`text-sm font-black ${theme.badgeText || 'text-emerald-900'}`}>
                {activePersonSummary.pendingTodayCount === 0 ? 'All Caught Up! ⭐' : 'On Track! ✨'}
              </h4>
              <p className="text-xs font-medium text-slate-600 max-w-xs mx-auto">
                {activePersonSummary.pendingTodayCount === 0
                  ? `${member.name} has no overdue chores or pending redo items. Everything is complete!`
                  : `${member.name} is on track with no overdue chores. ${activePersonSummary.pendingTodayCount} chore${activePersonSummary.pendingTodayCount > 1 ? 's' : ''} scheduled for today${activePersonSummary.waitingReviewCount > 0 ? ` (${activePersonSummary.waitingReviewCount} submitted awaiting review)` : ''}.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activePersonSummary.overdueItems.map((item, idx) => {
                const formattedDate = formatDisplayDate(item.effectiveDueDate);
                const choreChecklist = item.chore.qualityChecklist || [];
                const isExpanded = expandedChoreIds[item.chore.id] ?? false;
                const checkedItems = checkedItemsMap[item.chore.id] || {};
                const checkedCount = Object.values(checkedItems).filter(Boolean).length;

                return (
                  <div
                    key={`${item.chore.id}_${item.effectiveDueDate}_${idx}`}
                    className={`rounded-2xl border p-4 shadow-2xs transition-all space-y-3 ${isGlassTheme(theme.id) ? "apple-glass-card border-white/20 hover:border-white/40" : "bg-white border-slate-200/90 hover:border-slate-300"}`}
                  >
                    {/* Top Meta Header: Status Badge + Due Date on Left, Points on Right */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold border shrink-0 ${getGlassySeverityColor(item.tierInfo.severityColor, isGlassTheme(theme.id))}`}>
                          {item.isRedo ? '🔄 Redo' : `${item.daysLate}d Late`}
                        </span>
                        <span className={`text-xs font-medium truncate flex items-center gap-1 ${isGlassTheme(theme.id) ? 'text-slate-600' : 'text-slate-500'}`}>
                          <Clock className={`w-3 h-3 shrink-0 ${isGlassTheme(theme.id) ? 'text-slate-400' : 'text-slate-400'}`} />
                          <span className="truncate">Due: {formattedDate}</span>
                        </span>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-black border shrink-0 ${isGlassTheme(theme.id) ? 'apple-glass-card bg-amber-500/10 text-amber-950 border-amber-300/40 shadow-xs' : 'bg-amber-50 text-amber-900 border-amber-200/80'}`}>
                        ⭐ {item.chore.defaultPoints} pts
                      </span>
                    </div>

                    {/* Chore Title (Clickable to expand checklist / details) */}
                    <div 
                      onClick={() => toggleChecklistExpansion(item.chore.id)}
                      className="cursor-pointer group flex items-start justify-between gap-2"
                      title="Click to view checklist & instructions"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug break-words group-hover:text-rose-600 transition-colors">
                          {item.chore.title}
                        </h4>
                        {item.chore.description && (
                          <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                            {item.chore.description}
                          </p>
                        )}
                      </div>
                      <div className="p-1 rounded-lg bg-slate-100 group-hover:bg-slate-200 text-slate-600 transition-colors shrink-0">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Penalty Tier Status & Next Worsening Forecast (Apple Inset Box) */}
                    <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${isGlassTheme(theme.id) ? 'bg-white/10 border-white/30 shadow-[inset_0_1px_3px_rgba(255,255,255,0.2)]' : 'bg-slate-50 border-slate-200/70'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-medium ${isGlassTheme(theme.id) ? 'text-slate-600' : 'text-slate-500'}`}>Penalty State:</span>
                        <span className="font-black text-slate-900 text-right">{item.tierInfo.tierLabel}</span>
                      </div>
                      {item.tierInfo.nextWorseningNotice && (
                        <div className={`flex items-start gap-1.5 pt-1.5 border-t text-[11px] font-semibold leading-tight ${isGlassTheme(theme.id) ? 'border-white/30 text-rose-700' : 'border-slate-200/60 text-rose-600'}`}>
                          <AlertCircle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isGlassTheme(theme.id) ? 'text-rose-600' : 'text-rose-500'}`} />
                          <span>{item.tierInfo.nextWorseningNotice}</span>
                        </div>
                      )}
                    </div>

                    {/* Expandable Quality Checklist for Kids and Reviewers */}
                    {(isExpanded || !isMomMode) && choreChecklist.length > 0 && (
                      <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                            <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
                            <span>Quality Checklist</span>
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            {checkedCount}/{choreChecklist.length} completed
                          </span>
                        </div>
                        <div className="space-y-1.5 pt-1">
                          {choreChecklist.map((task, cIdx) => {
                            const isChecked = !!checkedItems[cIdx];
                            return (
                              <button
                                key={cIdx}
                                type="button"
                                onClick={() => toggleChecklistItem(item.chore.id, cIdx)}
                                className={`w-full text-left p-2 rounded-lg border text-xs font-medium flex items-start gap-2.5 transition-all cursor-pointer active:scale-[0.99] ${
                                  isChecked 
                                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 line-through opacity-80' 
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <span className={`mt-0.5 shrink-0 ${isChecked ? 'text-emerald-600' : 'text-slate-400'}`}>
                                  {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                </span>
                                <span className="flex-1 leading-snug">{task}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Primary Action Row */}
                    {isMomMode ? (
                      /* MOM MODE: Direct Approval & Administrative Options */
                      <div className="space-y-2 pt-1">
                        {/* 1-Tap "Layla Did This (Approve 5⭐)" */}
                        <button
                          type="button"
                          onClick={() => {
                            if (onQuickApprove) {
                              onQuickApprove(item.chore.id, item.log?.id, item.effectiveDueDate, member.id);
                            }
                          }}
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-98"
                          title={`Approve that ${member.name} completed this chore`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>{member.name} Did This (Approve 5⭐)</span>
                        </button>

                        {/* Secondary 3-Column Admin Grid: Inspect / Waive / Extend */}
                        <div className="grid grid-cols-3 gap-2">
                          {onOpenInspect && (
                            <button
                              type="button"
                              onClick={() => {
                                soundFX.playPop();
                                onOpenInspect(item.chore, item.log || null);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer min-h-[38px] active:scale-98 transition-all shadow-2xs whitespace-nowrap"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                              <span>Inspect</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              soundFX.playPop();
                              setWaiveTarget({ ...item, member });
                            }}
                            className={`inline-flex items-center justify-center gap-1.5 py-2 px-2 ${isGlassTheme(theme.id) ? 'apple-glass-button text-emerald-900 border-emerald-300/40' : 'bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 border-emerald-300/80'} rounded-xl text-xs font-bold cursor-pointer min-h-[38px] active:scale-98 transition-all shadow-2xs whitespace-nowrap`}
                          >
                            <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isGlassTheme(theme.id) ? 'text-emerald-700' : 'text-emerald-600'}`} />
                            <span>Waive</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              soundFX.playPop();
                              setExtendTarget({ ...item, member });
                            }}
                            className={`inline-flex items-center justify-center gap-1.5 py-2 px-2 ${isGlassTheme(theme.id) ? 'apple-glass-button text-indigo-900 border-indigo-300/40' : theme.badgeBg + ' hover:brightness-95 ' + theme.badgeText + ' border ' + theme.badgeBorder} rounded-xl text-xs font-bold cursor-pointer min-h-[38px] active:scale-98 transition-all shadow-2xs whitespace-nowrap`}
                          >
                            <CalendarPlus className={`w-3.5 h-3.5 shrink-0 ${isGlassTheme(theme.id) ? 'text-indigo-700' : ''}`} />
                            <span>Extend</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* KID MODE (LAYLA): 1-Tap "I Did This! (Submit for Review)" */
                      <div className="pt-1 space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onMarkComplete) {
                              onMarkComplete(
                                item.chore.id, 
                                undefined, 
                                checkedItemsMap[item.chore.id] || {}, 
                                item.effectiveDueDate, 
                                member.id
                              );
                            }
                          }}
                          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all active:scale-98"
                        >
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          <span>I Did This! (Submit for Review) ✨</span>
                        </button>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => toggleChecklistExpansion(item.chore.id)}
                            className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 py-1 cursor-pointer"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                            <span>{isExpanded ? 'Hide Checklist' : `View Checklist (${choreChecklist.length})`}</span>
                          </button>

                          {onOpenInspect && (
                            <button
                              type="button"
                              onClick={() => {
                                soundFX.playPop();
                                onOpenInspect(item.chore, item.log || null);
                              }}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 py-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Open Details & Proof</span>
                            </button>
                          )}
                        </div>
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
