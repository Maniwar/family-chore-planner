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
  CheckCheck,
  AlertCircle,
  Eye,
  Bell,
  Gift
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
  PersonStatusType,
  RewardClaim
} from '../types';
import { Avatar } from './Avatar';
import { COSMETIC_ITEMS } from '../utils/progression';
import { CosmeticsManagerModal } from './CosmeticsManagerModal';
import { 
  evaluateHouseholdStatus, 
  evaluateMemberStatusThisWeek, 
  getISOWeekNumber, 
  OverdueChoreItem,
  PersonStatusSummary,
  isChoreScheduledForDate,
  parseDateInTimezone,
  calculateDaysLate
} from '../utils/penaltyEngine';
import { getTodayDateString, parseLocalDate, getChoreAssigneeForDate } from '../utils/storage';
import { soundFX } from '../utils/audio';
import { ThemePreset, THEMES, isGlassTheme } from '../utils/theme';
import { PersonStatusDrawer } from './PersonStatusDrawer';
import { HouseholdDrilldownDrawer } from './HouseholdDrilldownDrawer';

export type TimeRangeOption = 'this_week' | 'last_week' | 'last_7_days' | 'last_14_days' | 'last_30_days' | 'all_time';

export const formatAuditDate = (dateVal?: any, timestampMs?: number): string => {
  if (!dateVal && !timestampMs) return 'Recent';
  if (dateVal === 'Recent') return 'Recent';
  let d: Date | null = null;
  if (typeof dateVal === 'string' && dateVal.trim()) {
    const trimmed = dateVal.trim();
    if (trimmed === 'Recent') return 'Recent';
    if (trimmed.length === 10 && trimmed.includes('-') && !trimmed.includes('T')) {
      d = parseLocalDate(trimmed);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    d = parseLocalDate(trimmed);
  } else if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    d = dateVal;
  } else if (typeof dateVal === 'number' && !isNaN(dateVal)) {
    d = new Date(dateVal);
  }
  if ((!d || isNaN(d.getTime())) && timestampMs) {
    d = new Date(timestampMs);
  }
  if (!d || isNaN(d.getTime())) {
    return 'Recent';
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export interface UnifiedAuditRecord {
  id: string;
  sourceType: 'reward_claim' | 'chore_log' | 'penalty_event';
  category: 'reward' | 'chore' | 'penalty_waived' | 'penalty_applied' | 'due_extended' | 'nudge_sent' | 'failed_inspection' | 'point_adjustment';
  dateStr: string;
  timestamp: number;
  weekLabel: string;
  memberId: string;
  memberName: string;
  title: string;
  subtitle?: string;
  pointsDelta?: number;
  pointsLabel?: string;
  statusBadge?: string;
  statusBadgeColor?: string;
  gradeBadge?: string;
  reason?: string;
  notes?: string;
  proofPhotoUrl?: string;
  rawClaim?: RewardClaim;
  rawLog?: ChoreAssignmentLog;
  rawEvent?: ChoreEvent;
}

interface StatusViewProps {
  members: HouseholdMember[];
  chores: Chore[];
  logs: ChoreAssignmentLog[];
  penaltySettings: HouseholdPenaltySettings;
  events: ChoreEvent[];
  nudges: NudgeRecord[];
  claims?: RewardClaim[];
  isMomMode: boolean;
  currentTheme?: ThemePreset;
  onSendNudge: (memberId: string, memberName: string, message: string, choreId?: string, choreTitle?: string) => void;
  onWaivePenalty: (choreId: string, logId: string, memberId: string, reason: string, choreDate?: string) => void;
  onExtendDueDate: (choreId: string, logId: string, memberId: string, newDueDate: string, reason: string, choreDate?: string) => void;
  onBatchWaivePenalties?: (items: { choreId: string; logId?: string; memberId: string; date: string; title?: string }[], reason: string) => void;
  onUpdatePenaltySettings: (settings: HouseholdPenaltySettings) => void;
  onTriggerSettlement?: () => void;
  onNavigateToInspection?: () => void;
  onOpenPointManager?: (memberId?: string) => void;
  onEquipCosmetic?: (memberId: string, cosmeticId: string) => void;
}

export const StatusView: React.FC<StatusViewProps> = ({
  members,
  chores,
  logs,
  penaltySettings,
  events,
  nudges,
  claims = [],
  isMomMode,
  currentTheme = 'rose',
  onSendNudge,
  onWaivePenalty,
  onExtendDueDate,
  onBatchWaivePenalties,
  onUpdatePenaltySettings,
  onTriggerSettlement,
  onNavigateToInspection,
  onOpenPointManager,
  onEquipCosmetic,
}) => {
  const theme = THEMES[currentTheme] || THEMES.rose;
  const [activeSubTab, setActiveSubTab] = useState<'now' | 'timeline' | 'history'>('now');
  const [selectedPersonSheet, setSelectedPersonSheet] = useState<PersonStatusSummary | null>(null);
  const [drilldownType, setDrilldownType] = useState<'overdue' | 'review' | 'redo' | 'overview' | null>(null);
  const [drilldownFilterMemberId, setDrilldownFilterMemberId] = useState<string>('all');
  const [historyFilterMemberId, setHistoryFilterMemberId] = useState<string>('all');
  const [historyFilterType, setHistoryFilterType] = useState<string>('all');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [auditTimeframe, setAuditTimeframe] = useState<'all' | 'today' | 'this_week' | 'last_week' | 'past_7' | 'past_30' | 'this_month'>('all');
  const [isCosmeticsModalOpen, setIsCosmeticsModalOpen] = useState<boolean>(false);
  const [cosmeticsModalMemberId, setCosmeticsModalMemberId] = useState<string>('');
  const [analyticsMetric, setAnalyticsMetric] = useState<'all' | 'waived' | 'overdue' | 'redo'>('all');
  const [selectedOverduePersonFilter, setSelectedOverduePersonFilter] = useState<string>('all');

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

  // Time range selection for Trends & Waivers
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('last_14_days');

  // Date range info based on selected timeRange
  const dateRangeInfo = useMemo(() => {
    const now = new Date();
    const dates: { dateStr: string; label: string }[] = [];
    
    if (timeRange === 'this_week') {
      const day = now.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      const monday = new Date(now);
      monday.setDate(monday.getDate() - diffToMonday);
      
      for (let i = 0; i <= diffToMonday; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
        dates.push({ dateStr, label });
      }
    } else if (timeRange === 'last_week') {
      const day = now.getDay();
      const diffToLastMonday = (day === 0 ? 6 : day - 1) + 7;
      const lastMonday = new Date(now);
      lastMonday.setDate(lastMonday.getDate() - diffToLastMonday);
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(lastMonday);
        d.setDate(lastMonday.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
        dates.push({ dateStr, label });
      }
    } else if (timeRange === 'last_7_days') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        dates.push({ dateStr, label });
      }
    } else if (timeRange === 'last_14_days') {
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        dates.push({ dateStr, label });
      }
    } else if (timeRange === 'last_30_days') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        dates.push({ dateStr, label });
      }
    } else {
      // all_time (60 days)
      for (let i = 59; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        dates.push({ dateStr, label });
      }
    }

    const dateSet = new Set(dates.map(d => d.dateStr));
    const labelTitle = 
      timeRange === 'this_week' ? 'This Week' :
      timeRange === 'last_week' ? 'Last Week' :
      timeRange === 'last_7_days' ? 'Past 7 Days' :
      timeRange === 'last_14_days' ? 'Past 14 Days' :
      timeRange === 'last_30_days' ? 'Past 30 Days' : 'All Time';

    return { dates, dateSet, labelTitle };
  }, [timeRange]);

  // Comprehensive Period Evaluation (Overdue, Waivers, Redos, and On-Time across selected dates)
  const periodEvaluation = useMemo(() => {
    const { dates, dateSet } = dateRangeInfo;
    const todayStr = getTodayDateString();
    const now = new Date();

    const dayMap: { [dateStr: string]: { waived: number; overdue: number; redos: number; penalties: number } } = {};
    dates.forEach(d => {
      dayMap[d.dateStr] = { waived: 0, overdue: 0, redos: 0, penalties: 0 };
    });

    const memberData: { [memberId: string]: {
      overdueItems: Array<{ chore: Chore; date: string; daysLate: number; points: number; log?: ChoreAssignmentLog }>;
      waivedCount: number;
      penaltyCount: number;
      redoCount: number;
      approvedCount: number;
      recentWaiver?: ChoreEvent;
      seenOverdueKeys: Set<string>;
    } } = {};

    members.forEach(m => {
      memberData[m.id] = {
        overdueItems: [],
        waivedCount: 0,
        penaltyCount: 0,
        redoCount: 0,
        approvedCount: 0,
        seenOverdueKeys: new Set<string>(),
      };
    });

    // 1. Process Chore Events (Waivers, Penalties, Inspection Failures)
    events.forEach(evt => {
      const datePart = evt.createdAt?.split('T')[0];
      if (datePart && dayMap[datePart]) {
        if (evt.type === 'penalty_waived') {
          dayMap[datePart].waived++;
        } else if (evt.type === 'penalty_applied') {
          dayMap[datePart].penalties++;
        } else if (evt.type === 'failed_inspection' || evt.reason?.toLowerCase().includes('redo')) {
          dayMap[datePart].redos++;
        }
      }

      if (evt.memberId && memberData[evt.memberId]) {
        if (datePart && dateSet.has(datePart)) {
          if (evt.type === 'penalty_waived') {
            memberData[evt.memberId].waivedCount++;
            if (!memberData[evt.memberId].recentWaiver) {
              memberData[evt.memberId].recentWaiver = evt;
            }
          } else if (evt.type === 'penalty_applied') {
            memberData[evt.memberId].penaltyCount++;
          }
        }
      }
    });

    // 2. Process Logs for Redos & Completed On-Time
    logs.forEach(log => {
      const isRedo = log.status === 'needs_redo' || log.qualityGrade === 'Redo';
      const logDate = log.reviewedAt?.split('T')[0] || log.date;
      if (isRedo && logDate && dayMap[logDate]) {
        dayMap[logDate].redos++;
      }

      if (log.memberId && memberData[log.memberId] && dateSet.has(log.date)) {
        if (isRedo) {
          memberData[log.memberId].redoCount++;
        }
        if (log.status === 'approved') {
          memberData[log.memberId].approvedCount++;
        }
      }
    });

    // 3. Evaluate Scheduled Chores for Every Day in the Date Range to find Real Overdue Tasks
    dates.forEach(({ dateStr }) => {
      const isToday = dateStr === todayStr;
      const isPast = dateStr < todayStr;

      members.forEach(member => {
        chores.forEach(chore => {
          if (!chore.isActive) return;
          if (!isChoreScheduledForDate(chore, dateStr)) return;

          const assignedId = getChoreAssigneeForDate(chore, dateStr);
          if (assignedId !== member.id) return;

          const log = logs.find(l => 
            l.choreId === chore.id && 
            (l.date === dateStr || (l.completedAt && l.completedAt.startsWith(dateStr))) && 
            (!l.memberId || l.memberId === member.id)
          );
          const isApproved = log?.status === 'approved';
          const isWaived = Boolean(log?.penaltyWaived);
          const isCompletedWaiting = log?.status === 'needs_review';

          if (isApproved || isWaived || isCompletedWaiting) {
            return;
          }

          let isOverdue = false;
          let daysLate = 0;

          if (isPast) {
            daysLate = calculateDaysLate(chore, log || dateStr, chore.scheduledTime, penaltySettings.shipDate);
            if (daysLate > 0 || log?.status === 'needs_redo') {
              isOverdue = true;
            }
          } else if (isToday) {
            const dueDate = parseDateInTimezone(dateStr, chore.scheduledTime);
            if (now.getTime() > dueDate.getTime() || log?.status === 'needs_redo') {
              daysLate = calculateDaysLate(chore, log || dateStr, chore.scheduledTime, penaltySettings.shipDate);
              if (daysLate > 0 || log?.status === 'needs_redo') {
                isOverdue = true;
              }
            }
          }

          if (isOverdue) {
            dayMap[dateStr].overdue++;
            const key = `${chore.id}_${dateStr}`;
            if (!memberData[member.id].seenOverdueKeys.has(key)) {
              memberData[member.id].seenOverdueKeys.add(key);
              memberData[member.id].overdueItems.push({
                chore,
                date: dateStr,
                daysLate,
                points: chore.defaultPoints,
                log,
              });
            }
          }
        });
      });
    });

    // Sort each member's overdue chores by daysLate descending
    members.forEach(m => {
      memberData[m.id].overdueItems.sort((a, b) => b.daysLate - a.daysLate);
    });

    // Timeline chart data
    const timeline = dates.map(d => {
      const info = dayMap[d.dateStr] || { waived: 0, overdue: 0, redos: 0, penalties: 0 };
      return {
        date: d.label,
        dateStr: d.dateStr,
        waived: info.waived,
        penalties: info.penalties,
        overdue: info.overdue,
        redos: info.redos,
        totalActivity: info.waived + info.penalties + info.redos + info.overdue,
      };
    });

    let totalHouseholdWaivers = 0;
    let totalHouseholdOverdue = 0;
    let totalHouseholdRedos = 0;
    let totalApproved = 0;

    const stats = members.map(m => {
      const mData = memberData[m.id];
      const waivedCount = mData.waivedCount;
      const overdueCount = mData.overdueItems.length;
      const redoCount = mData.redoCount;
      const approvedCount = mData.approvedCount;

      totalHouseholdWaivers += waivedCount;
      totalHouseholdOverdue += overdueCount;
      totalHouseholdRedos += redoCount;
      totalApproved += approvedCount;

      return {
        member: m,
        id: m.id,
        name: m.name,
        waivedCount,
        penaltyCount: mData.penaltyCount,
        redoCount,
        overdueCount,
        approvedCount,
        overdueItems: mData.overdueItems,
        recentWaiver: mData.recentWaiver,
        waiverPercentage: 0,
      };
    });

    stats.forEach(s => {
      s.waiverPercentage = totalHouseholdWaivers > 0 ? Math.round((s.waivedCount / totalHouseholdWaivers) * 100) : 0;
    });

    const sortedByWaivers = [...stats].sort((a, b) => b.waivedCount - a.waivedCount);
    const sortedByOverdue = [...stats].sort((a, b) => b.overdueCount - a.overdueCount);
    const sortedByRedos = [...stats].sort((a, b) => b.redoCount - a.redoCount);

    const totalScheduled = totalApproved + totalHouseholdOverdue;
    const periodOnTimePercent = totalScheduled > 0 ? Math.round((totalApproved / totalScheduled) * 100) : 100;

    return {
      timeline,
      stats,
      totalHouseholdWaivers,
      totalHouseholdOverdue,
      totalHouseholdRedos,
      totalApproved,
      periodOnTimePercent,
      mostWaivedMember: sortedByWaivers[0],
      mostOverdueMember: sortedByOverdue[0],
      mostRedosMember: sortedByRedos[0],
      sortedByWaivers,
      sortedByOverdue,
      sortedByRedos,
    };
  }, [dateRangeInfo, members, chores, logs, events, penaltySettings]);

  const timelineData = periodEvaluation.timeline;
  const memberWaiverStats = periodEvaluation;

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

  // ========================================================
  // UNIFIED AUDIT LEDGER ENGINE
  // Merges verified chores, reward redemptions, penalties, and waivers
  // ========================================================
  const isDateInAuditTimeframe = (timestampMs: number) => {
    if (auditTimeframe === 'all') return true;
    const d = new Date(timestampMs);
    const now = new Date();
    const todayStr = getTodayDateString();
    const dLocalStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (auditTimeframe === 'today') {
      return dLocalStr === todayStr;
    }
    if (auditTimeframe === 'this_week') {
      const day = now.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      const monday = new Date(now);
      monday.setDate(monday.getDate() - diffToMonday);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return d >= monday && d <= sunday;
    }
    if (auditTimeframe === 'last_week') {
      const day = now.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      const thisMonday = new Date(now);
      thisMonday.setDate(thisMonday.getDate() - diffToMonday);
      thisMonday.setHours(0, 0, 0, 0);
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(lastMonday.getDate() - 7);
      return d >= lastMonday && d < thisMonday;
    }
    if (auditTimeframe === 'past_7') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= sevenDaysAgo;
    }
    if (auditTimeframe === 'past_30') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return d >= thirtyDaysAgo;
    }
    if (auditTimeframe === 'this_month') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    return true;
  };

  const allUnifiedRecords = useMemo(() => {
    const list: UnifiedAuditRecord[] = [];

    const getWeekLabel = (d: Date) => {
      const weekNum = getISOWeekNumber(d);
      const year = d.getFullYear();
      return `Week ${weekNum}, ${year}`;
    };

    // 1. Reward redemptions from claims
    (claims || []).forEach(claim => {
      const d = parseLocalDate(claim.claimedAt);
      const t = d.getTime();
      const member = members.find(m => m.id === claim.memberId);
      const memberName = claim.memberName || member?.name || 'Helper';

      list.push({
        id: `claim-${claim.id}`,
        sourceType: 'reward_claim',
        category: 'reward',
        dateStr: claim.claimedAt || d.toISOString(),
        timestamp: t,
        weekLabel: getWeekLabel(d),
        memberId: claim.memberId,
        memberName,
        title: claim.rewardTitle,
        subtitle: `Reward Redemption • ${(claim.status || 'pending').toUpperCase()}`,
        pointsDelta: -(claim.pointsSpent || 0),
        pointsLabel: `-${claim.pointsSpent || 0} pts`,
        statusBadge: claim.status === 'delivered' ? 'Delivered 🎁' : claim.status === 'approved' ? 'Approved ✓' : claim.status === 'rejected' ? 'Rejected' : 'Pending ⏳',
        statusBadgeColor: claim.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : claim.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-purple-100 text-purple-800',
        notes: claim.note ? `Note: "${claim.note}"` : claim.parentNote ? `Parent: "${claim.parentNote}"` : undefined,
        rawClaim: claim,
      });
    });

    // 2. Verified chore completions from logs
    logs.forEach(log => {
      const isApprovedOrCompleted = log.status === 'approved' || log.status === 'verified' || log.status === 'completed' || log.pointsAwarded !== undefined;
      if (isApprovedOrCompleted && log.status !== 'needs_redo' && log.status !== 'pending' && log.status !== 'needs_review') {
        const chore = chores.find(c => c.id === log.choreId);
        const dateString = log.completedAt || log.date;
        const d = parseLocalDate(dateString);
        const t = d.getTime();
        const resolvedMemberId = log.memberId || chore?.assignedMemberId || 'unassigned';
        const member = members.find(m => m.id === resolvedMemberId) || members.find(m => m.id === log.memberId);
        const memberName = member?.name || 'Helper';
        const pts = (log.pointsAwarded !== undefined ? log.pointsAwarded : (chore?.defaultPoints || 10)) + (log.bonusPoints || 0);

        list.push({
          id: `log-${log.id}`,
          sourceType: 'chore_log',
          category: 'chore',
          dateStr: dateString || d.toISOString(),
          timestamp: t,
          weekLabel: getWeekLabel(d),
          memberId: resolvedMemberId,
          memberName,
          title: chore?.title || log.choreId || 'Completed Chore',
          subtitle: log.status === 'verified' ? 'Chore Verified by Parent' : log.status === 'approved' ? 'Chore Approved by Parent' : 'Chore Completed',
          pointsDelta: pts,
          pointsLabel: `+${pts} pts`,
          statusBadge: log.status === 'verified' ? 'Verified ✓' : log.status === 'approved' ? 'Approved ✓' : 'Completed',
          statusBadgeColor: 'bg-emerald-100 text-emerald-800',
          gradeBadge: log.qualityGrade ? `Grade ${log.qualityGrade}` : log.inspectionGrade ? `Grade ${log.inspectionGrade}` : undefined,
          notes: log.feedbackNote || log.inspectionNotes || log.notes || undefined,
          proofPhotoUrl: log.proofPhotoUrl,
          rawLog: log,
        });
      }
    });

    // 3. Events from events (waivers, penalties, extensions, nudges, redos, adjustments)
    events.forEach(evt => {
      const rawTime = evt.createdAt || evt.timestamp || (evt as any).date || '';
      const d = parseLocalDate(rawTime);
      const validT = d.getTime();
      const isoDate = typeof rawTime === 'string' && rawTime.includes('T') ? rawTime : d.toISOString();
      const member = members.find(m => m.id === evt.memberId);
      const memberName = evt.memberName || member?.name || (evt.memberId === 'all' ? 'All Family' : 'Household');

      let category: UnifiedAuditRecord['category'] = 'point_adjustment';
      let pointsDelta: number | undefined = undefined;
      let pointsLabel: string | undefined = undefined;

      const isResetToZero = evt.pointsAfter === 0 || 
        (evt.reason && evt.reason.toLowerCase().includes('reset balance to 0')) ||
        (evt.reason && evt.reason.toLowerCase().includes('reset to zero'));

      // Check if this is a point adjustment or balance reset even if previously marked penalty_applied
      const isManualPointSet = evt.type === 'point_adjustment' || isResetToZero || evt.id.startsWith('evt_pt_set_') || evt.id.startsWith('evt_pt_adj_') || evt.id.startsWith('evt_reset_');

      if (isManualPointSet) {
        category = 'point_adjustment';
        const delta = evt.pointsDelta !== undefined 
          ? evt.pointsDelta 
          : (evt.pointsAfter !== undefined && evt.pointsBefore !== undefined ? evt.pointsAfter - evt.pointsBefore : 0);
        pointsDelta = delta;
        pointsLabel = delta === 0 ? '0 pts' : `${delta > 0 ? '+' : ''}${delta} pts`;
      } else if (evt.type === 'penalty_waived') {
        category = 'penalty_waived';
        pointsDelta = evt.pointsDelta;
        pointsLabel = evt.pointsDelta ? `${evt.pointsDelta > 0 ? '+' : ''}${evt.pointsDelta} pts` : '100% Protected';
      } else if (evt.type === 'penalty_applied') {
        category = 'penalty_applied';
        const pDelta = evt.pointsDelta !== undefined ? evt.pointsDelta : -(evt.pointsPenalty || 0);
        pointsDelta = pDelta;
        pointsLabel = pDelta === 0 ? '0 pts' : `${pDelta < 0 ? '' : '-'}${Math.abs(pDelta)} pts`;
      } else if (evt.type === 'due_extended') {
        category = 'due_extended';
        pointsLabel = 'Due Extended';
      } else if (evt.type === 'nudge_sent') {
        category = 'nudge_sent';
        pointsLabel = 'Reminder Sent';
      } else if (evt.type === 'failed_inspection') {
        category = 'failed_inspection';
        pointsLabel = 'Correction Required';
      } else {
        category = 'point_adjustment';
        pointsDelta = evt.pointsDelta || 0;
        pointsLabel = `${(evt.pointsDelta || 0) > 0 ? '+' : ''}${evt.pointsDelta || 0} pts`;
      }

      const defaultTitle = isResetToZero 
        ? 'Balance Reset to 0 pts' 
        : category === 'penalty_waived' 
        ? 'Penalty Waived' 
        : category === 'penalty_applied' 
        ? (evt.choreTitle ? `${evt.choreTitle} Penalty` : 'Overdue Penalty') 
        : category === 'nudge_sent' 
        ? 'Chore Reminder' 
        : category === 'due_extended' 
        ? 'Extension Granted' 
        : category === 'failed_inspection' 
        ? 'Inspection Redo' 
        : (evt.reason || 'Point Adjustment');

      const defaultSubtitle = isResetToZero
        ? 'Reset to 0 by Mom'
        : category === 'penalty_waived'
        ? 'Waiver Granted by Mom'
        : category === 'penalty_applied'
        ? 'Penalty Deducted'
        : isManualPointSet
        ? 'Balance Update by Mom'
        : undefined;

      const defaultStatusBadge = isResetToZero
        ? 'Reset 0 ⭐'
        : category === 'penalty_waived'
        ? 'Waived ✨'
        : category === 'penalty_applied'
        ? 'Penalty ⚠️'
        : category === 'due_extended'
        ? 'Extended 📅'
        : category === 'nudge_sent'
        ? 'Nudge 🔔'
        : category === 'failed_inspection'
        ? 'Redo 🔄'
        : 'Adjusted ⭐';

      const defaultStatusBadgeColor = isResetToZero
        ? 'bg-amber-100 text-amber-900 border border-amber-300'
        : category === 'penalty_waived'
        ? 'bg-amber-100 text-amber-900'
        : category === 'penalty_applied'
        ? 'bg-rose-100 text-rose-800'
        : 'bg-indigo-100 text-indigo-800 border border-indigo-200';

      list.push({
        id: `evt-${evt.id}`,
        sourceType: 'penalty_event',
        category,
        dateStr: isoDate,
        timestamp: validT,
        weekLabel: evt.weekNumber ? `Week ${evt.weekNumber}, ${evt.year || d.getFullYear()}` : getWeekLabel(d),
        memberId: evt.memberId || 'all',
        memberName,
        title: evt.choreTitle || evt.reason || defaultTitle,
        subtitle: defaultSubtitle,
        pointsDelta,
        pointsLabel,
        statusBadge: defaultStatusBadge,
        statusBadgeColor: defaultStatusBadgeColor,
        reason: evt.reason,
        notes: evt.reason,
        rawEvent: evt,
      });
    });

    list.sort((a, b) => b.timestamp - a.timestamp);
    return list;
  }, [claims, logs, chores, events, members]);

  // Filtered Unified Audit Records
  const filteredUnifiedRecords = useMemo(() => {
    return allUnifiedRecords.filter(item => {
      // 1. Timeframe filter
      if (!isDateInAuditTimeframe(item.timestamp)) return false;

      // 2. Member filter
      if (historyFilterMemberId !== 'all') {
        const targetMember = members.find(m => m.id === historyFilterMemberId);
        const normFilter = historyFilterMemberId.toLowerCase().replace(/^(mem_|member_)/, '');
        const normEventMember = (item.memberId || '').toLowerCase().replace(/^(mem_|member_)/, '');
        const idMatch = item.memberId === historyFilterMemberId || (normFilter && normEventMember === normFilter);
        const nameMatch = targetMember && item.memberName && (
          item.memberName.toLowerCase().trim() === targetMember.name.toLowerCase().trim() ||
          item.memberName.toLowerCase().includes(targetMember.name.toLowerCase().split(' ')[0])
        );
        if (!idMatch && !nameMatch && item.memberId !== 'all') return false;
      }

      // 3. Category/Type filter
      if (historyFilterType !== 'all') {
        if (historyFilterType === 'reward' && item.category !== 'reward') return false;
        if (historyFilterType === 'chore' && item.category !== 'chore') return false;
        if (historyFilterType === 'penalty_waived' && item.category !== 'penalty_waived') return false;
        if (historyFilterType === 'penalty_applied' && item.category !== 'penalty_applied') return false;
        if (historyFilterType === 'due_extended' && item.category !== 'due_extended') return false;
        if (historyFilterType === 'nudge_sent' && item.category !== 'nudge_sent') return false;
        if (historyFilterType === 'failed_inspection' && item.category !== 'failed_inspection') return false;
        if (historyFilterType === 'point_adjustment' && item.category !== 'point_adjustment') return false;
      }

      // 4. Keyword search
      if (historySearchQuery.trim()) {
        const q = historySearchQuery.toLowerCase();
        const matchName = item.memberName?.toLowerCase().includes(q);
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchNotes = item.notes?.toLowerCase().includes(q);
        const matchReason = item.reason?.toLowerCase().includes(q);
        const matchStatus = item.statusBadge?.toLowerCase().includes(q);
        if (!matchName && !matchTitle && !matchNotes && !matchReason && !matchStatus) return false;
      }

      return true;
    });
  }, [allUnifiedRecords, historyFilterMemberId, historyFilterType, historySearchQuery, auditTimeframe, members]);

  // Backward-compatible alias
  const filteredEvents = filteredUnifiedRecords;

  // Audit Metrics based on Timeframe and Member (regardless of category filter)
  const auditMetrics = useMemo(() => {
    const baseInScope = allUnifiedRecords.filter(item => {
      if (!isDateInAuditTimeframe(item.timestamp)) return false;
      if (historyFilterMemberId !== 'all') {
        const targetMember = members.find(m => m.id === historyFilterMemberId);
        const normFilter = historyFilterMemberId.toLowerCase().replace(/^(mem_|member_)/, '');
        const normEventMember = (item.memberId || '').toLowerCase().replace(/^(mem_|member_)/, '');
        const idMatch = item.memberId === historyFilterMemberId || (normFilter && normEventMember === normFilter);
        const nameMatch = targetMember && item.memberName && (
          item.memberName.toLowerCase().trim() === targetMember.name.toLowerCase().trim() ||
          item.memberName.toLowerCase().includes(targetMember.name.toLowerCase().split(' ')[0])
        );
        if (!idMatch && !nameMatch && item.memberId !== 'all') return false;
      }
      return true;
    });

    let totalEarned = 0;
    let choreCount = 0;
    let totalRedeemed = 0;
    let claimCount = 0;
    let waiverCount = 0;
    let penaltyCount = 0;
    let extensionCount = 0;
    let nudgeCount = 0;
    let redoCount = 0;
    let adjustmentCount = 0;

    baseInScope.forEach(rec => {
      if (rec.category === 'chore') {
        totalEarned += rec.pointsDelta || 0;
        choreCount++;
      } else if (rec.category === 'reward') {
        totalRedeemed += Math.abs(rec.pointsDelta || 0);
        claimCount++;
      } else if (rec.category === 'penalty_waived') {
        waiverCount++;
      } else if (rec.category === 'penalty_applied') {
        penaltyCount++;
      } else if (rec.category === 'due_extended') {
        extensionCount++;
      } else if (rec.category === 'nudge_sent') {
        nudgeCount++;
      } else if (rec.category === 'failed_inspection') {
        redoCount++;
      } else if (rec.category === 'point_adjustment') {
        adjustmentCount++;
      }
    });

    const netPoints = totalEarned - totalRedeemed;

    return {
      totalEarned,
      choreCount,
      totalRedeemed,
      claimCount,
      waiverCount,
      penaltyCount,
      extensionCount,
      nudgeCount,
      redoCount,
      adjustmentCount,
      netPoints,
      totalRecords: baseInScope.length,
    };
  }, [allUnifiedRecords, historyFilterMemberId, auditTimeframe, members]);

  // Group unified records by Week & Year
  const groupedUnifiedRecords = useMemo((): Record<string, UnifiedAuditRecord[]> => {
    const groups: Record<string, UnifiedAuditRecord[]> = {};
    filteredUnifiedRecords.forEach(rec => {
      const key = rec.weekLabel;
      if (!groups[key]) groups[key] = [];
      groups[key].push(rec);
    });
    return groups;
  }, [filteredUnifiedRecords]);

  // Backward-compatible alias
  const groupedEvents = groupedUnifiedRecords as any;

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
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
            isGlassTheme(currentTheme)
              ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/50 backdrop-blur-md shadow-xs'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
          }`}>
            <CheckCircle2 className={`w-3.5 h-3.5 ${isGlassTheme(currentTheme) ? 'text-emerald-300' : 'text-emerald-600'}`} />
            <span>On Track</span>
          </span>
        );
      case 'behind':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
            isGlassTheme(currentTheme)
              ? 'bg-amber-500/20 text-amber-100 border border-amber-400/50 backdrop-blur-md shadow-xs'
              : 'bg-amber-100 text-amber-900 border border-amber-300'
          }`}>
            <Clock className={`w-3.5 h-3.5 ${isGlassTheme(currentTheme) ? 'text-amber-300' : 'text-amber-700'}`} />
            <span>Behind</span>
          </span>
        );
      case 'way_behind':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black animate-pulse ${
            isGlassTheme(currentTheme)
              ? 'bg-rose-500/20 text-rose-100 border border-rose-400/50 backdrop-blur-md shadow-xs'
              : 'bg-rose-100 text-rose-900 border border-rose-300'
          }`}>
            <AlertTriangle className={`w-3.5 h-3.5 ${isGlassTheme(currentTheme) ? 'text-rose-300' : 'text-rose-700'}`} />
            <span>Way Behind</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Top Header & Sub-Tabs */}
      <div className={`${isGlassTheme(currentTheme) ? 'apple-glass-card' : 'bg-white'} rounded-3xl border ${isGlassTheme(currentTheme) ? 'border-white/20' : 'border-slate-200'} p-3.5 sm:p-5 shadow-2xs`}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl ${isGlassTheme(currentTheme) ? 'apple-glass-pill bg-indigo-50/80 text-indigo-700 border-indigo-200/80' : 'bg-indigo-50 border border-indigo-100 text-indigo-600'} flex items-center justify-center`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-black text-slate-900 leading-tight">
                Household Status
              </h1>
              <p className="text-xs text-slate-600 font-medium">
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
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] active:scale-95 border ${
                  isGlassTheme(currentTheme)
                    ? 'apple-glass-button bg-white/10 dark:bg-white/5 text-slate-900 dark:text-white border-white/20 shadow-2xs'
                    : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200'
                }`}
                title="Penalty and Grade Settings"
              >
                <Settings className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden xs:inline">Rules & Grades</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Tabs: Now vs Trends & Waivers vs History */}
        <div className={`flex ${isGlassTheme(currentTheme) ? 'apple-glass-dock bg-black/5 dark:bg-black/20 border-white/20' : 'bg-slate-100 border border-slate-200/60'} p-1 rounded-2xl gap-1.5`}>
          <button
            onClick={() => {
              soundFX.playPop();
              setActiveSubTab('now');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] ${
              activeSubTab === 'now'
                ? isGlassTheme(currentTheme)
                  ? 'apple-glass-pill bg-white/20 dark:bg-white/10 text-slate-900 dark:text-white font-black shadow-md border-white/20'
                  : 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : isGlassTheme(currentTheme)
                ? 'text-slate-700 hover:text-slate-900 hover:bg-white/40'
                : 'text-slate-500 hover:text-slate-900 dark:text-white'
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
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] ${
              activeSubTab === 'timeline'
                ? isGlassTheme(currentTheme)
                  ? 'apple-glass-pill bg-white/20 dark:bg-white/10 text-slate-900 dark:text-white font-black shadow-md border-white/20'
                  : 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : isGlassTheme(currentTheme)
                ? 'text-slate-700 hover:text-slate-900 hover:bg-white/40'
                : 'text-slate-500 hover:text-slate-900 dark:text-white'
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
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] ${
              activeSubTab === 'history'
                ? isGlassTheme(currentTheme)
                  ? 'apple-glass-pill bg-white/20 dark:bg-white/10 text-slate-900 dark:text-white font-black shadow-md border-white/20'
                  : 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : isGlassTheme(currentTheme)
                ? 'text-slate-700 hover:text-slate-900 hover:bg-white/40'
                : 'text-slate-500 hover:text-slate-900 dark:text-white'
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
                  <h2 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${isGlassTheme(currentTheme) ? 'text-rose-200' : 'text-rose-600'}`}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Needs Attention ({behindMembers.length})</span>
                  </h2>
                  <span className={`text-[11px] font-medium hidden sm:inline ${isGlassTheme(currentTheme) ? 'text-white/50' : 'text-slate-400'}`}>• Sorted by severity</span>
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs cursor-pointer min-h-[36px] active:scale-95 transition-all ${isGlassTheme(currentTheme) ? 'apple-glass-button-primary border border-white/40 shadow-[0_4px_16px_rgba(225,29,72,0.3)]' : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white'}`}
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
                        isGlassTheme(currentTheme)
                          ? isWayBehind
                            ? 'backdrop-blur-md bg-rose-500/20 border-rose-300/50 ring-1 ring-rose-400/30 backdrop-blur-md shadow-[0_8px_32px_rgba(225,29,72,0.15)]'
                            : 'backdrop-blur-md bg-amber-500/20 border-amber-300/50 ring-1 ring-amber-400/30 backdrop-blur-md shadow-[0_8px_32px_rgba(217,119,6,0.15)]'
                          : isWayBehind
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
                              <h3 className={`text-sm sm:text-base font-black truncate ${isGlassTheme(currentTheme) ? 'text-white' : 'text-slate-900'}`}>
                                {m.name}
                              </h3>
                              {getStatusBadge(summary.status)}
                            </div>
                            <p className={`text-xs font-semibold mt-0.5 break-words ${isGlassTheme(currentTheme) ? 'text-white/70' : 'text-slate-600'}`}>
                              {summary.summaryLine}
                            </p>
                          </div>
                        </div>

                        <div className={`flex items-center shrink-0 pt-0.5 ${isGlassTheme(currentTheme) ? 'text-white/50' : 'text-slate-400'}`}>
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Overdue chore pills preview */}
                      {summary.overdueItems.length > 0 && (
                        <div className={`mt-3 pt-2.5 flex flex-wrap gap-1.5 ${isGlassTheme(currentTheme) ? 'border-t border-white/20' : 'border-t border-slate-200/80'}`}>
                          {summary.overdueItems.slice(0, 3).map((item, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold border max-w-full sm:max-w-xs truncate ${
                                isGlassTheme(currentTheme) 
                                ? 'bg-white/10 border-white/20 text-white/90 backdrop-blur-sm shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]' 
                                : item.tierInfo.severityColor
                              }`}
                            >
                              {item.isRedo ? '🔄 Redo: ' : `${item.daysLate}d Late: `}
                              {item.chore.title}
                            </span>
                          ))}
                          {summary.overdueItems.length > 3 && (
                            <span className={`px-2 py-1 rounded-lg text-[11px] font-bold border ${
                              isGlassTheme(currentTheme)
                              ? 'bg-white/10 border-white/20 text-white/70 backdrop-blur-sm'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
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
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer min-h-[36px] transition-all ${isGlassTheme(currentTheme) ? 'apple-glass-button border-white/20' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs active:scale-95'}`}
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
                              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer min-h-[36px] transition-all ${isGlassTheme(currentTheme) ? 'apple-glass-button text-emerald-800 dark:text-emerald-300' : 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 shadow-2xs active:scale-95'}`}
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
                      className={`${theme.cardBg} rounded-2xl border ${theme.cardBorder} p-3 sm:p-4 hover:border-emerald-300 hover:shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-2`}
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
          {/* Time Range Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800">Timeframe:</span>
                <span className="text-xs font-semibold text-indigo-600 ml-1.5">{dateRangeInfo.labelTitle}</span>
              </div>
            </div>

            {/* Time range buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'this_week', label: 'This Week' },
                { id: 'last_week', label: 'Last Week' },
                { id: 'last_7_days', label: 'Past 7 Days' },
                { id: 'last_14_days', label: 'Past 14 Days' },
                { id: 'last_30_days', label: 'Past 30 Days' },
                { id: 'all_time', label: 'All Time' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setTimeRange(opt.id as TimeRangeOption)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    timeRange === opt.id
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Top Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Total Waivers Card */}
            <div className={`${isGlassTheme(currentTheme) ? 'backdrop-blur-md bg-emerald-500/20 border-emerald-300/40 ring-1 ring-emerald-400/20 backdrop-blur-md shadow-[0_8px_32px_rgba(16,185,129,0.15)]' : 'bg-emerald-50/80 border border-emerald-200/80'} rounded-2xl p-3 sm:p-4 shadow-2xs`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isGlassTheme(currentTheme) ? 'text-emerald-950/80' : 'text-emerald-800'}`}>
                  Total Waived
                </span>
                <Sparkles className={`w-4 h-4 ${isGlassTheme(currentTheme) ? 'text-emerald-500' : 'text-emerald-600'}`} />
              </div>
              <div className={`text-xl sm:text-2xl font-black mt-1 ${isGlassTheme(currentTheme) ? 'text-emerald-950' : 'text-emerald-950'}`}>
                {memberWaiverStats.totalHouseholdWaivers}
              </div>
              <p className={`text-[11px] font-semibold mt-0.5 ${isGlassTheme(currentTheme) ? 'text-emerald-900/80' : 'text-emerald-700'}`}>
                {memberWaiverStats.mostWaivedMember?.waivedCount 
                  ? `Most: ${memberWaiverStats.mostWaivedMember.name.split(' ')[0]} (${memberWaiverStats.mostWaivedMember.waivedCount})`
                  : 'No penalties waived'}
              </p>
            </div>

            {/* Overdue Total Card */}
            <div className={`${isGlassTheme(currentTheme) ? 'backdrop-blur-md bg-rose-500/20 border-rose-300/40 ring-1 ring-rose-400/20 backdrop-blur-md shadow-[0_8px_32px_rgba(225,29,72,0.15)]' : 'bg-rose-50/80 border border-rose-200/80'} rounded-2xl p-3 sm:p-4 shadow-2xs`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isGlassTheme(currentTheme) ? 'text-rose-950/80' : 'text-rose-800'}`}>
                  Total Overdue
                </span>
                <Clock className={`w-4 h-4 ${isGlassTheme(currentTheme) ? 'text-rose-500' : 'text-rose-600'}`} />
              </div>
              <div className={`text-xl sm:text-2xl font-black mt-1 ${isGlassTheme(currentTheme) ? 'text-rose-950' : 'text-rose-950'}`}>
                {memberWaiverStats.totalHouseholdOverdue}
              </div>
              <p className={`text-[11px] font-semibold mt-0.5 ${isGlassTheme(currentTheme) ? 'text-rose-900/80' : 'text-rose-700'}`}>
                {memberWaiverStats.mostOverdueMember?.overdueCount
                  ? `Highest: ${memberWaiverStats.mostOverdueMember.name.split(' ')[0]} (${memberWaiverStats.mostOverdueMember.overdueCount})`
                  : 'All on time'}
              </p>
            </div>

            {/* Redos Total Card */}
            <div className={`${isGlassTheme(currentTheme) ? 'backdrop-blur-md bg-purple-500/20 border-purple-300/40 ring-1 ring-purple-400/20 backdrop-blur-md shadow-[0_8px_32px_rgba(168,85,247,0.15)]' : 'bg-purple-50/80 border border-purple-200/80'} rounded-2xl p-3 sm:p-4 shadow-2xs`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isGlassTheme(currentTheme) ? 'text-purple-950/80' : 'text-purple-800'}`}>
                  Redos / Retries
                </span>
                <RefreshCw className={`w-4 h-4 ${isGlassTheme(currentTheme) ? 'text-purple-500' : 'text-purple-600'}`} />
              </div>
              <div className={`text-xl sm:text-2xl font-black mt-1 ${isGlassTheme(currentTheme) ? 'text-purple-950' : 'text-purple-950'}`}>
                {memberWaiverStats.totalHouseholdRedos}
              </div>
              <p className={`text-[11px] font-semibold mt-0.5 ${isGlassTheme(currentTheme) ? 'text-purple-900/80' : 'text-purple-700'}`}>
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
                {periodEvaluation.periodOnTimePercent}%
              </div>
              <p className="text-[11px] font-semibold text-indigo-700 mt-0.5">
                {memberWaiverStats.totalHouseholdOverdue === 0 ? 'All helpers on track' : `${periodEvaluation.sortedByOverdue.filter(s => s.overdueCount > 0).length} with overdue chores`}
              </p>
            </div>
          </div>

          {/* 14-Day Timeline Chart */}
          <div className={`${isGlassTheme(currentTheme) ? 'apple-glass-card' : 'bg-white'} rounded-2xl border ${isGlassTheme(currentTheme) ? 'border-white/20' : 'border-slate-200'} p-4 shadow-2xs space-y-3`}>
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
                        : 'text-slate-500 hover:text-slate-900 dark:text-white'
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
          <div className={`${isGlassTheme(currentTheme) ? 'apple-glass-card' : 'bg-white'} rounded-2xl border ${isGlassTheme(currentTheme) ? 'border-white/20' : 'border-slate-200'} p-4 shadow-2xs space-y-3`}>
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

          {/* ======================================================== */}
          {/* OVERDUE CHORES BY PERSON BREAKOUT */}
          {/* ======================================================== */}
          <div className={`${isGlassTheme(currentTheme) ? 'apple-glass-card' : 'bg-white'} rounded-2xl border ${isGlassTheme(currentTheme) ? 'border-white/20' : 'border-slate-200'} p-4 shadow-2xs space-y-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-black ${isGlassTheme(currentTheme) ? 'text-slate-900 dark:text-white' : 'text-slate-900'}`}>
                      Overdue Chores by Person Breakout
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                      {periodEvaluation.totalHouseholdOverdue} Total
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Breakdown of late and uncompleted tasks for each helper during {dateRangeInfo.labelTitle}
                  </p>
                </div>
              </div>

              {/* People Picker Filter for the Overdue breakout */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  onClick={() => setSelectedOverduePersonFilter('all')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedOverduePersonFilter === 'all'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  All Family ({periodEvaluation.totalHouseholdOverdue})
                </button>
                {periodEvaluation.stats.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedOverduePersonFilter(s.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      selectedOverduePersonFilter === s.id
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <span>{s.name.split(' ')[0]}</span>
                    {s.overdueCount > 0 ? (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        selectedOverduePersonFilter === s.id ? 'bg-rose-800 text-white' : 'bg-rose-200 text-rose-900'
                      }`}>
                        {s.overdueCount}
                      </span>
                    ) : (
                      <Check className="w-3 h-3 text-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Overdue helper cards */}
            {periodEvaluation.totalHouseholdOverdue === 0 ? (
              <div className={`rounded-xl p-8 text-center space-y-2 ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20' : 'bg-emerald-50/50 border border-emerald-100'}`}>
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-emerald-950">
                  No Overdue Chores in {dateRangeInfo.labelTitle}!
                </h4>
                <p className="text-xs text-emerald-800 max-w-md mx-auto font-medium">
                  Every family member has completed their assigned tasks on schedule, or pending penalties have already been waived or resolved.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {periodEvaluation.stats
                  .filter(s => (selectedOverduePersonFilter === 'all' ? s.overdueCount > 0 : s.id === selectedOverduePersonFilter))
                  .map(s => {
                    const totalAtRisk = s.overdueItems.reduce((acc, it) => acc + it.points, 0);

                    return (
                      <div
                        key={s.id}
                        className={`rounded-2xl border p-4 space-y-3.5 transition-all ${
                          s.overdueCount > 0
                            ? isGlassTheme(currentTheme)
                              ? 'apple-glass-card border-rose-300/40 bg-rose-50/20'
                              : 'bg-white border-rose-200 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 opacity-80'
                        }`}
                      >
                        {/* Member Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              photoUrl={s.member.avatarPhotoUrl}
                              emoji={s.member.avatarEmoji}
                              name={s.member.name}
                              size="md"
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-black text-slate-900">
                                  {s.member.name}
                                </h4>
                                {s.overdueCount > 0 ? (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                                    {s.overdueCount} Overdue
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    All Caught Up
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
                                <span>Current: <strong>⭐ {s.member.currentPoints || 0} pts</strong></span>
                                {totalAtRisk > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-rose-600 font-bold">⭐ {totalAtRisk} pts at risk</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions for this person */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isMomMode && s.overdueCount > 0 && (
                              <button
                                onClick={() => {
                                  soundFX.nudge();
                                  setNudgeModalTarget({ member: s.member });
                                  setNudgeMessage(`Hi ${s.member.name.split(' ')[0]}, you have ${s.overdueCount} overdue chore${s.overdueCount === 1 ? '' : 's'}. Let's get them finished today!`);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Send Nudge</span>
                              </button>
                            )}

                            {onOpenPointManager && isMomMode && (
                              <button
                                onClick={() => onOpenPointManager(s.member.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                title="Inspect or adjust points directly"
                              >
                                <Star className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Edit Points</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                const summary = evaluateMemberStatusThisWeek(s.member, chores, logs, penaltySettings);
                                setSelectedPersonSheet(summary);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Full Card</span>
                            </button>
                          </div>
                        </div>

                        {/* List of overdue chore items */}
                        {s.overdueItems.length === 0 ? (
                          <div className="py-2 text-center text-xs text-slate-500 font-medium">
                            No overdue chores for this helper in this timeframe.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {s.overdueItems.map((item, idx) => (
                              <div
                                key={`${item.chore.id}_${item.date}_${idx}`}
                                className="bg-slate-50/80 hover:bg-slate-100/90 rounded-xl p-3 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all"
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                    <Clock className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                                        {item.chore.title}
                                      </span>
                                      <span className="px-1.5 py-0.2 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                        {item.daysLate}d late
                                      </span>
                                      <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                        ⭐ {item.points} pts
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                      Due date: {item.date} {item.chore.scheduledTime ? `at ${item.chore.scheduledTime}` : ''}
                                      {item.log?.status === 'needs_redo' && (
                                        <span className="text-purple-600 font-bold ml-1.5">
                                          • Needs Redo inspection
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>

                                {isMomMode && (
                                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                                    <button
                                      onClick={() => {
                                        setWaiveTarget({
                                          chore: item.chore,
                                          member: s.member,
                                          date: item.date,
                                          daysLate: item.daysLate,
                                          status: (item.log?.status as any) || 'overdue',
                                          isGracePeriod: false,
                                          hoursRemainingInGrace: 0,
                                          extendedDueDate: item.log?.extendedDueDate,
                                          originalDueDate: item.log?.originalDueDate || item.date,
                                          scheduledTime: item.chore.scheduledTime,
                                          log: item.log,
                                        });
                                        setWaiveReason('Family schedule conflict / illness');
                                      }}
                                      className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                      <Sparkles className="w-3 h-3 text-emerald-600" />
                                      <span>Waive Penalty</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* "WHO IS GETTING THINGS WAIVED THE MOST?" - Leaderboard & Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-sm font-black ${isGlassTheme(currentTheme) ? 'text-slate-900 dark:text-white' : 'text-slate-900'}`}>
                    Who Is Getting Things Waived The Most?
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Ranked by total lateness waivers granted by parent
                  </p>
                </div>
              </div>
            </div>

            {memberWaiverStats.totalHouseholdWaivers === 0 ? (
              <div className={`rounded-xl p-6 text-center space-y-1 ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20 text-slate-700' : 'bg-slate-50 text-slate-500'}`}>
                <Sparkles className="w-6 h-6 text-slate-300 mx-auto" />
                <p className={`text-xs font-bold ${isGlassTheme(currentTheme) ? 'text-slate-800 dark:text-slate-200' : 'text-slate-600'}`}>No penalties have been waived yet.</p>
                <p className={`text-[11px] ${isGlassTheme(currentTheme) ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400'}`}>When you waive an overdue penalty, full audit records and share percentages appear here.</p>
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
                          ? (isGlassTheme(currentTheme) ? 'apple-glass-card border-emerald-400/40 shadow-inner' : 'bg-emerald-50/70 border-emerald-200 shadow-2xs')
                          : (isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20' : 'bg-slate-50/60 border-slate-200')
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Rank badge */}
                          <div className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                            idx === 0 ? 'bg-amber-400 text-amber-950 shadow-2xs' :
                            idx === 1 ? (isGlassTheme(currentTheme) ? 'bg-slate-300/50 text-slate-800' : 'bg-slate-200 text-slate-700') :
                            idx === 2 ? (isGlassTheme(currentTheme) ? 'bg-amber-700/80 text-white' : 'bg-amber-700 text-white') :
                            (isGlassTheme(currentTheme) ? 'bg-slate-200/50 text-slate-700' : 'bg-slate-100 text-slate-500')
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
                                <span className={`px-1.5 py-0.2 text-[10px] font-black ${isGlassTheme(currentTheme) ? 'apple-glass-pill text-emerald-800 dark:text-emerald-200' : 'rounded-full bg-emerald-600 text-white'}`}>
                                  Most Waived
                                </span>
                              )}
                            </div>
                            <p className={`text-[11px] font-medium ${isGlassTheme(currentTheme) ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500'}`}>
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
            <div className={`rounded-2xl border p-4 shadow-2xs space-y-3 ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20' : 'bg-white border-slate-200'}`}>
              <h3 className={`text-sm font-black flex items-center gap-1.5 ${isGlassTheme(currentTheme) ? 'text-slate-900 dark:text-white' : 'text-slate-900'}`}>
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Chores Most Frequently Waived</span>
              </h3>

              <div className="space-y-2">
                {topWaivedChores.map((chore, i) => (
                  <div 
                    key={chore.title}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/10' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-black truncate ${isGlassTheme(currentTheme) ? 'text-slate-800 dark:text-slate-100' : 'text-slate-900'}`}>
                          {chore.title}
                        </span>
                        <span className={`px-1.5 py-0.2 text-[10px] font-black ${isGlassTheme(currentTheme) ? 'apple-glass-pill text-emerald-900 dark:text-emerald-200' : 'rounded-full bg-emerald-100 text-emerald-800'}`}>
                          {chore.count}x waived
                        </span>
                      </div>
                      <p className={`text-[11px] font-medium truncate mt-0.5 ${isGlassTheme(currentTheme) ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500'}`}>
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
          {/* ======================================================== */}
          {/* MISSING GLASS PANEL: AUDIT HUB & PEOPLE PICKER & TIMEFRAME */}
          {/* ======================================================== */}
          <div className={`${isGlassTheme(currentTheme) ? 'apple-glass-panel border-white/40 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'} rounded-3xl border p-4 sm:p-5 space-y-4`}>
            {/* Panel Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/30 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-indigo-500 text-white flex items-center justify-center text-lg shadow-sm shrink-0">
                  📜
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                      Household Audit & Transaction Ledger
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                      100% Auditable
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Complete ledger of verified chores, point balance credits, reward redemptions, penalties, and waivers.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Button to adjust in-game cosmetics */}
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setCosmeticsModalMemberId(historyFilterMemberId !== 'all' ? historyFilterMemberId : members[0]?.id || '');
                    setIsCosmeticsModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-cyan-500/15 hover:from-purple-500/25 hover:to-cyan-500/25 text-purple-900 dark:text-purple-200 border border-purple-300/60 dark:border-purple-700/60 shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 min-h-[38px]"
                  title="Customize in-game avatar cosmetic frames per account"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Adjust In-Game Cosmetics</span>
                </button>

                {/* Button to inspect & edit points */}
                {onOpenPointManager && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      onOpenPointManager(historyFilterMemberId !== 'all' ? historyFilterMemberId : undefined);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 min-h-[38px]"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-200 text-amber-200" />
                    <span>Inspect & Edit Points</span>
                  </button>
                )}
              </div>
            </div>

            {/* 4 Interactive KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* 1. Chore Earnings */}
              <button
                type="button"
                onClick={() => setHistoryFilterType(historyFilterType === 'chore' ? 'all' : 'chore')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  historyFilterType === 'chore'
                    ? 'bg-emerald-100/90 dark:bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-400/40 shadow-xs'
                    : isGlassTheme(currentTheme)
                    ? 'apple-glass-card border-white/40 hover:bg-white/50'
                    : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-50'
                }`}
              >
                <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                  <span>Chore Earnings</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-base sm:text-lg font-black text-emerald-950 dark:text-emerald-200 mt-0.5">
                  +{auditMetrics.totalEarned} pts
                </div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                  {auditMetrics.choreCount} verified chore{auditMetrics.choreCount === 1 ? '' : 's'}
                </div>
              </button>

              {/* 2. Reward Deductions */}
              <button
                type="button"
                onClick={() => setHistoryFilterType(historyFilterType === 'reward' ? 'all' : 'reward')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  historyFilterType === 'reward'
                    ? 'bg-purple-100/90 dark:bg-purple-950/80 border-purple-400 ring-2 ring-purple-400/40 shadow-xs'
                    : isGlassTheme(currentTheme)
                    ? 'apple-glass-card border-white/40 hover:bg-white/50'
                    : 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/60 hover:bg-purple-50'
                }`}
              >
                <div className="flex items-center justify-between text-purple-800 dark:text-purple-300 text-[11px] font-bold">
                  <span>Reward Redemptions</span>
                  <Gift className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <div className="text-base sm:text-lg font-black text-purple-950 dark:text-purple-200 mt-0.5">
                  -{auditMetrics.totalRedeemed} pts
                </div>
                <div className="text-[10px] text-purple-700 dark:text-purple-400 font-medium">
                  {auditMetrics.claimCount} reward{auditMetrics.claimCount === 1 ? '' : 's'} redeemed
                </div>
              </button>

              {/* 3. Protected / Waived */}
              <button
                type="button"
                onClick={() => setHistoryFilterType(historyFilterType === 'penalty_waived' ? 'all' : 'penalty_waived')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  historyFilterType === 'penalty_waived'
                    ? 'bg-amber-100/90 dark:bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
                    : isGlassTheme(currentTheme)
                    ? 'apple-glass-card border-white/40 hover:bg-white/50'
                    : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 hover:bg-amber-50'
                }`}
              >
                <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                  <span>Protected Waivers</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="text-base sm:text-lg font-black text-amber-950 dark:text-amber-200 mt-0.5">
                  {auditMetrics.waiverCount} Waived
                </div>
                <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                  100% star points kept
                </div>
              </button>

              {/* 4. Net Activity */}
              <button
                type="button"
                onClick={() => setHistoryFilterType('all')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  historyFilterType === 'all'
                    ? 'bg-indigo-100/90 dark:bg-indigo-950/80 border-indigo-400 ring-2 ring-indigo-400/40 shadow-xs'
                    : isGlassTheme(currentTheme)
                    ? 'apple-glass-card border-white/40 hover:bg-white/50'
                    : 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-50'
                }`}
              >
                <div className="flex items-center justify-between text-indigo-800 dark:text-indigo-300 text-[11px] font-bold">
                  <span>Net Activity</span>
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div className={`text-base sm:text-lg font-black mt-0.5 ${auditMetrics.netPoints >= 0 ? 'text-indigo-950 dark:text-indigo-200' : 'text-rose-600 dark:text-rose-400'}`}>
                  {auditMetrics.netPoints >= 0 ? '+' : ''}{auditMetrics.netPoints} pts
                </div>
                <div className="text-[10px] text-indigo-700 dark:text-indigo-400 font-medium">
                  {auditMetrics.totalRecords} total records
                </div>
              </button>
            </div>

            {/* People Picker Panel: Filter by Family Member */}
            <div className="pt-2.5 border-t border-white/30 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>People Picker Panel • Filter by Family Member</span>
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {historyFilterMemberId === 'all' 
                    ? `All Family (${auditMetrics.totalRecords} events)` 
                    : `${members.find(m => m.id === historyFilterMemberId)?.name || 'Helper'} selected`}
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 -mx-1 px-1">
                {/* All Family Button */}
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setHistoryFilterMemberId('all');
                  }}
                  className={`px-3 py-2 rounded-2xl border transition-all flex items-center gap-2 shrink-0 cursor-pointer min-h-[42px] active:scale-95 ${
                    historyFilterMemberId === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs font-black'
                      : isGlassTheme(currentTheme)
                      ? 'apple-glass-card hover:bg-white/60 text-slate-800 border-white/40'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base">👨‍👩‍👧‍👦</span>
                  <div className="text-left">
                    <div className="text-xs font-bold leading-tight">All Family</div>
                    <div className="text-[10px] opacity-75">{allUnifiedRecords.length} records</div>
                  </div>
                </button>

                {/* Each Member Button */}
                {members.map(member => {
                  const isSelected = historyFilterMemberId === member.id;
                  const memberRecsCount = allUnifiedRecords.filter(r => {
                    const normFilter = member.id.toLowerCase().replace(/^(mem_|member_)/, '');
                    const normEventMember = (r.memberId || '').toLowerCase().replace(/^(mem_|member_)/, '');
                    return r.memberId === member.id || (normFilter && normEventMember === normFilter) || (r.memberName && r.memberName.toLowerCase().includes(member.name.toLowerCase().split(' ')[0]));
                  }).length;
                  const cosmetic = COSMETIC_ITEMS.find(c => c.id === member.equippedCosmeticId);

                  return (
                    <div key={member.id} className="relative group shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playPop();
                          setHistoryFilterMemberId(member.id);
                        }}
                        className={`px-3 py-2 rounded-2xl border transition-all flex items-center gap-2 shrink-0 cursor-pointer min-h-[42px] active:scale-95 ${
                          isSelected
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs font-black'
                            : isGlassTheme(currentTheme)
                            ? 'apple-glass-card hover:bg-white/60 text-slate-800 border-white/40'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Avatar
                          photoUrl={member.avatarPhotoUrl}
                          emoji={member.avatarEmoji}
                          name={member.name}
                          size="sm"
                          cosmeticClass={cosmetic?.cssClass}
                        />
                        <div className="text-left">
                          <div className="text-xs font-bold leading-tight flex items-center gap-1">
                            <span>{member.name.split(' ')[0]}</span>
                            {cosmetic && <span className="text-[10px]">✨</span>}
                          </div>
                          <div className={`text-[10px] ${isSelected ? 'opacity-85' : 'text-slate-400'}`}>
                            {memberRecsCount} events • {member.currentPoints || 0} pts
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeframe Selector Row */}
            <div className="pt-2.5 border-t border-white/30 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Timeframe:</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'today', label: 'Today' },
                  { id: 'this_week', label: 'This Week' },
                  { id: 'last_week', label: 'Last Week' },
                  { id: 'past_7', label: 'Past 7 Days' },
                  { id: 'past_30', label: 'Past 30 Days' },
                  { id: 'this_month', label: 'This Month' },
                ].map(tf => {
                  const isActive = auditTimeframe === tf.id;
                  return (
                    <button
                      key={tf.id}
                      type="button"
                      onClick={() => {
                        soundFX.playPop();
                        setAuditTimeframe(tf.id as any);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs font-black'
                          : isGlassTheme(currentTheme)
                          ? 'apple-glass-pill hover:bg-white/60 text-slate-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {tf.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* History Filters & Search */}
          <div className={`${isGlassTheme(currentTheme) ? 'apple-glass-card' : 'bg-white'} rounded-2xl border ${isGlassTheme(currentTheme) ? 'border-white/20' : 'border-slate-200'} p-3 shadow-2xs space-y-2.5`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-600" />
                <span>Audit Filters</span>
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {filteredUnifiedRecords.length} records matching
              </span>
            </div>

            {/* Keyword Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="Search by chore, reward, family member, notes, or reason..."
                className={`w-full text-xs font-medium pl-8 pr-8 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[36px] ${
                  isGlassTheme(currentTheme)
                    ? 'apple-glass-input'
                    : 'bg-slate-50 border border-slate-200 text-slate-900'
                }`}
              />
              {historySearchQuery && (
                <button
                  onClick={() => setHistorySearchQuery('')}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isGlassTheme(currentTheme) ? 'text-slate-600 hover:text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
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
                className={`text-xs font-bold rounded-xl px-2.5 py-1.5 cursor-pointer min-h-[36px] ${
                  isGlassTheme(currentTheme)
                    ? 'apple-glass-input'
                    : 'bg-slate-50 border border-slate-200 text-slate-700'
                }`}
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
                className={`text-xs font-bold rounded-xl px-2.5 py-1.5 cursor-pointer min-h-[36px] ${
                  isGlassTheme(currentTheme)
                    ? 'apple-glass-input'
                    : 'bg-slate-50 border border-slate-200 text-slate-700'
                }`}
              >
                <option value="all">All Event Types ({auditMetrics.totalRecords})</option>
                <option value="reward">🎁 Reward Redemptions ({auditMetrics.claimCount})</option>
                <option value="chore">✓ Verified Chores & Points ({auditMetrics.choreCount})</option>
                <option value="penalty_waived">✨ Penalties Waived ({auditMetrics.waiverCount})</option>
                <option value="penalty_applied">⚠️ Penalties Applied ({auditMetrics.penaltyCount})</option>
                <option value="due_extended">📅 Due Date Extensions ({auditMetrics.extensionCount})</option>
                <option value="nudge_sent">🔔 Nudges Sent ({auditMetrics.nudgeCount})</option>
                <option value="failed_inspection">🔄 Redos & Corrections ({auditMetrics.redoCount})</option>
                <option value="point_adjustment">⭐ Point Adjustments ({auditMetrics.adjustmentCount})</option>
              </select>
            </div>
          </div>

          {/* Grouped Reverse-Chronological Event Stream */}
          {Object.keys(groupedUnifiedRecords).length === 0 ? (
            <div className={`${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20 text-slate-700' : 'bg-white rounded-2xl border border-slate-200 text-slate-500'} p-8 text-center space-y-2`}>
              <History className={`w-8 h-8 mx-auto ${isGlassTheme(currentTheme) ? 'text-slate-600' : 'text-slate-300'}`} />
              <p className="text-xs font-bold">No records found matching your filters.</p>
              {historySearchQuery && (
                <button
                  onClick={() => setHistorySearchQuery('')}
                  className={`text-xs font-black underline cursor-pointer ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-indigo-600'}`}
                >
                  Clear search term
                </button>
              )}
            </div>
          ) : (
            (Object.entries(groupedUnifiedRecords) as [string, UnifiedAuditRecord[]][]).map(([weekLabel, weekRecords]) => (
              <div key={weekLabel} className="space-y-2">
                <div className={`sticky top-[110px] z-10 px-3 py-1 rounded-xl border text-xs font-black shadow-2xs ${
                  isGlassTheme(currentTheme)
                    ? 'bg-white/40 border-white/40 text-slate-800 backdrop-blur-md'
                    : 'bg-slate-100/90 border-slate-200 text-slate-700'
                }`}>
                  {weekLabel} ({weekRecords.length} records)
                </div>

                <div className="space-y-2">
                  {weekRecords.map((rec) => {
                    const isReward = rec.category === 'reward';
                    const isChore = rec.category === 'chore';
                    const isPenalty = rec.category === 'penalty_applied';
                    const isWaived = rec.category === 'penalty_waived';
                    const isExtended = rec.category === 'due_extended';
                    const isNudge = rec.category === 'nudge_sent';
                    const isRedo = rec.category === 'failed_inspection';
                    const isAdjustment = rec.category === 'point_adjustment';

                    return (
                      <div
                        key={rec.id}
                        className={`${isGlassTheme(currentTheme) ? 'bg-white/20 border-white/30 backdrop-blur-sm' : 'bg-white border-slate-200'} rounded-2xl border p-3 sm:p-4 shadow-2xs flex items-start gap-3`}
                      >
                        {/* Type Icon */}
                        <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${
                          isReward
                            ? (isGlassTheme(currentTheme) ? 'bg-purple-500/20 text-purple-600 border border-purple-400/40 backdrop-blur-md shadow-inner' : 'bg-purple-50 text-purple-600 border border-purple-200')
                            : isChore
                            ? (isGlassTheme(currentTheme) ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-400/40 backdrop-blur-md shadow-inner' : 'bg-emerald-50 text-emerald-600 border border-emerald-200')
                            : isPenalty 
                            ? (isGlassTheme(currentTheme) ? 'bg-rose-500/20 text-rose-600 border border-rose-400/40 backdrop-blur-md shadow-inner' : 'bg-rose-50 text-rose-600 border border-rose-200')
                            : isWaived
                            ? (isGlassTheme(currentTheme) ? 'bg-amber-500/20 text-amber-600 border border-amber-400/40 backdrop-blur-md shadow-inner' : 'bg-amber-50 text-amber-600 border border-amber-200')
                            : isExtended
                            ? (isGlassTheme(currentTheme) ? 'bg-indigo-500/20 text-indigo-600 border border-indigo-400/40 backdrop-blur-md shadow-inner' : 'bg-indigo-50 text-indigo-600 border border-indigo-200')
                            : isRedo
                            ? (isGlassTheme(currentTheme) ? 'bg-rose-500/20 text-rose-600 border border-rose-400/40 backdrop-blur-md shadow-inner' : 'bg-rose-50 text-rose-600 border border-rose-200')
                            : (isGlassTheme(currentTheme) ? 'bg-amber-500/20 text-amber-600 border border-amber-400/40 backdrop-blur-md shadow-inner' : 'bg-amber-50 text-amber-600 border border-amber-200')
                        }`}>
                          {isReward && <Gift className="w-4 h-4" />}
                          {isChore && <CheckCircle2 className="w-4 h-4" />}
                          {isPenalty && <TrendingDown className="w-4 h-4" />}
                          {isWaived && <Sparkles className="w-4 h-4" />}
                          {isExtended && <CalendarPlus className="w-4 h-4" />}
                          {isNudge && <BellRing className="w-4 h-4" />}
                          {isRedo && <RefreshCw className="w-4 h-4" />}
                          {isAdjustment && <Star className="w-4 h-4" />}
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                                {rec.memberName}
                              </h4>
                              {rec.statusBadge && (
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${rec.statusBadgeColor || 'bg-slate-100 text-slate-800'}`}>
                                  {rec.statusBadge}
                                </span>
                              )}
                              {rec.gradeBadge && (
                                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                  {rec.gradeBadge}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                              {formatAuditDate(rec.dateStr, rec.timestamp)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-0.5 flex-wrap">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {rec.title}
                            </p>
                            {rec.pointsLabel && (
                              <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                                (rec.pointsDelta || 0) > 0 
                                  ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300' 
                                  : (rec.pointsDelta || 0) < 0 
                                  ? 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300' 
                                  : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                              }`}>
                                {rec.pointsLabel}
                              </span>
                            )}
                          </div>

                          {rec.subtitle && (
                            <p className={`text-[11px] font-semibold mt-0.5 ${isGlassTheme(currentTheme) ? 'text-slate-600' : 'text-slate-500'}`}>
                              {rec.subtitle}
                            </p>
                          )}

                          {rec.notes && (
                            <p className={`text-xs font-medium mt-0.5 break-words ${isGlassTheme(currentTheme) ? 'text-slate-600' : 'text-slate-500'}`}>
                              {rec.notes}
                            </p>
                          )}

                          {/* Event-specific Points before/after if present */}
                          {rec.rawEvent && rec.rawEvent.pointsBefore !== undefined && rec.rawEvent.pointsAfter !== undefined && (
                            <div className={`mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-xl text-xs font-black ${
                              (rec.rawEvent.pointsDelta || 0) > 0
                                ? (isGlassTheme(currentTheme) ? 'backdrop-blur-md bg-emerald-500/20 border-emerald-300/40 text-emerald-900 shadow-xs ring-1 ring-emerald-400/20' : 'bg-emerald-50 border border-emerald-200 text-emerald-900')
                                : (rec.rawEvent.pointsDelta || 0) === 0
                                ? (isGlassTheme(currentTheme) ? 'backdrop-blur-md bg-amber-500/20 border-amber-300/40 text-amber-900 shadow-xs ring-1 ring-amber-400/20' : 'bg-amber-50 border border-amber-200 text-amber-900')
                                : (isGlassTheme(currentTheme) ? 'backdrop-blur-md bg-rose-500/20 border-rose-300/40 text-rose-900 shadow-xs ring-1 ring-rose-400/20' : 'bg-rose-50 border border-rose-200 text-rose-900')
                            }`}>
                              <span>Before: ⭐{rec.rawEvent.pointsBefore}</span>
                              <ArrowRight className={`w-3 h-3 ${
                                (rec.rawEvent.pointsDelta || 0) > 0 ? 'text-emerald-500' : (rec.rawEvent.pointsDelta || 0) === 0 ? 'text-amber-500' : 'text-rose-500'
                              }`} />
                              <span>After: ⭐{rec.rawEvent.pointsAfter}</span>
                              <span className="ml-1">
                                ({(rec.rawEvent.pointsDelta || 0) > 0 ? `+${rec.rawEvent.pointsDelta}` : `${rec.rawEvent.pointsDelta || 0}`} pts)
                              </span>
                            </div>
                          )}

                          {isWaived && (
                            <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black ${isGlassTheme(currentTheme) ? 'backdrop-blur-md bg-amber-500/20 border-amber-300/40 text-amber-900 shadow-xs ring-1 ring-amber-400/20' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
                              <Sparkles className={`w-3.5 h-3.5 ${isGlassTheme(currentTheme) ? 'text-amber-500' : 'text-amber-600'}`} />
                              <span>100% Star Points Protected & Restored</span>
                            </div>
                          )}

                          {rec.proofPhotoUrl && (
                            <div className="mt-2">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                Photo Proof Attached:
                              </span>
                              <img
                                src={rec.proofPhotoUrl}
                                alt="Proof"
                                className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-2xs"
                                referrerPolicy="no-referrer"
                              />
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
          theme={theme}
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
        <HouseholdDrilldownDrawer currentTheme={currentTheme}
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
          className={`fixed inset-0 z-[60] flex items-center justify-center p-4 ${isGlassTheme(currentTheme) ? (THEMES[currentTheme].isDark ? 'bg-slate-900/40 backdrop-blur-md' : 'bg-white/30 backdrop-blur-md') : 'backdrop-blur-sm bg-black/50'}`}
          onClick={() => setNudgeModalTarget(null)}
        >
          <div 
            className={`${isGlassTheme(currentTheme) ? 'apple-glass-panel border-white/20' : 'bg-white border-slate-200'} w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4 border`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-sm font-black ${isGlassTheme(currentTheme) ? 'text-slate-900 dark:text-white' : 'text-slate-900'}`}>
                    Send Nudge to {nudgeModalTarget.member.name}
                  </h3>
                  <p className={`text-[11px] font-medium ${isGlassTheme(currentTheme) ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500'}`}>
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
                  className={`w-full text-xs font-semibold p-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none ${isGlassTheme(currentTheme) ? 'apple-glass-input' : 'bg-slate-50 border border-slate-200'}`}
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
          className={`fixed inset-0 z-[60] flex items-center justify-center p-4 ${isGlassTheme(currentTheme) ? (THEMES[currentTheme].isDark ? 'bg-slate-900/40 backdrop-blur-md' : 'bg-white/30 backdrop-blur-md') : 'backdrop-blur-sm bg-black/50'}`}
          onClick={() => setWaiveTarget(null)}
        >
          <div 
            className={`${isGlassTheme(currentTheme) ? 'apple-glass-panel border-white/20' : 'bg-white border-slate-200'} w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4 border`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-sm font-black ${isGlassTheme(currentTheme) ? 'text-slate-900 dark:text-white' : 'text-slate-900'}`}>
                    Waive Lateness Penalty
                  </h3>
                  <p className={`text-[11px] font-medium ${isGlassTheme(currentTheme) ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500'}`}>
                    Restores 100% points without lateness deduction
                  </p>
                </div>
              </div>
              <button onClick={() => setWaiveTarget(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWaiveSubmit} className="space-y-3">
              <div className={`p-3 rounded-xl border text-xs space-y-1 ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/10 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <div className="font-bold text-slate-900 dark:text-white">{waiveTarget.chore.title}</div>
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
                  className={`w-full text-xs font-semibold p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none ${isGlassTheme(currentTheme) ? 'apple-glass-input' : 'bg-slate-50 border border-slate-200'}`}
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
                  className={`px-4 py-2 rounded-xl text-xs font-black shadow-2xs flex items-center gap-1.5 cursor-pointer min-h-[38px] ${isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
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
          className={`fixed inset-0 z-[60] flex items-center justify-center p-4 ${isGlassTheme(currentTheme) ? (THEMES[currentTheme].isDark ? 'bg-slate-900/40 backdrop-blur-md' : 'bg-white/30 backdrop-blur-md') : 'backdrop-blur-sm bg-black/50'}`}
          onClick={() => setExtendTarget(null)}
        >
          <div 
            className={`${isGlassTheme(currentTheme) ? 'apple-glass-panel border-white/20' : 'bg-white border-slate-200'} w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4 border`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <CalendarPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-sm font-black ${isGlassTheme(currentTheme) ? 'text-slate-900 dark:text-white' : 'text-slate-900'}`}>
                    Extend Chore Due Date
                  </h3>
                  <p className={`text-[11px] font-medium ${isGlassTheme(currentTheme) ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500'}`}>
                    Resets late clock until new extension deadline
                  </p>
                </div>
              </div>
              <button onClick={() => setExtendTarget(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExtendSubmit} className="space-y-3">
              <div className={`p-3 rounded-xl border text-xs space-y-1 ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/10 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <div className="font-bold text-slate-900 dark:text-white">{extendTarget.chore.title}</div>
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
                          ? `${theme.primaryBg} ${theme.primaryText} shadow-2xs`
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
                  className={`w-full text-xs font-semibold p-2.5 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none ${isGlassTheme(currentTheme) ? 'apple-glass-input' : 'bg-slate-50 border border-slate-200'}`}
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
                  className={`px-4 py-2 rounded-xl text-xs font-black ${theme.primaryBg} ${theme.primaryHover} ${theme.primaryText} shadow-2xs flex items-center gap-1.5 cursor-pointer min-h-[38px]`}
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
          className={`fixed inset-0 z-[60] flex items-center justify-center p-4 ${isGlassTheme(currentTheme) ? (THEMES[currentTheme].isDark ? 'bg-slate-900/40 backdrop-blur-md' : 'bg-white/30 backdrop-blur-md') : 'backdrop-blur-sm bg-black/50'}`}
          onClick={() => setShowSettingsModal(false)}
        >
          <div 
            className={`${isGlassTheme(currentTheme) ? 'apple-glass-panel border-white/20' : 'bg-white border-slate-200'} w-full max-w-lg rounded-3xl p-5 shadow-2xl space-y-4 border max-h-[85vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-sm font-black ${isGlassTheme(currentTheme) ? 'text-slate-900 dark:text-white' : 'text-slate-900'}`}>
                    Penalty & Grade Configuration
                  </h3>
                  <p className={`text-[11px] font-medium ${isGlassTheme(currentTheme) ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500'}`}>
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
              <h4 className={`text-xs font-black uppercase tracking-wider ${isGlassTheme(currentTheme) ? 'text-slate-900 dark:text-slate-200' : 'text-slate-900 dark:text-white'}`}>
                Lateness Tiers & Balance Deductions
              </h4>

              <div className="space-y-2 text-xs">
                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${isGlassTheme(currentTheme) ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <span className={`font-bold ${isGlassTheme(currentTheme) ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>&lt; 1 Day Late</span>
                    <p className={`text-[11px] ${isGlassTheme(currentTheme) ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500'}`}>Same day grace / morning after</p>
                  </div>
                  <span className="font-black text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-500/30">
                    Earns 75% points
                  </span>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${isGlassTheme(currentTheme) ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <span className={`font-bold ${isGlassTheme(currentTheme) ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>1 to 2 Days Late</span>
                    <p className={`text-[11px] ${isGlassTheme(currentTheme) ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500'}`}>Moderate delay</p>
                  </div>
                  <span className="font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/30 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-500/40">
                    Earns 50% points
                  </span>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${isGlassTheme(currentTheme) ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <span className={`font-bold ${isGlassTheme(currentTheme) ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>3 to 6 Days Late</span>
                    <p className={`text-[11px] ${isGlassTheme(currentTheme) ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500'}`}>Severe delay</p>
                  </div>
                  <span className="font-black text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/20 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-500/30">
                    0% earn + 25% balance deduction
                  </span>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${isGlassTheme(currentTheme) ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <span className={`font-bold ${isGlassTheme(currentTheme) ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>7+ Days Late / Missed</span>
                    <p className={`text-[11px] ${isGlassTheme(currentTheme) ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500'}`}>Abandoned or skipped</p>
                  </div>
                  <span className="font-black text-rose-900 dark:text-rose-300 bg-rose-100 dark:bg-rose-500/30 px-2 py-1 rounded-lg border border-rose-300 dark:border-rose-500/40">
                    0% earn + 100% balance deduction
                  </span>
                </div>
              </div>
            </div>

            {/* Quality Grade Multipliers */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className={`text-xs font-black uppercase tracking-wider ${isGlassTheme(currentTheme) ? 'text-slate-900 dark:text-slate-200' : 'text-slate-900 dark:text-white'}`}>
                Inspection Quality Multipliers (Stacked)
              </h4>
              <div className="grid grid-cols-5 gap-1.5 text-center">
                {[
                  { grade: 'A+', label: '100%', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30' },
                  { grade: 'A', label: '90%', color: 'text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30' },
                  { grade: 'B', label: '75%', color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30' },
                  { grade: 'C', label: '50%', color: 'text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/30 border-amber-200 dark:border-amber-500/40' },
                  { grade: 'Redo', label: '0%', color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/20 border-rose-200 dark:border-rose-500/30' },
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
                <span className="text-xs font-bold text-slate-900 dark:text-white">Allow Negative Balance</span>
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
                className={`px-4 py-2 rounded-xl text-xs font-black ${theme.primaryBg} ${theme.primaryHover} ${theme.primaryText} shadow-2xs cursor-pointer min-h-[38px]`}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Game Avatar Cosmetics Customization Manager Modal */}
      {isCosmeticsModalOpen && (
        <CosmeticsManagerModal
          isOpen={isCosmeticsModalOpen}
          onClose={() => setIsCosmeticsModalOpen(false)}
          members={members}
          selectedMemberId={cosmeticsModalMemberId}
          onEquipCosmetic={(memberId, cosmeticId) => {
            if (onEquipCosmetic) {
              onEquipCosmetic(memberId, cosmeticId);
            }
          }}
          currentTheme={currentTheme}
          isMomMode={isMomMode}
        />
      )}
    </div>
  );
};
