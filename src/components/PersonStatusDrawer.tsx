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
  ChevronUp,
  Check,
  Eye,
  CheckSquare,
  Square,
  ClipboardList,
  Camera,
  MessageSquare,
  Maximize2
} from 'lucide-react';
import { 
  Chore, 
  HouseholdMember, 
  PersonStatusType,
  ChoreAssignmentLog
} from '../types';
import { Avatar } from './Avatar';
import { PersonStatusSummary, OverdueChoreItem } from '../utils/penaltyEngine';
import { soundFX } from '../utils/audio';
import { formatDisplayDate } from '../utils/storage';
import { ThemeConfig, THEMES } from '../utils/theme';
import { useBottomSheet } from '../hooks/useBottomSheet';
import { BottomSheetGrabber } from './BottomSheetGrabber';
import { CategoryBadge } from './CategoryBadge';

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
  // Dedicated Details & Proof modal state
  const [detailModalItem, setDetailModalItem] = useState<OverdueChoreItem | null>(null);
  // Full-screen proof photo viewer state
  const [enlargedPhotoUrl, setEnlargedPhotoUrl] = useState<string | null>(null);

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
                const hasProofOrFeedback = !!(item.log?.proofPhotoUrl || item.log?.completedNote || item.log?.feedbackNote);

                return (
                  <div
                    key={`${item.chore.id}_${item.effectiveDueDate}_${idx}`}
                    className={`rounded-2xl border p-4 shadow-xs transition-all space-y-3 ${
                      isGlassTheme(theme.id) 
                        ? "bg-white/95 dark:bg-slate-900/95 border-white/60 dark:border-slate-700/80 shadow-sm" 
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                    }`}
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
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-black border shrink-0 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-200/80 dark:border-amber-800">
                        ⭐ {item.chore.defaultPoints} pts
                      </span>
                    </div>

                    {/* Chore Title (Clickable to expand checklist / details) */}
                    <div 
                      onClick={() => toggleChecklistExpansion(item.chore.id)}
                      className="cursor-pointer group flex items-start justify-between gap-2 select-none"
                      title="Click to view checklist & instructions"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug break-words group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                          {item.chore.title}
                        </h4>
                        {item.chore.description && (
                          <p className={`text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {item.chore.description}
                          </p>
                        )}
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shrink-0">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Proof / Notes / Feedback Badges */}
                    {hasProofOrFeedback && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {item.log?.proofPhotoUrl && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            <Camera className="w-3 h-3" />
                            <span>Photo Proof</span>
                          </span>
                        )}
                        {item.log?.completedNote && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <MessageSquare className="w-3 h-3" />
                            <span>Note Attached</span>
                          </span>
                        )}
                        {item.log?.feedbackNote && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <AlertCircle className="w-3 h-3" />
                            <span>Mom Feedback</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Penalty Tier Status & Next Worsening Forecast */}
                    <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${isGlassTheme(theme.id) ? 'bg-white/10 border-white/30 shadow-[inset_0_1px_3px_rgba(255,255,255,0.2)]' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-700'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-500 dark:text-slate-400">Penalty State:</span>
                        <span className="font-black text-slate-900 dark:text-white text-right">{item.tierInfo.tierLabel}</span>
                      </div>
                      {item.tierInfo.nextWorseningNotice && (
                        <div className="flex items-start gap-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-700 text-[11px] font-semibold leading-tight text-rose-600 dark:text-rose-400">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500 dark:text-rose-400" />
                          <span>{item.tierInfo.nextWorseningNotice}</span>
                        </div>
                      )}
                    </div>

                    {/* Expandable Quality Checklist (Strictly controlled by isExpanded!) */}
                    {isExpanded && choreChecklist.length > 0 && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <ClipboardList className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            <span>Quality Checklist</span>
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
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
                                className={`w-full text-left p-2.5 rounded-lg border text-xs font-medium flex items-start gap-2.5 transition-all cursor-pointer min-h-[38px] active:scale-[0.99] ${
                                  isChecked 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 line-through opacity-85' 
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                }`}
                              >
                                <span className={`mt-0.5 shrink-0 ${isChecked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
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
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-98 min-h-[40px]"
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
                              className="inline-flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold cursor-pointer min-h-[40px] active:scale-98 transition-all shadow-2xs whitespace-nowrap"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                              <span>Inspect</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              soundFX.playPop();
                              setWaiveTarget({ ...item, member });
                            }}
                            className="inline-flex items-center justify-center gap-1.5 py-2 px-2 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 active:bg-emerald-200 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700 rounded-xl text-xs font-bold cursor-pointer min-h-[40px] active:scale-98 transition-all shadow-2xs whitespace-nowrap"
                          >
                            <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>Waive</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              soundFX.playPop();
                              setExtendTarget({ ...item, member });
                            }}
                            className={`inline-flex items-center justify-center gap-1.5 py-2 px-2 ${theme.badgeBg} hover:brightness-95 ${theme.badgeText} border ${theme.badgeBorder} rounded-xl text-xs font-bold cursor-pointer min-h-[40px] active:scale-98 transition-all shadow-2xs whitespace-nowrap`}
                          >
                            <CalendarPlus className="w-3.5 h-3.5 shrink-0" />
                            <span>Extend</span>
                          </button>
                        </div>

                        {/* Bottom Utility Row: View/Hide Checklist + Open Details & Proof */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                          {choreChecklist.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => toggleChecklistExpansion(item.chore.id)}
                              className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer min-h-[36px]"
                            >
                              <ClipboardList className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                              <span>{isExpanded ? 'Hide Checklist' : `View Checklist (${choreChecklist.length})`}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          ) : <div />}

                          <button
                            type="button"
                            onClick={() => {
                              soundFX.playPop();
                              setDetailModalItem(item);
                            }}
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 active:scale-95 cursor-pointer min-h-[36px] transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Open Details & Proof</span>
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
                          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all active:scale-98 min-h-[44px]"
                        >
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          <span>I Did This! (Submit for Review) ✨</span>
                        </button>

                        {/* Interactive Options: View/Hide Checklist & Open Details & Proof */}
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          {choreChecklist.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => toggleChecklistExpansion(item.chore.id)}
                              className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer min-h-[36px]"
                            >
                              <ClipboardList className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                              <span>{isExpanded ? 'Hide Checklist' : `View Checklist (${choreChecklist.length})`}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          ) : <div />}

                          <button
                            type="button"
                            onClick={() => {
                              soundFX.playPop();
                              setDetailModalItem(item);
                            }}
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 active:scale-95 cursor-pointer min-h-[36px] transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Open Details & Proof</span>
                          </button>
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

      {/* ======================================================== */}
      {/* DEDICATED CHORE DETAILS & PROOF SHEET (Z-[70]) */}
      {/* ======================================================== */}
      {detailModalItem && (
        <div 
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setDetailModalItem(null)}
        >
          <div 
            className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200 safe-area-pb"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60">
              <div className="flex items-center gap-2 min-w-0">
                <CategoryBadge category={detailModalItem.chore.category} size="sm" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                  Details & Proof
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Details Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {/* Title & Points */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug break-words">
                    {detailModalItem.chore.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Assigned to <span className="font-bold text-slate-700 dark:text-slate-200">{member.name}</span> • Due: {formatDisplayDate(detailModalItem.effectiveDueDate)}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 shrink-0">
                  ⭐ {detailModalItem.chore.defaultPoints} pts
                </span>
              </div>

              {/* Instructions / Description */}
              {detailModalItem.chore.description && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <span className="text-[11px] font-extrabold uppercase text-slate-400 dark:text-slate-500 block">
                    Instructions & Description
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    {detailModalItem.chore.description}
                  </p>
                </div>
              )}

              {/* Quality Criteria Checklist */}
              {(detailModalItem.chore.qualityChecklist || []).length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4 text-indigo-500" />
                      <span>Quality Checklist Criteria</span>
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {Object.values(checkedItemsMap[detailModalItem.chore.id] || {}).filter(Boolean).length}/{(detailModalItem.chore.qualityChecklist || []).length} completed
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {(detailModalItem.chore.qualityChecklist || []).map((task, cIdx) => {
                      const isChecked = !!(checkedItemsMap[detailModalItem.chore.id] || {})[cIdx];
                      return (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() => toggleChecklistItem(detailModalItem.chore.id, cIdx)}
                          className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm font-medium flex items-start gap-2.5 transition-all cursor-pointer min-h-[44px] active:scale-[0.99] ${
                            isChecked
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 line-through opacity-85'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <span className={`mt-0.5 shrink-0 ${isChecked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                            {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </span>
                          <span className="flex-1 leading-snug">{task}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Photo Proof Display (if available) */}
              {detailModalItem.log?.proofPhotoUrl && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Submitted Photo Proof:</span>
                  </span>
                  <div 
                    onClick={() => setEnlargedPhotoUrl(detailModalItem.log!.proofPhotoUrl!)}
                    className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 cursor-pointer aspect-video max-h-52 flex items-center justify-center"
                  >
                    <img 
                      src={detailModalItem.log.proofPhotoUrl} 
                      alt="Chore proof submission"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-bold">
                      <Maximize2 className="w-4 h-4" />
                      <span>Tap to Enlarge</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Child's Submission Note */}
              {detailModalItem.log?.completedNote && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-1">
                  <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                    <span>{member.name}'s Note:</span>
                  </span>
                  <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 italic leading-relaxed">
                    "{detailModalItem.log.completedNote}"
                  </p>
                </div>
              )}

              {/* Mom's Review Feedback Note (e.g. Redo reason) */}
              {detailModalItem.log?.feedbackNote && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800 space-y-1">
                  <span className="text-[11px] font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Mom's Review Feedback:</span>
                  </span>
                  <p className="text-xs sm:text-sm text-rose-800 dark:text-rose-200 italic leading-relaxed">
                    "{detailModalItem.log.feedbackNote}"
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions for Detail Modal */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60">
              {isMomMode ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onQuickApprove) {
                        onQuickApprove(detailModalItem.chore.id, detailModalItem.log?.id, detailModalItem.effectiveDueDate, member.id);
                      }
                      setDetailModalItem(null);
                    }}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all active:scale-98 min-h-[44px]"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{member.name} Did This (Approve 5⭐)</span>
                  </button>

                  {onOpenInspect && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetChore = detailModalItem.chore;
                        const targetLog = detailModalItem.log || null;
                        setDetailModalItem(null);
                        onOpenInspect(targetChore, targetLog);
                      }}
                      className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                      <span>Inspect & Grade with Stars ⭐</span>
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (onMarkComplete) {
                      onMarkComplete(
                        detailModalItem.chore.id,
                        undefined,
                        checkedItemsMap[detailModalItem.chore.id] || {},
                        detailModalItem.effectiveDueDate,
                        member.id
                      );
                    }
                    setDetailModalItem(null);
                  }}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all active:scale-98 min-h-[44px]"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>I Did This! (Submit for Review) ✨</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* FULL-SCREEN PHOTO PROOF ENLARGEMENT VIEWER (Z-[85]) */}
      {/* ======================================================== */}
      {enlargedPhotoUrl && (
        <div 
          className="fixed inset-0 z-[85] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setEnlargedPhotoUrl(null)}
        >
          <button
            type="button"
            onClick={() => setEnlargedPhotoUrl(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close enlarged photo"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={enlargedPhotoUrl} 
            alt="Submitted photo proof" 
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
