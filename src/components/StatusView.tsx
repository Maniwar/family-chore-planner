import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Send, 
  ShieldAlert, 
  History, 
  Settings, 
  ChevronRight, 
  X, 
  Plus, 
  Check, 
  ArrowRight, 
  CalendarPlus, 
  Ban, 
  TrendingDown, 
  TrendingUp, 
  Sliders, 
  Info,
  BellRing,
  BarChart2,
  Filter,
  Search,
  Trophy,
  Users,
  RefreshCw,
  Star,
  CheckCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Chore, 
  ChoreAssignmentLog, 
  HouseholdMember, 
  HouseholdPenaltySettings, 
  ChoreEvent, 
  NudgeRecord, 
  PersonStatusType 
} from '../types';
import { Avatar } from './Avatar';
import { 
  evaluateHouseholdStatus, 
  evaluateMemberStatusThisWeek, 
  getISOWeekNumber, 
  OverdueChoreItem,
  PersonStatusSummary 
} from '../utils/penaltyEngine';
import { soundFX } from '../utils/audio';
import { ThemePreset, THEMES } from '../utils/theme';
import { PersonStatusDrawer } from './PersonStatusDrawer';
import { HouseholdDrilldownDrawer } from './HouseholdDrilldownDrawer';

interface StatusViewProps {
  members: HouseholdMember[];
  chores: Chore[];
  logs: ChoreAssignmentLog[];
  penaltySettings: HouseholdPenaltySettings;
  events: ChoreEvent[];
  nudges: NudgeRecord[];
  isMomMode: boolean;
  currentTheme?: ThemePreset;
  onSendNudge: (memberId: string, memberName: string, message: string, choreId?: string, choreTitle?: string) => void;
  onWaivePenalty: (choreId: string, logId: string, memberId: string, reason: string, choreDate?: string) => void;
  onExtendDueDate: (choreId: string, logId: string, memberId: string, newDueDate: string, reason: string, choreDate?: string) => void;
  onBatchWaivePenalties?: (items: { choreId: string; logId?: string; memberId: string; date: string; title?: string }[], reason: string) => void;
  onUpdatePenaltySettings: (settings: HouseholdPenaltySettings) => void;
  onTriggerSettlement?: () => void;
  onNavigateToInspection?: () => void;
}

export const StatusView: React.FC<StatusViewProps> = ({
  members,
  chores,
  logs,
  penaltySettings,
  events,
  nudges,
  isMomMode,
  currentTheme = 'rose',
  onSendNudge,
  onWaivePenalty,
  onExtendDueDate,
  onBatchWaivePenalties,
  onUpdatePenaltySettings,
  onTriggerSettlement,
  onNavigateToInspection,
}) => {
  const theme = THEMES[currentTheme] || THEMES.rose;
  const [activeSubTab, setActiveSubTab] = useState<'now' | 'timeline' | 'history'>('now');
  const [selectedPersonSheet, setSelectedPersonSheet] = useState<PersonStatusSummary | null>(null);
  const [drilldownType, setDrilldownType] = useState<'overdue' | 'review' | 'redo' | 'overview' | null>(null);
  const [drilldownFilterMemberId, setDrilldownFilterMemberId] = useState<string>('all');
  const [historyFilterMemberId, setHistoryFilterMemberId] = useState<string>('all');
  const [historyFilterType, setHistoryFilterType] = useState<string>('all');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [analyticsMetric, setAnalyticsMetric] = useState<'all' | 'waived' | 'overdue' | 'redo'>('all');

  // Modals & Bottom Sheets
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [nudgeModalTarget, setNudgeModalTarget] = useState<{ member: HouseholdMember; chore?: Chore } | null>(null);
  const [nudgeMessage, setNudgeMessage] = useState<string>('');
  
  // Waive & Extend dialog state
  const [waiveTarget, setWaiveTarget] = useState<OverdueChoreItem | null>(null);
  const [waiveReason, setWaiveReason] = useState<string>('Family schedule conflict / illness');
  const [extendTarget, setExtendTarget] = useState<OverdueChoreItem | null>(null);
  const [extendDays, setExtendDays] = useState<number>(1);
  const [extendReason, setExtendReason] = useState<string>('Exam study / extra school project');

  // Settings local state
  const [tempSettings, setTempSettings] = useState<HouseholdPenaltySettings>(penaltySettings);

  const householdEvaluation = evaluateHouseholdStatus(members, chores, logs, penaltySettings);
  const { onTrackPercent, totalOverdue, totalRedo, awaitingInspectionCount, behindMembers, onTrackMembers } = householdEvaluation;

  // Refresh selected person summary if updated
  const activePersonSummary = selectedPersonSheet 
    ? evaluateMemberStatusThisWeek(
        members.find(m => m.id === selectedPersonSheet.member.id) || selectedPersonSheet.member,
        chores,
        logs,
        penaltySettings
      )
    : null;

  // Comprehensive Timeline Data (last 14 days)
  const timelineData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const monthDay = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      const waived = events.filter(e => e.type === 'penalty_waived' && e.createdAt.startsWith(dateStr)).length;
      const penalties = events.filter(e => e.type === 'penalty_applied' && e.createdAt.startsWith(dateStr)).length;
      const redos = events.filter(e => (e.type === 'failed_inspection' || e.reason?.toLowerCase().includes('redo')) && e.createdAt.startsWith(dateStr)).length +
        logs.filter(l => (l.status === 'needs_redo' || l.qualityGrade === 'Redo') && l.reviewedAt?.startsWith(dateStr)).length;
      const overdue = logs.filter(l => l.date === dateStr && l.daysLate && l.daysLate > 0).length;

      data.push({
        date: monthDay,
        dateStr,
        waived,
        penalties,
        redos,
        overdue,
        totalActivity: waived + penalties + redos + overdue,
      });
    }
    return data;
  }, [events, logs]);

  // Member Waiver & Lateness Breakdown Stats
  const memberWaiverStats = useMemo(() => {
    const totalHouseholdWaivers = events.filter(e => e.type === 'penalty_waived').length;
    const totalHouseholdOverdue = logs.filter(l => l.daysLate && l.daysLate > 0).length;
    const totalHouseholdRedos = logs.filter(l => l.status === 'needs_redo' || l.qualityGrade === 'Redo').length +
      events.filter(e => e.type === 'failed_inspection').length;

    const stats = members.map(m => {
      const memberEvents = events.filter(e => e.memberId === m.id);
      const waivedEvents = memberEvents.filter(e => e.type === 'penalty_waived');
      const waivedCount = waivedEvents.length;
      const penaltyCount = memberEvents.filter(e => e.type === 'penalty_applied').length;
      const redoCount = logs.filter(l => l.memberId === m.id && (l.status === 'needs_redo' || l.qualityGrade === 'Redo')).length +
        memberEvents.filter(e => e.type === 'failed_inspection').length;
      const overdueCount = logs.filter(l => l.memberId === m.id && ((l.daysLate && l.daysLate > 0) || l.status === 'late')).length;
      const approvedCount = logs.filter(l => l.memberId === m.id && l.status === 'approved').length;
      const waiverPercentage = totalHouseholdWaivers > 0 ? Math.round((waivedCount / totalHouseholdWaivers) * 100) : 0;
      const recentWaiver = waivedEvents[0];

      return {
        member: m,
        id: m.id,
        name: m.name,
        waivedCount,
        penaltyCount,
        redoCount,
        overdueCount,
        approvedCount,
        waiverPercentage,
        recentWaiver,
      };
    });

    const sortedByWaivers = [...stats].sort((a, b) => b.waivedCount - a.waivedCount);
    const sortedByOverdue = [...stats].sort((a, b) => b.overdueCount - a.overdueCount);
    const sortedByRedos = [...stats].sort((a, b) => b.redoCount - a.redoCount);

    return {
      stats,
      totalHouseholdWaivers,
      totalHouseholdOverdue,
      totalHouseholdRedos,
      mostWaivedMember: sortedByWaivers[0],
      mostOverdueMember: sortedByOverdue[0],
      mostRedosMember: sortedByRedos[0],
      sortedByWaivers,
    };
  }, [members, events, logs]);

  // Top Waived / Delayed Chore Types
  const topWaivedChores = useMemo(() => {
    const choreMap: { [title: string]: { count: number; memberNames: Set<string>; reasons: string[] } } = {};
    events.filter(e => e.type === 'penalty_waived' && e.choreTitle).forEach(e => {
      const title = e.choreTitle!;
      if (!choreMap[title]) choreMap[title] = { count: 0, memberNames: new Set(), reasons: [] };
      choreMap[title].count++;
      choreMap[title].memberNames.add(e.memberName);
      if (e.reason) choreMap[title].reasons.push(e.reason);
    });
    return Object.entries(choreMap)
      .map(([title, data]) => ({
        title,
        count: data.count,
        members: Array.from(data.memberNames).join(', '),
        recentReason: data.reasons[0] || 'Waived by parent',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [events]);

  // Filtered History Events
  const filteredEvents = events.filter(e => {
    if (historyFilterMemberId !== 'all' && e.memberId !== historyFilterMemberId) return false;
    if (historyFilterType !== 'all' && e.type !== historyFilterType) return false;
    if (historySearchQuery.trim()) {
      const q = historySearchQuery.toLowerCase();
      const matchName = e.memberName?.toLowerCase().includes(q);
      const matchChore = e.choreTitle?.toLowerCase().includes(q);
      const matchReason = e.reason?.toLowerCase().includes(q);
      if (!matchName && !matchChore && !matchReason) return false;
    }
    return true;
  });

  // Group events by Week & Year
  const groupedEvents: { [key: string]: ChoreEvent[] } = {};
  filteredEvents.forEach(evt => {
    const key = `Week ${evt.weekNumber || 35}, ${evt.year || 2026}`;
    if (!groupedEvents[key]) groupedEvents[key] = [];
    groupedEvents[key].push(evt);
  });

  const handleOpenNudge = (member: HouseholdMember, chore?: Chore) => {
    soundFX.playPop();
    setNudgeModalTarget({ member, chore });
    setNudgeMessage(
      chore 
        ? `Hey ${member.name.split(' ')[0]}, please remember to finish "${chore.title}" before dinner tonight! ⭐`
        : `Hey ${member.name.split(' ')[0]}, please take a look at your chore checklist today! You've got this! ✨`
    );
  };

  const handleSendNudgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nudgeModalTarget || !nudgeMessage.trim()) return;
    soundFX.playComplete();
    onSendNudge(
      nudgeModalTarget.member.id,
      nudgeModalTarget.member.name,
      nudgeMessage.trim(),
      nudgeModalTarget.chore?.id,
      nudgeModalTarget.chore?.title
    );
    setNudgeModalTarget(null);
    setNudgeMessage('');
  };

  const handleWaiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waiveTarget) return;
    soundFX.playStarChime(5);
    const memberId = (waiveTarget as any).member?.id || selectedPersonSheet?.member.id || waiveTarget.chore.assignedMemberId;
    const choreDate = waiveTarget.originalDueDate || waiveTarget.effectiveDueDate || waiveTarget.log?.date;
    const logId = waiveTarget.log?.id || `log_${waiveTarget.chore.id}_${choreDate}`;
    onWaivePenalty(waiveTarget.chore.id, logId, memberId, waiveReason.trim(), choreDate);
    setWaiveTarget(null);
    setWaiveReason('Family schedule conflict / illness');
  };

  const handleExtendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendTarget) return;
    soundFX.playPop();
    const memberId = (extendTarget as any).member?.id || selectedPersonSheet?.member.id || extendTarget.chore.assignedMemberId;
    const choreDate = extendTarget.originalDueDate || extendTarget.effectiveDueDate || extendTarget.log?.date;
    const d = new Date();
    d.setDate(d.getDate() + extendDays);
    const newDueDate = d.toISOString().split('T')[0];
    const logId = extendTarget.log?.id || `log_${extendTarget.chore.id}_${choreDate}`;
    onExtendDueDate(extendTarget.chore.id, logId, memberId, newDueDate, extendReason.trim(), choreDate);
    setExtendTarget(null);
    setExtendReason('Exam study / extra school project');
  };

  const getStatusBadge = (status: PersonStatusType) => {
    switch (status) {
      case 'on_track':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>On Track</span>
          </span>
        );
      case 'behind':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Behind</span>
          </span>
        );
      case 'way_behind':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
            <span>Way Behind</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Top Header & Sub-Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Household Status
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Live accountability, lateness tracking & audit history
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isMomMode && (
              <button
                onClick={() => {
                  soundFX.playPop();
                  setTempSettings(penaltySettings);
                  setShowSettingsModal(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer min-h-[36px] active:scale-95"
                title="Penalty and Grade Settings"
              >
                <Settings className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden xs:inline">Rules & Grades</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Tabs: Now vs Trends & Waivers vs History */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => {
              soundFX.playPop();
              setActiveSubTab('now');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] ${
              activeSubTab === 'now'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden xs:inline">Now</span>
            <span className="xs:hidden">Live</span>
            {behindMembers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                {behindMembers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              soundFX.playPop();
              setActiveSubTab('timeline');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] ${
              activeSubTab === 'timeline'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Trends & Waivers</span>
            {memberWaiverStats.totalHouseholdWaivers > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                {memberWaiverStats.totalHouseholdWaivers}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              soundFX.playPop();
              setActiveSubTab('history');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] ${
              activeSubTab === 'history'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-600" />
            <span>Audit Ledger</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-slate-200 text-slate-700">
              {events.length}
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: NOW (LIVE STATUS & PEOPLE) */}
      {/* ======================================================== */}
      {activeSubTab === 'now' && (
        <div className="space-y-4">
          {/* Household Summary Card */}
          <div className={`${theme.heroBannerBg} ${theme.heroBannerText} rounded-2xl p-4 sm:p-5 shadow-sm border ${theme.heroBannerBorder} ${theme.heroBannerGlow}`}>
            <div 
              onClick={() => {
                soundFX.playPop();
                setDrilldownType('overview');
              }}
              className="flex items-center justify-between gap-2 mb-3 cursor-pointer hover:opacity-95 transition-opacity"
              title="Click to view weekly breakdown"
            >
              <div>
                <span className="text-[11px] uppercase tracking-wider opacity-80 font-extrabold flex items-center gap-1">
                  <span>Weekly Family Overview</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight">
                    {onTrackPercent}%
                  </span>
                  <span className="text-xs opacity-85 font-medium">
                    on-time completion rate
                  </span>
                </div>
              </div>

              {/* Status Meter Visual */}
              <div className="w-14 h-14 rounded-full border-4 border-white/30 flex items-center justify-center bg-white/10 relative shrink-0 shadow-inner">
                <span className="text-base font-black">
                  {onTrackPercent}%
                </span>
              </div>
            </div>

            {/* Quick Stats Grid with Interactive Drilldowns */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/20 text-center">
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setDrilldownFilterMemberId('all');
                  setDrilldownType('overdue');
                }}
                className="bg-white/15 hover:bg-white/25 active:scale-95 transition-all rounded-xl p-2 cursor-pointer border border-white/10 hover:border-white/30 min-h-[48px] flex flex-col items-center justify-center group"
                title="Click to view all overdue chores"
              >
                <div className="flex items-center justify-center gap-0.5">
                  <span className="text-lg font-black text-rose-200">{totalOverdue}</span>
                  <ChevronRight className="w-3 h-3 text-rose-200/70 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[10px] opacity-90 font-bold uppercase tracking-tight">
                  Overdue
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  if (awaitingInspectionCount > 0 && onNavigateToInspection) {
                    onNavigateToInspection();
                  } else {
                    setDrilldownType('review');
                  }
                }}
                className="bg-white/15 hover:bg-white/25 active:scale-95 transition-all rounded-xl p-2 cursor-pointer border border-white/10 hover:border-white/30 min-h-[48px] flex flex-col items-center justify-center group"
                title="Click to review pending chores"
              >
                <div className="flex items-center justify-center gap-0.5">
                  <span className="text-lg font-black text-amber-200">{awaitingInspectionCount}</span>
                  <ChevronRight className="w-3 h-3 text-amber-200/70 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[10px] opacity-90 font-bold uppercase tracking-tight">
                  Awaiting Review
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setDrilldownFilterMemberId('all');
                  setDrilldownType('redo');
                }}
                className="bg-white/15 hover:bg-white/25 active:scale-95 transition-all rounded-xl p-2 cursor-pointer border border-white/10 hover:border-white/30 min-h-[48px] flex flex-col items-center justify-center group"
                title="Click to view redo queue"
              >
                <div className="flex items-center justify-center gap-0.5">
                  <span className="text-lg font-black text-white">{totalRedo}</span>
                  <ChevronRight className="w-3 h-3 text-white/70 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[10px] opacity-90 font-bold uppercase tracking-tight">
                  Redo Queue
                </div>
              </button>
            </div>
          </div>

          {/* Section: Needs Attention (Behind & Way Behind) */}
          {behindMembers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-black uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Needs Attention ({behindMembers.length})</span>
                  </h2>
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">• Sorted by severity</span>
                </div>

                {isMomMode && totalOverdue > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFX.playStarChime(5);
                      const allOverdue = behindMembers.flatMap(s =>
                        s.overdueItems.map(i => ({
                          choreId: i.chore.id,
                          logId: i.log?.id,
                          memberId: s.member.id,
                          date: i.originalDueDate || i.effectiveDueDate,
                          title: i.chore.title,
                        }))
                      );
                      if (onBatchWaivePenalties) {
                        onBatchWaivePenalties(allOverdue, 'Household admin waived all family overdue chores');
                      } else {
                        allOverdue.forEach(item => {
                          onWaivePenalty(item.choreId, item.logId || `log_${item.choreId}_${item.date}`, item.memberId, 'Parent waived backlog', item.date);
                        });
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black shadow-xs cursor-pointer min-h-[36px] active:scale-95 transition-all"
                    title="Waive all family overdue chores immediately"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Waive All ({totalOverdue})</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {behindMembers.map((summary) => {
                  const m = summary.member;
                  const isWayBehind = summary.status === 'way_behind';
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        soundFX.playPop();
                        setSelectedPersonSheet(summary);
                      }}
                      className={`rounded-2xl border p-3.5 sm:p-4 transition-all cursor-pointer hover:shadow-xs active:scale-[0.99] flex flex-col justify-between ${
                        isWayBehind
                          ? 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-200'
                          : 'bg-amber-50/40 border-amber-300'
                      }`}
                    >
                      {/* Member Identity & Drilldown Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            photoUrl={m.avatarPhotoUrl}
                            emoji={m.avatarEmoji}
                            name={m.name}
                            size="md"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                                {m.name}
                              </h3>
                              {getStatusBadge(summary.status)}
                            </div>
                            <p className="text-xs text-slate-600 font-semibold mt-0.5 break-words">
                              {summary.summaryLine}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center text-slate-400 shrink-0 pt-0.5">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Overdue chore pills preview */}
                      {summary.overdueItems.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap gap-1.5">
                          {summary.overdueItems.slice(0, 3).map((item, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold border max-w-full sm:max-w-xs truncate ${item.tierInfo.severityColor}`}
                            >
                              {item.isRedo ? '🔄 Redo: ' : `${item.daysLate}d Late: `}
                              {item.chore.title}
                            </span>
                          ))}
                          {summary.overdueItems.length > 3 && (
                            <span className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              +{summary.overdueItems.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Action Bar for Mom Mode */}
                      {isMomMode && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-end gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenNudge(m);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer min-h-[36px] active:scale-95 transition-all"
                            title="Send Nudge"
                          >
                            <BellRing className="w-3.5 h-3.5 text-amber-600" />
                            <span>Nudge</span>
                          </button>

                          {summary.overdueItems.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                soundFX.playStarChime(5);
                                const itemsToWaive = summary.overdueItems.map(i => ({
                                  choreId: i.chore.id,
                                  logId: i.log?.id,
                                  memberId: m.id,
                                  date: i.originalDueDate || i.effectiveDueDate,
                                  title: i.chore.title,
                                }));
                                if (onBatchWaivePenalties) {
                                  onBatchWaivePenalties(itemsToWaive, `Waived overdue backlog for ${m.name}`);
                                } else {
                                  itemsToWaive.forEach(item => {
                                    onWaivePenalty(item.choreId, item.logId || `log_${item.choreId}_${item.date}`, item.memberId, 'Parent waived backlog', item.date);
                                  });
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black shadow-2xs flex items-center gap-1.5 cursor-pointer min-h-[36px] active:scale-95 transition-all"
                              title={`Waive all ${summary.overdueItems.length} overdue chores for ${m.name}`}
                            >
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Waive ({summary.overdueItems.length})</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: On Track Members */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>On Track ({onTrackMembers.length})</span>
              </h2>
            </div>

            {onTrackMembers.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-500">
                All assigned members currently have pending or overdue items.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {onTrackMembers.map((summary) => {
                  const m = summary.member;
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        soundFX.playPop();
                        setSelectedPersonSheet(summary);
                      }}
                      className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 hover:border-emerald-300 hover:shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          photoUrl={m.avatarPhotoUrl}
                          emoji={m.avatarEmoji}
                          name={m.name}
                          size="md"
                        />
                        <div className="min-w-0">
                          <h3 className="text-sm font-black text-slate-900 truncate">
                            {m.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {getStatusBadge('on_track')}
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded-md border border-amber-200">
                              ⭐ {m.currentPoints || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: TRENDS & WAIVERS ANALYTICS (TIMELINE) */}
      {/* ======================================================== */}
      {activeSubTab === 'timeline' && (
        <div className="space-y-4">
          {/* Top Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Total Waivers Card */}
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Total Waived
                </span>
                <Sparkles className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-950 mt-1">
                {memberWaiverStats.totalHouseholdWaivers}
              </div>
              <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                {memberWaiverStats.mostWaivedMember?.waivedCount 
                  ? `Most: ${memberWaiverStats.mostWaivedMember.name.split(' ')[0]} (${memberWaiverStats.mostWaivedMember.waivedCount})`
                  : 'No penalties waived yet'}
              </p>
            </div>

            {/* Overdue Total Card */}
            <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
                  Total Overdue
                </span>
                <Clock className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-950 mt-1">
                {memberWaiverStats.totalHouseholdOverdue + totalOverdue}
              </div>
              <p className="text-[11px] font-semibold text-rose-700 mt-0.5">
                {memberWaiverStats.mostOverdueMember?.overdueCount
                  ? `Highest: ${memberWaiverStats.mostOverdueMember.name.split(' ')[0]} (${memberWaiverStats.mostOverdueMember.overdueCount})`
                  : 'All on time'}
              </p>
            </div>

            {/* Redos Total Card */}
            <div className="bg-purple-50/80 border border-purple-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
                  Redos / Retries
                </span>
                <RefreshCw className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-purple-950 mt-1">
                {memberWaiverStats.totalHouseholdRedos}
              </div>
              <p className="text-[11px] font-semibold text-purple-700 mt-0.5">
                Quality checks requested
              </p>
            </div>

            {/* Accountability Health Score */}
            <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
                  On-Time Rate
                </span>
                <CheckCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-indigo-950 mt-1">
                {onTrackPercent}%
              </div>
              <p className="text-[11px] font-semibold text-indigo-700 mt-0.5">
                {behindMembers.length === 0 ? 'All helpers on track' : `${behindMembers.length} behind schedule`}
              </p>
            </div>
          </div>

          {/* 14-Day Timeline Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span>Accountability Timeline & Trend (Past 14 Days)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Track when chores were overdue, redos requested, and penalties waived over time
                </p>
              </div>

              {/* Metric filter toggles */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'waived', label: 'Waived' },
                  { id: 'overdue', label: 'Overdue' },
                  { id: 'redo', label: 'Redos' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setAnalyticsMetric(m.id as any)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      analyticsMetric === m.id
                        ? 'bg-white text-slate-900 shadow-2xs font-black'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Line / Area Chart */}
            <div className="w-full h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWaived" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorOverdue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorRedos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '8px' }} 
                  />
                  {(analyticsMetric === 'all' || analyticsMetric === 'waived') && (
                    <Area 
                      type="monotone" 
                      dataKey="waived" 
                      name="Penalties Waived" 
                      stroke="#10b981" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorWaived)" 
                    />
                  )}
                  {(analyticsMetric === 'all' || analyticsMetric === 'overdue') && (
                    <Area 
                      type="monotone" 
                      dataKey="overdue" 
                      name="Overdue Chores" 
                      stroke="#f43f5e" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorOverdue)" 
                    />
                  )}
                  {(analyticsMetric === 'all' || analyticsMetric === 'redo') && (
                    <Area 
                      type="monotone" 
                      dataKey="redos" 
                      name="Redos / Quality Fixes" 
                      stroke="#8b5cf6" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorRedos)" 
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Member Comparison Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Member Comparison: Waivers vs Overdue vs Redos</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Direct breakdown for every family member
                </p>
              </div>
            </div>

            <div className="w-full h-56 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberWaiverStats.stats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 700 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '8px' }} />
                  <Bar dataKey="waivedCount" name="Penalties Waived" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="overdueCount" name="Overdue Chores" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="redoCount" name="Redos Requested" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* "WHO IS GETTING THINGS WAIVED THE MOST?" - Leaderboard & Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Who Is Getting Things Waived The Most?
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Ranked by total lateness waivers granted by parent
                  </p>
                </div>
              </div>
            </div>

            {memberWaiverStats.totalHouseholdWaivers === 0 ? (
              <div className="bg-slate-50 rounded-xl p-6 text-center text-slate-500 space-y-1">
                <Sparkles className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No penalties have been waived yet.</p>
                <p className="text-[11px] text-slate-400">When you waive an overdue penalty, full audit records and share percentages appear here.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {memberWaiverStats.sortedByWaivers.map((stat, idx) => {
                  const isTop = idx === 0 && stat.waivedCount > 0;
                  return (
                    <div 
                      key={stat.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isTop 
                          ? 'bg-emerald-50/70 border-emerald-200 shadow-2xs'
                          : 'bg-slate-50/60 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Rank badge */}
                          <div className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                            idx === 0 ? 'bg-amber-400 text-amber-950 shadow-2xs' :
                            idx === 1 ? 'bg-slate-200 text-slate-700' :
                            idx === 2 ? 'bg-amber-700 text-white' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {idx + 1}
                          </div>

                          <Avatar
                            photoUrl={stat.member.avatarPhotoUrl}
                            emoji={stat.member.avatarEmoji}
                            name={stat.member.name}
                            size="sm"
                          />

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                                {stat.name}
                              </h4>
                              {isTop && (
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-600 text-white">
                                  Most Waived
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">
                              ⭐ {stat.member.currentPoints || 0} pts · {stat.overdueCount} overdue · {stat.redoCount} redos
                            </p>
                          </div>
                        </div>

                        {/* Waiver Count & Share Badge */}
                        <div className="text-right shrink-0">
                          <div className="text-sm sm:text-base font-black text-emerald-700">
                            {stat.waivedCount} waiver{stat.waivedCount === 1 ? '' : 's'}
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">
                            {stat.waiverPercentage}% of family total
                          </span>
                        </div>
                      </div>

                      {/* Percentage Bar */}
                      <div className="mt-2.5 w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(stat.waiverPercentage, stat.waivedCount > 0 ? 5 : 0)}%` }}
                        />
                      </div>

                      {/* Recent Waiver Note */}
                      {stat.recentWaiver && (
                        <div className="mt-2 text-[11px] text-slate-600 bg-white/80 rounded-xl p-2 border border-slate-200/70 flex items-start gap-1.5">
                          <Sparkles className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="truncate">
                            <strong>Latest:</strong> {stat.recentWaiver.choreTitle || 'Chore'} — "{stat.recentWaiver.reason}"
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Waived / Delayed Chore Types */}
          {topWaivedChores.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Chores Most Frequently Waived</span>
              </h3>

              <div className="space-y-2">
                {topWaivedChores.map((chore, i) => (
                  <div 
                    key={chore.title}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900 truncate">
                          {chore.title}
                        </span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                          {chore.count}x waived
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        Helpers: {chore.members} · Reason: {chore.recentReason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: HISTORY LEDGER */}
      {/* ======================================================== */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          {/* History Filters & Search */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-600" />
                <span>Audit Filters</span>
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {filteredEvents.length} events
              </span>
            </div>

            {/* Keyword Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="Search by chore, family member, or reason..."
                className="w-full text-xs font-medium pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[36px]"
              />
              {historySearchQuery && (
                <button
                  onClick={() => setHistorySearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Member filter */}
              <select
                value={historyFilterMemberId}
                onChange={(e) => setHistoryFilterMemberId(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 cursor-pointer min-h-[36px]"
              >
                <option value="all">All Family Members</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>

              {/* Event type filter */}
              <select
                value={historyFilterType}
                onChange={(e) => setHistoryFilterType(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 cursor-pointer min-h-[36px]"
              >
                <option value="all">All Event Types</option>
                <option value="penalty_waived">Penalties Waived</option>
                <option value="penalty_applied">Penalties Applied</option>
                <option value="due_extended">Due Date Extensions</option>
                <option value="nudge_sent">Nudges Sent</option>
                <option value="failed_inspection">Redos / Corrections</option>
              </select>
            </div>
          </div>

          {/* Grouped Reverse-Chronological Event Stream */}
          {Object.keys(groupedEvents).length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 space-y-2">
              <History className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold">No event records found matching your filters.</p>
              {historySearchQuery && (
                <button
                  onClick={() => setHistorySearchQuery('')}
                  className="text-xs text-indigo-600 font-black underline cursor-pointer"
                >
                  Clear search term
                </button>
              )}
            </div>
          ) : (
            Object.entries(groupedEvents).map(([weekLabel, weekEvents]) => (
              <div key={weekLabel} className="space-y-2">
                <div className="sticky top-[110px] z-10 bg-slate-100/90 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-200 text-xs font-black text-slate-700 shadow-2xs">
                  {weekLabel} ({weekEvents.length})
                </div>

                <div className="space-y-2">
                  {weekEvents.map((evt) => {
                    const isPenalty = evt.type === 'penalty_applied';
                    const isWaived = evt.type === 'penalty_waived';
                    const isExtended = evt.type === 'due_extended';
                    const isNudge = evt.type === 'nudge_sent';
                    const isRedo = evt.type === 'failed_inspection' || evt.reason?.toLowerCase().includes('redo');

                    return (
                      <div
                        key={evt.id}
                        className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs flex items-start gap-3"
                      >
                        {/* Type Icon */}
                        <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                          isPenalty 
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : isWaived
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : isExtended
                            ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                            : isRedo
                            ? 'bg-purple-50 text-purple-600 border border-purple-200'
                            : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                          {isPenalty && <TrendingDown className="w-4 h-4" />}
                          {isWaived && <Sparkles className="w-4 h-4" />}
                          {isExtended && <CalendarPlus className="w-4 h-4" />}
                          {isNudge && <BellRing className="w-4 h-4" />}
                          {isRedo && <RefreshCw className="w-4 h-4" />}
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                                {evt.memberName}
                              </h4>
                              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                                isPenalty ? 'bg-rose-100 text-rose-800' :
                                isWaived ? 'bg-emerald-100 text-emerald-800' :
                                isExtended ? 'bg-indigo-100 text-indigo-800' :
                                isRedo ? 'bg-purple-100 text-purple-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {isPenalty ? 'Penalty Applied' :
                                 isWaived ? 'Penalty Waived' :
                                 isExtended ? 'Due Extended' :
                                 isRedo ? 'Redo Requested' :
                                 'Nudge Sent'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                              {new Date(evt.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>

                          {evt.choreTitle && (
                            <p className="text-xs font-bold text-slate-700 mt-0.5 truncate">
                              Chore: {evt.choreTitle}
                            </p>
                          )}

                          <p className="text-xs text-slate-500 font-medium mt-0.5 break-words">
                            {evt.reason}
                          </p>

                          {/* Points Audit before / after (Every penalty must record this) */}
                          {isPenalty && evt.pointsBefore !== undefined && evt.pointsAfter !== undefined && (
                            <div className="mt-2 inline-flex items-center gap-2 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl text-xs font-black text-rose-900">
                              <span>Before: ⭐{evt.pointsBefore}</span>
                              <ArrowRight className="w-3 h-3 text-rose-400" />
                              <span>After: ⭐{evt.pointsAfter}</span>
                              <span className="text-rose-700 ml-1">({evt.pointsDelta} pts)</span>
                            </div>
                          )}

                          {isWaived && (
                            <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl text-xs font-black text-emerald-800">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              <span>100% Star Points Protected & Restored</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* PERSON STATUS SHEET (BOTTOM SHEET / DRAWER) */}
      {/* ======================================================== */}
      {activePersonSummary && (
        <PersonStatusDrawer
          activePersonSummary={activePersonSummary}
          onClose={() => setSelectedPersonSheet(null)}
          isMomMode={isMomMode}
          onOpenNudge={handleOpenNudge}
          onBatchWaivePenalties={onBatchWaivePenalties}
          onWaivePenalty={onWaivePenalty}
          setWaiveTarget={setWaiveTarget}
          setExtendTarget={setExtendTarget}
          getStatusBadge={getStatusBadge}
        />
      )}

      {/* ======================================================== */}
      {/* HOUSEHOLD DRILLDOWN MODAL / BOTTOM SHEET */}
      {/* ======================================================== */}
      {drilldownType && (
        <HouseholdDrilldownDrawer
          drilldownType={drilldownType}
          onClose={() => setDrilldownType(null)}
          theme={theme}
          totalOverdue={totalOverdue}
          awaitingInspectionCount={awaitingInspectionCount}
          totalRedo={totalRedo}
          onTrackPercent={onTrackPercent}
          behindMembers={behindMembers}
          drilldownFilterMemberId={drilldownFilterMemberId}
          setDrilldownFilterMemberId={setDrilldownFilterMemberId}
          onOpenNudge={handleOpenNudge}
          onBatchWaivePenalties={onBatchWaivePenalties}
          onWaivePenalty={onWaivePenalty}
          setWaiveTarget={setWaiveTarget}
          setExtendTarget={setExtendTarget}
          setSelectedPersonSheet={setSelectedPersonSheet}
          isMomMode={isMomMode}
          onNavigateToInspection={onNavigateToInspection}
          logs={logs}
          chores={chores}
          members={members}
          householdEvaluation={householdEvaluation}
          getStatusBadge={getStatusBadge}
        />
      )}

      {/* ======================================================== */}
      {/* NUDGE MODAL */}
      {/* ======================================================== */}
      {nudgeModalTarget && (
        <div 
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setNudgeModalTarget(null)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Send Nudge to {nudgeModalTarget.member.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Friendly reminder with in-app banner & sound
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setNudgeModalTarget(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendNudgeSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nudge Message
                </label>
                <textarea
                  value={nudgeMessage}
                  onChange={(e) => setNudgeMessage(e.target.value)}
                  rows={3}
                  className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="Type a motivating message..."
                  required
                />
              </div>

              {/* Preset Chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Wrap it up before dinner! 🍽️',
                  'Earn all your stars today! ⭐',
                  'Need help with this chore? 😊',
                  'Check your quality checklist! ✅'
                ].map((chip) => (
                  <button
                    type="button"
                    key={chip}
                    onClick={() => setNudgeMessage(chip)}
                    className="text-[11px] font-bold px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNudgeModalTarget(null)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer min-h-[38px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white shadow-2xs flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Nudge</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* WAIVE PENALTY MODAL */}
      {/* ======================================================== */}
      {waiveTarget && (
        <div 
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setWaiveTarget(null)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Waive Lateness Penalty
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Restores 100% points without lateness deduction
                  </p>
                </div>
              </div>
              <button onClick={() => setWaiveTarget(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWaiveSubmit} className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800">{waiveTarget.chore.title}</div>
                <div className="text-slate-500">Originally due: {waiveTarget.originalDueDate} ({waiveTarget.daysLate}d late)</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Waiver (Required for Audit Log)
                </label>
                <input
                  type="text"
                  value={waiveReason}
                  onChange={(e) => setWaiveReason(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g., Sick with flu, extra homework, travel..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWaiveTarget(null)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer min-h-[38px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm Waiver</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EXTEND DUE DATE MODAL */}
      {/* ======================================================== */}
      {extendTarget && (
        <div 
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setExtendTarget(null)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <CalendarPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Extend Chore Due Date
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Resets late clock until new extension deadline
                  </p>
                </div>
              </div>
              <button onClick={() => setExtendTarget(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExtendSubmit} className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800">{extendTarget.chore.title}</div>
                <div className="text-slate-500">Current effective due date: {extendTarget.effectiveDueDate}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Extension Days
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 5].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setExtendDays(d)}
                      className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer min-h-[38px] ${
                        extendDays === d
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      +{d} day{d > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Extension
                </label>
                <input
                  type="text"
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g., Weekend trip, exam study..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExtendTarget(null)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer min-h-[38px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Extension</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* RULES & PENALTY SETTINGS MODAL */}
      {/* ======================================================== */}
      {showSettingsModal && (
        <div 
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowSettingsModal(false)}
        >
          <div 
            className="bg-white w-full max-w-lg rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-200 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Penalty & Grade Configuration
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Control lateness deductions and quality multipliers
                  </p>
                </div>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lateness Tiers Schedule */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Lateness Tiers & Balance Deductions
              </h4>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">&lt; 1 Day Late</span>
                    <p className="text-[11px] text-slate-500">Same day grace / morning after</p>
                  </div>
                  <span className="font-black text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                    Earns 75% points
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">1 to 2 Days Late</span>
                    <p className="text-[11px] text-slate-500">Moderate delay</p>
                  </div>
                  <span className="font-black text-amber-800 bg-amber-100 px-2 py-1 rounded-lg border border-amber-200">
                    Earns 50% points
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">3 to 6 Days Late</span>
                    <p className="text-[11px] text-slate-500">Severe delay</p>
                  </div>
                  <span className="font-black text-rose-700 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                    0% earn + 25% balance deduction
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">7+ Days Late / Missed</span>
                    <p className="text-[11px] text-slate-500">Abandoned or skipped</p>
                  </div>
                  <span className="font-black text-rose-900 bg-rose-100 px-2 py-1 rounded-lg border border-rose-300">
                    0% earn + 100% balance deduction
                  </span>
                </div>
              </div>
            </div>

            {/* Quality Grade Multipliers */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Inspection Quality Multipliers (Stacked)
              </h4>
              <div className="grid grid-cols-5 gap-1.5 text-center">
                {[
                  { grade: 'A+', label: '100%', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                  { grade: 'A', label: '90%', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                  { grade: 'B', label: '75%', color: 'text-amber-700 bg-amber-50 border-amber-200' },
                  { grade: 'C', label: '50%', color: 'text-amber-800 bg-amber-100 border-amber-200' },
                  { grade: 'Redo', label: '0%', color: 'text-rose-700 bg-rose-50 border-rose-200' },
                ].map((g) => (
                  <div key={g.grade} className={`p-2 rounded-xl border text-xs ${g.color}`}>
                    <div className="font-black">{g.grade}</div>
                    <div className="text-[10px] font-bold">{g.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Negative Balance Toggle */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800">Allow Negative Balance</span>
                <p className="text-[10px] text-slate-500">If disabled, deductions stop at 0 stars</p>
              </div>
              <input
                type="checkbox"
                checked={tempSettings.allowNegativeBalance}
                onChange={(e) => setTempSettings({ ...tempSettings, allowNegativeBalance: e.target.checked })}
                className="w-5 h-5 rounded text-indigo-600 cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer min-h-[38px]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.playStarChime(5);
                  onUpdatePenaltySettings(tempSettings);
                  setShowSettingsModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs cursor-pointer min-h-[38px]"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
