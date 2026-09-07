import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  Gift, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ShieldCheck, 
  History, 
  Edit3, 
  Save, 
  Check, 
  Star, 
  Users, 
  HelpCircle, 
  ArrowRight, 
  Calculator, 
  Equal, 
  Calendar, 
  Filter, 
  Search, 
  ArrowUpDown, 
  ChevronDown, 
  ChevronUp, 
  Award, 
  Zap, 
  SlidersHorizontal, 
  Info,
  Layers,
  FileText,
  Home,
  Crown
} from 'lucide-react';
import { HouseholdMember, Chore, ChoreAssignmentLog, RewardClaim, ChoreEvent, HouseholdInfo } from '../types';
import { Avatar } from './Avatar';
import { soundFX } from '../utils/audio';
import { ThemePreset, isGlassTheme } from '../utils/theme';
import { calculateHouseProgression, HOUSE_LEVELS } from '../utils/houseProgression';

interface PointManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: HouseholdMember[];
  chores: Chore[];
  logs: ChoreAssignmentLog[];
  claims: RewardClaim[];
  events?: ChoreEvent[];
  currentTheme?: ThemePreset;
  initialMemberId?: string;
  householdInfo?: HouseholdInfo;
  onSetMemberPoints: (memberId: string, newCurrentPoints: number, newLifetimePoints?: number, reason?: string) => void;
  onAdjustPoints: (memberId: string, delta: number, reason: string) => void;
  onResetAllSeedPoints: () => void;
  onResetAllToVerified?: () => void;
  onSetHouseXp?: (newHouseXp: number, resetHelpersLifetimeXp?: boolean) => void;
}

export type ModalAuditTab = 'all' | 'balance' | 'chores' | 'rewards' | 'xp' | 'events';
export type TimeframeFilter = 'all' | 'today' | 'this_week' | 'last_week' | 'past_7' | 'past_14' | 'past_30' | 'this_month' | 'custom';
export type SortOption = 'newest' | 'oldest' | 'highest_points' | 'lowest_points';

export const PointManagerModal: React.FC<PointManagerModalProps> = ({
  isOpen,
  onClose,
  members,
  chores,
  logs,
  claims,
  events = [],
  currentTheme = 'rose',
  initialMemberId,
  householdInfo,
  onSetMemberPoints,
  onAdjustPoints,
  onResetAllSeedPoints,
  onResetAllToVerified,
  onSetHouseXp,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => {
    if (initialMemberId && members.some(m => m.id === initialMemberId)) {
      return initialMemberId;
    }
    const nonParent = members.find(m => m.role !== 'parent');
    return nonParent ? nonParent.id : members[0]?.id || '';
  });

  // Active view tab: clicking on top summary cards directly switches this tab!
  const [activeTab, setActiveTab] = useState<ModalAuditTab>('all');
  
  // Timeframe filter state
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCustomDateInputs, setShowCustomDateInputs] = useState(false);

  // Search & Sorting
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Expanded row ID for detailed inspection
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Direct editing inputs
  const [customExactInput, setCustomExactInput] = useState<string>('');
  const [customExactXPInput, setCustomExactXPInput] = useState<string>('');
  const [quickAdjustReason, setQuickAdjustReason] = useState('Parent point balance adjustment');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // House XP direct management state (Requested by User)
  const [customExactHouseXpInput, setCustomExactHouseXpInput] = useState<string>('');
  const [resetHelpersLifetimeToo, setResetHelpersLifetimeToo] = useState<boolean>(false);

  // In-app custom confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    actionColor: 'rose' | 'amber' | 'emerald';
    onConfirm: () => void;
  } | null>(null);

  // Keep state in sync if initialMemberId changes
  React.useEffect(() => {
    if (initialMemberId && members.some(m => m.id === initialMemberId)) {
      setSelectedMemberId(initialMemberId);
    }
  }, [initialMemberId, members]);

  const activeMember = members.find(m => m.id === selectedMemberId) || members[0];
  const isHouseXpSelected = selectedMemberId === 'house_xp';
  const houseProg = calculateHouseProgression(members, householdInfo);

  const kidsOnlyXp = members
    .filter(m => m.role !== 'parent')
    .reduce((acc, m) => acc + (m.lifetimePoints || 0), 0);
  
  const allVerifiedChoresTotal = logs
    .filter(l => l.status === 'completed' || l.status === 'approved')
    .reduce((acc, l) => acc + (l.pointsEarned || 0), 0);

  const handleApplyExactHouseXp = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customExactHouseXpInput, 10);
    if (isNaN(parsed) || parsed < 0) return;
    soundFX.playFanfare();
    onSetHouseXp?.(parsed, resetHelpersLifetimeToo);
    setCustomExactHouseXpInput('');
    setSaveSuccessMsg(`House Experience successfully set to ${parsed} XP!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Helper to parse date string into timestamp
  const parseToMs = (dateStr?: any): number => {
    if (!dateStr) return 0;
    let str = '';
    if (typeof dateStr === 'string') {
      str = dateStr;
    } else if (dateStr instanceof Date) {
      return dateStr.getTime();
    } else if (typeof dateStr === 'object') {
      str = dateStr.date || dateStr.originalDueDate || (dateStr.completedAt ? String(dateStr.completedAt) : '') || '';
    } else {
      str = String(dateStr);
    }
    if (!str) return 0;
    if (str.includes('T')) {
      const ms = new Date(str).getTime();
      if (!isNaN(ms)) return ms;
    }
    const parts = str.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.getTime();
    }
    const ms = new Date(str).getTime();
    return isNaN(ms) ? 0 : ms;
  };

  // Check if a date string falls inside the chosen timeframe
  const isDateInTimeframe = useMemo(() => {
    // Reference now: 2026-09-06
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    // Monday of this week
    const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    const startOfThisWeek = todayMidnight - dayOfWeek * 86400000;
    const endOfThisWeek = startOfThisWeek + 7 * 86400000 - 1;

    // Last week
    const startOfLastWeek = startOfThisWeek - 7 * 86400000;
    const endOfLastWeek = startOfThisWeek - 1;

    // Past X days
    const past7DaysStart = todayMidnight - 7 * 86400000;
    const past14DaysStart = todayMidnight - 14 * 86400000;
    const past30DaysStart = todayMidnight - 30 * 86400000;

    // Start of this month
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return (dateStr?: string): boolean => {
      if (!dateStr || timeframe === 'all') return true;
      const ms = parseToMs(dateStr);
      if (ms === 0) return true;

      switch (timeframe) {
        case 'today':
          return dateStr.startsWith(todayStr);
        case 'this_week':
          return ms >= startOfThisWeek && ms <= endOfThisWeek;
        case 'last_week':
          return ms >= startOfLastWeek && ms <= endOfLastWeek;
        case 'past_7':
          return ms >= past7DaysStart;
        case 'past_14':
          return ms >= past14DaysStart;
        case 'past_30':
          return ms >= past30DaysStart;
        case 'this_month':
          return ms >= startOfThisMonth;
        case 'custom':
          if (!customStartDate && !customEndDate) return true;
          const startMs = customStartDate ? parseToMs(customStartDate) : 0;
          const endMs = customEndDate ? parseToMs(customEndDate) + 86400000 - 1 : Infinity;
          return ms >= startMs && ms <= endMs;
        default:
          return true;
      }
    };
  }, [timeframe, customStartDate, customEndDate]);

  // Calculate detailed points ledger for activeMember
  const memberAudit = useMemo(() => {
    if (!activeMember) return null;

    // Normalizing helper to match memberId across variants
    const matchId = (id?: string, name?: string) => {
      if (!id && !name) return false;
      const targetId = activeMember.id.toLowerCase();
      const targetNorm = targetId.replace(/^(mem_|member_)/, '');
      const itemNorm = (id || '').toLowerCase().replace(/^(mem_|member_)/, '');
      const idMatch = id === activeMember.id || (itemNorm && itemNorm === targetNorm);
      const nameMatch = name && name.toLowerCase().trim() === activeMember.name.toLowerCase().trim();
      return Boolean(idMatch || nameMatch);
    };

    // 1. ALL completed/approved chore logs
    const allCompletedLogs = logs.filter(l => matchId(l.memberId) && (l.status === 'approved' || (l as any).status === 'completed'));
    
    // Timeframe-filtered completed chore logs
    const completedLogs = allCompletedLogs.filter(l => isDateInTimeframe(l.date || l.completedAt));

    // Calculate all-time and timeframe points
    let allTimeChoreEarned = 0;
    let choreBasePoints = 0;
    let choreBonusPoints = 0;
    let choreLatenessDeductions = 0;

    allCompletedLogs.forEach(l => {
      const chore = chores.find(c => c.id === l.choreId);
      const base = l.pointsAwarded !== undefined ? l.pointsAwarded : (chore?.defaultPoints || 10);
      const bonus = l.bonusPoints || 0;
      allTimeChoreEarned += (base + bonus);
    });

    completedLogs.forEach(l => {
      const chore = chores.find(c => c.id === l.choreId);
      const base = l.pointsAwarded !== undefined ? l.pointsAwarded : (chore?.defaultPoints || 10);
      const bonus = l.bonusPoints || 0;
      choreBasePoints += base;
      choreBonusPoints += bonus;
      if (l.deductionApplied) {
        choreLatenessDeductions += l.deductionApplied;
      }
    });

    const timeframeChoreEarned = choreBasePoints + choreBonusPoints;

    // 2. Spent on reward claims (approved, pending or delivered)
    const allActiveClaims = claims.filter(c => matchId(c.memberId, c.memberName) && c.status !== 'rejected');
    const allTimePointsRedeemed = allActiveClaims.reduce((sum, c) => sum + (c.pointCost || 0), 0);

    const activeClaims = allActiveClaims.filter(c => isDateInTimeframe(c.claimedAt || c.deliveredAt));
    const timeframePointsRedeemed = activeClaims.reduce((sum, c) => sum + (c.pointCost || 0), 0);

    // 3. True net earned from chores minus redeemed rewards
    const allTimeNetChoresEarned = Math.max(0, allTimeChoreEarned - allTimePointsRedeemed);
    const timeframeNetEarned = timeframeChoreEarned - timeframePointsRedeemed;

    // 4. Current balance stored in profile
    const currentBalance = activeMember.currentPoints || 0;

    // 5. Exact variance between stored balance and verified chore ledger
    const variance = currentBalance - allTimeNetChoresEarned;

    // 6. Filter member-specific events from audit trail
    const allMemberEvents = events.filter(e => matchId(e.memberId, e.memberName) || e.memberId === 'all');
    const memberEvents = allMemberEvents.filter(e => isDateInTimeframe(e.createdAt));

    // 7. Lifetime XP calculations
    const lifetimeXP = activeMember.lifetimePoints || 0;
    const xpVariance = lifetimeXP - allTimeChoreEarned;

    return {
      allCompletedLogs,
      completedLogs,
      allActiveClaims,
      activeClaims,
      allMemberEvents,
      memberEvents,
      allTimeChoreEarned,
      choreBasePoints,
      choreBonusPoints,
      timeframeChoreEarned,
      choreLatenessDeductions,
      allTimePointsRedeemed,
      timeframePointsRedeemed,
      allTimeNetChoresEarned,
      timeframeNetEarned,
      currentBalance,
      variance,
      lifetimeXP,
      xpVariance,
    };
  }, [activeMember, logs, chores, claims, events, isDateInTimeframe]);

  // Unified audit ledger combining Chores, Redemptions, and Adjustments
  const unifiedLedgerItems = useMemo(() => {
    if (!memberAudit || !activeMember) return [];

    type UnifiedItem = {
      id: string;
      itemType: 'chore' | 'reward' | 'adjustment';
      title: string;
      category?: string;
      timestampStr: string;
      timestampMs: number;
      pointsDelta: number;
      grade?: string;
      bonusPoints?: number;
      status?: string;
      note?: string;
      parentNote?: string;
      pointsBefore?: number;
      pointsAfter?: number;
      originalItem: any;
    };

    const items: UnifiedItem[] = [];

    // Chores
    memberAudit.completedLogs.forEach(log => {
      const chore = chores.find(c => c.id === log.choreId);
      const base = log.pointsAwarded !== undefined ? log.pointsAwarded : (chore?.defaultPoints || 10);
      const bonus = log.bonusPoints || 0;
      const pts = base + bonus;
      const dateStr = log.date || (log.completedAt ? log.completedAt.slice(0, 10) : '2026-08-26');
      items.push({
        id: `chore_${log.id}`,
        itemType: 'chore',
        title: chore?.title || log.choreId,
        category: chore?.category || 'household',
        timestampStr: dateStr,
        timestampMs: parseToMs(log.completedAt || log.date),
        pointsDelta: pts,
        grade: log.qualityGrade || (log as any).inspectionGrade,
        bonusPoints: bonus,
        status: 'verified',
        note: log.notes,
        originalItem: log,
      });
    });

    // Rewards
    memberAudit.activeClaims.forEach(claim => {
      const dateStr = claim.claimedAt ? claim.claimedAt.slice(0, 10) : 'Recent';
      items.push({
        id: `claim_${claim.id}`,
        itemType: 'reward',
        title: claim.rewardTitle,
        category: 'reward',
        timestampStr: dateStr,
        timestampMs: parseToMs(claim.claimedAt),
        pointsDelta: -(claim.pointCost || 0),
        status: claim.status,
        note: claim.note,
        parentNote: claim.parentNote,
        originalItem: claim,
      });
    });

    // Adjustments
    memberAudit.memberEvents.forEach(evt => {
      const rawTime = evt.createdAt || evt.timestamp || (evt as any).date || '';
      let dateStr = 'Recent';
      if (typeof rawTime === 'string' && rawTime.trim()) {
        dateStr = rawTime.slice(0, 10);
      } else if (rawTime instanceof Date && !isNaN(rawTime.getTime())) {
        dateStr = rawTime.toISOString().slice(0, 10);
      } else if (typeof rawTime === 'number' && !isNaN(rawTime)) {
        dateStr = new Date(rawTime).toISOString().slice(0, 10);
      }
      items.push({
        id: `evt_${evt.id}`,
        itemType: 'adjustment',
        title: evt.reason || (evt.pointsDelta && evt.pointsDelta > 0 ? 'Point Bonus' : 'Point Adjustment'),
        timestampStr: dateStr,
        timestampMs: parseToMs(rawTime),
        pointsDelta: evt.pointsDelta !== undefined ? evt.pointsDelta : 0,
        status: evt.type,
        pointsBefore: evt.pointsBefore,
        pointsAfter: evt.pointsAfter,
        originalItem: evt,
      });
    });

    // Filter by Search Query
    let filtered = items;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(q) ||
        (item.note && item.note.toLowerCase().includes(q)) ||
        (item.parentNote && item.parentNote.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        item.timestampStr.toLowerCase().includes(q)
      );
    }

    // Filter by Active Tab
    if (activeTab === 'chores') {
      filtered = filtered.filter(item => item.itemType === 'chore');
    } else if (activeTab === 'rewards') {
      filtered = filtered.filter(item => item.itemType === 'reward');
    } else if (activeTab === 'events') {
      filtered = filtered.filter(item => item.itemType === 'adjustment');
    }

    // Sorting
    filtered.sort((a, b) => {
      if (sortOption === 'newest') {
        return b.timestampMs - a.timestampMs;
      } else if (sortOption === 'oldest') {
        return a.timestampMs - b.timestampMs;
      } else if (sortOption === 'highest_points') {
        return Math.abs(b.pointsDelta) - Math.abs(a.pointsDelta);
      } else if (sortOption === 'lowest_points') {
        return Math.abs(a.pointsDelta) - Math.abs(b.pointsDelta);
      }
      return 0;
    });

    return filtered;
  }, [memberAudit, activeMember, chores, searchQuery, activeTab, sortOption]);

  if (!isOpen || !activeMember || !memberAudit) return null;

  // Actions
  const handleApplyExactPoints = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customExactInput, 10);
    if (isNaN(parsed) || parsed < 0) return;
    
    soundFX.playStarChime(5);
    onSetMemberPoints(activeMember.id, parsed, undefined, parsed === 0 ? 'Reset balance to 0 pts' : `Manual balance set to ${parsed} pts`);
    setCustomExactInput('');
    setSaveSuccessMsg(`Balance for ${activeMember.name} set to ${parsed} pts!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleApplyExactXP = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customExactXPInput, 10);
    if (isNaN(parsed) || parsed < 0) return;

    soundFX.playStarChime(5);
    onSetMemberPoints(activeMember.id, activeMember.currentPoints || 0, parsed, 'Manual Lifetime XP update by Mom');
    setCustomExactXPInput('');
    setSaveSuccessMsg(`Lifetime XP for ${activeMember.name} set to ${parsed} XP!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleResetToVerified = () => {
    const verified = memberAudit.allTimeNetChoresEarned;
    soundFX.playComplete();
    onSetMemberPoints(
      activeMember.id, 
      verified, 
      undefined, 
      `Reconciled to verified chore earnings (${verified} pts)`
    );
    setSaveSuccessMsg(`Aligned ${activeMember.name}'s balance to verified net chores (${verified} pts)!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleAlignLifetimeXPToVerifiedChores = () => {
    const verifiedXP = memberAudit.allTimeChoreEarned;
    soundFX.playStarChime(5);
    onSetMemberPoints(
      activeMember.id,
      activeMember.currentPoints || 0,
      verifiedXP,
      `Aligned Lifetime XP to verified chore total (${verifiedXP} XP)`
    );
    setSaveSuccessMsg(`Aligned ${activeMember.name}'s Lifetime XP to verified chore earnings (${verifiedXP} XP)!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleSetZero = () => {
    soundFX.playPop();
    onSetMemberPoints(activeMember.id, 0, undefined, 'Reset balance to 0 pts');
    setSaveSuccessMsg(`Reset ${activeMember.name}'s balance to 0 pts!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleQuickDelta = (delta: number) => {
    soundFX.playRewardCoin();
    onAdjustPoints(activeMember.id, delta, quickAdjustReason || (delta > 0 ? 'Point bonus' : 'Point adjustment'));
    setSaveSuccessMsg(`${delta > 0 ? '+' : ''}${delta} pts applied to ${activeMember.name}!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-3xl max-h-[95vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden relative ${
          isGlassTheme(currentTheme)
            ? 'apple-glass-panel border-white/40 text-slate-900'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-900/20'
        }`}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 border border-amber-400/40 flex items-center justify-center text-xl shadow-xs shrink-0">
              ⭐
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  Points & Redemptions Audit Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Mom Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Click any metric card below to inspect all chores, redemptions, and XP logs
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFX.playPop();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Member Horizontal Selector */}
        <div className="px-3.5 sm:px-4 py-2 border-b border-slate-200/60 bg-slate-100/60 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0 mr-1 hidden sm:inline">
            Helper:
          </span>
          {members.map(member => {
            const isSelected = member.id === selectedMemberId;
            return (
              <button
                key={member.id}
                onClick={() => {
                  soundFX.playPop();
                  setSelectedMemberId(member.id);
                  setSaveSuccessMsg(null);
                  setExpandedItemId(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer min-h-[38px] active:scale-95 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm font-black ring-2 ring-slate-900/20'
                    : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <Avatar
                  photoUrl={member.avatarPhotoUrl}
                  emoji={member.avatarEmoji}
                  name={member.name}
                  size="xs"
                  showBorder={false}
                />
                <span>{member.name.split(' ')[0]}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                  isSelected ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-900'
                }`}>
                  ⭐ {member.currentPoints || 0}
                </span>
              </button>
            );
          })}
          {/* House Level & Experience Tab Button (User Request: Reset & Manually Set House XP) */}
          <button
            onClick={() => {
              soundFX.playPop();
              setSelectedMemberId('house_xp');
              setSaveSuccessMsg(null);
              setExpandedItemId(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer min-h-[38px] active:scale-95 border ${
              isHouseXpSelected
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm font-black ring-2 ring-amber-400/30'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
            }`}
          >
            <span className="text-base leading-none">🏡</span>
            <span>House Level & XP</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
              isHouseXpSelected ? 'bg-slate-900 text-white' : 'bg-white text-amber-950 shadow-2xs'
            }`}>
              Lv. {houseProg.currentLevel.level}
            </span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TIMEFRAME FILTER BAR (REQUESTED BY USER) - Hidden for House XP */}
        {/* ======================================================== */}
        {!isHouseXpSelected && (
          <div className="px-3.5 sm:px-4 py-2 bg-slate-50/90 border-b border-slate-200/70 flex items-center justify-between gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1 shrink-0 mr-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Timeframe:</span>
            </span>
            {(
              [
                { key: 'all', label: 'All Time' },
                { key: 'today', label: 'Today' },
                { key: 'this_week', label: 'This Week' },
                { key: 'last_week', label: 'Last Week' },
                { key: 'past_7', label: 'Past 7 Days' },
                { key: 'past_14', label: 'Past 14 Days' },
                { key: 'past_30', label: 'Past 30 Days' },
                { key: 'this_month', label: 'This Month' },
                { key: 'custom', label: 'Custom Dates' },
              ] as const
            ).map(opt => {
              const isSelected = timeframe === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setTimeframe(opt.key);
                    if (opt.key === 'custom') {
                      setShowCustomDateInputs(true);
                    } else {
                      setShowCustomDateInputs(false);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer min-h-[30px] ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-2xs font-black'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Timeframe Summary Badge */}
          {timeframe !== 'all' && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-900 border border-indigo-200">
                Period: +{memberAudit.timeframeChoreEarned} chore / -{memberAudit.timeframePointsRedeemed} rewards = {memberAudit.timeframeNetEarned >= 0 ? '+' : ''}{memberAudit.timeframeNetEarned} pts
              </span>
              <button
                type="button"
                onClick={() => {
                  setTimeframe('all');
                  setShowCustomDateInputs(false);
                }}
                className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Reset
              </button>
            </div>
          )}
        </div>
        )}

        {/* Custom Date Inputs if selected */}
        {!isHouseXpSelected && showCustomDateInputs && (
          <div className="px-4 py-2 bg-indigo-50/50 border-b border-indigo-100 flex items-center gap-3 text-xs shrink-0 flex-wrap">
            <span className="font-bold text-slate-700">From:</span>
            <input 
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-medium"
            />
            <span className="font-bold text-slate-700">To:</span>
            <input 
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-medium"
            />
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-3.5 sm:p-5 pt-3 overflow-y-auto space-y-4 flex-1">
          {/* Notification Toast Banner */}
          {saveSuccessMsg && (
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* HOUSE LEVEL & EXPERIENCE (XP) MANAGER (USER REQUEST)     */}
          {/* ======================================================== */}
          {isHouseXpSelected ? (
            <div className="space-y-4">
              {/* House Status Hero Card */}
              <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-indigo-500/10 border border-amber-300/80 shadow-sm relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center text-3xl shadow-md shrink-0">
                      {houseProg.currentLevel.badgeEmoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                          {householdInfo?.familyName || 'Our Family Home'}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white shadow-2xs">
                          House Lv. {houseProg.currentLevel.level}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mt-0.5">
                        {houseProg.currentLevel.title} • {houseProg.currentLevel.epicSubtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-amber-200/60">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Experience</span>
                    <span className="text-lg sm:text-xl font-black text-amber-900 dark:text-amber-200">
                      ⭐ {houseProg.totalHouseXp} XP
                    </span>
                  </div>
                </div>

                {/* Level Progress Bar */}
                <div className="mt-4 pt-3 border-t border-amber-200/60">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    <span>Progress to Level {houseProg.nextLevel ? houseProg.nextLevel.level : 'MAX'}</span>
                    <span>
                      {houseProg.nextLevel 
                        ? `${houseProg.xpInCurrentLevel} / ${houseProg.xpSpanForLevel} XP (${houseProg.levelProgressPercent}%)`
                        : 'Maximum Level Reached! 👑'}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-white/80 dark:bg-slate-800/80 rounded-full overflow-hidden p-0.5 shadow-inner border border-amber-200/50">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 transition-all duration-500"
                      style={{ width: `${houseProg.levelProgressPercent}%` }}
                    />
                  </div>
                  {houseProg.nextLevel && (
                    <div className="text-[11px] font-semibold text-slate-500 mt-1 flex items-center justify-between">
                      <span>Requires: {houseProg.nextLevel.minXp} XP</span>
                      <span className="text-amber-800 font-bold">{houseProg.pointsToNextLevel} XP needed</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Informational Box: Why was house XP high & how to reset */}
              <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-start gap-3">
                <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div className="text-xs text-sky-900 dark:text-sky-200 space-y-1">
                  <p className="font-bold">Why was House Level and Experience so high?</p>
                  <p className="opacity-90 leading-relaxed font-normal">
                    Previously, House Experience automatically summed every family member's lifetime points together (including initial parent demo points). 
                    You can now manually set the House XP to any exact number, or quickly reset it to Level 1 below!
                  </p>
                </div>
              </div>

              {/* Action 1: Set Custom Exact House XP */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Set Exact House Experience (XP)</span>
                  </h4>
                  <span className="text-[11px] font-medium text-slate-500">
                    Current: <strong>{houseProg.totalHouseXp} XP</strong>
                  </span>
                </div>

                <form onSubmit={handleApplyExactHouseXp} className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 0 to reset to Lv. 1, or 350 for Lv. 2"
                        value={customExactHouseXpInput}
                        onChange={(e) => setCustomExactHouseXpInput(e.target.value)}
                        className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                        XP
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={!customExactHouseXpInput.trim()}
                      className="px-4 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer shrink-0 active:scale-95"
                    >
                      Save House XP
                    </button>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                    <input
                      type="checkbox"
                      checked={resetHelpersLifetimeToo}
                      onChange={(e) => setResetHelpersLifetimeToo(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Also reset all helpers' individual Lifetime XP to stay in sync with this value
                    </span>
                  </label>
                </form>
              </div>

              {/* Action 2: Quick Presets & 1-Click Reset Buttons */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-rose-500" />
                  <span>1-Click Reset & Auto-Recalculate Presets</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Preset 1: Fresh Start Level 1 */}
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: 'Reset House to Level 1?',
                        description: 'This will set the House Experience back to 0 XP (Level 1: Cozy Starter Cottage), giving your family a clean progression slate.',
                        actionLabel: 'Reset to Level 1 (0 XP)',
                        actionColor: 'rose',
                        onConfirm: () => {
                          soundFX.playFanfare();
                          onSetHouseXp?.(0, resetHelpersLifetimeToo);
                          setConfirmDialog(null);
                          setSaveSuccessMsg('House reset to Level 1 (0 XP)!');
                          setTimeout(() => setSaveSuccessMsg(null), 3500);
                        }
                      });
                    }}
                    className="p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 hover:bg-rose-100/70 dark:bg-rose-950/20 text-left transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs font-black text-rose-900 dark:text-rose-200">
                      <span>Level 1 Starter</span>
                      <RotateCcw className="w-3.5 h-3.5 text-rose-600 group-hover:rotate-180 transition-transform duration-300" />
                    </div>
                    <div className="text-sm font-black text-rose-700 dark:text-rose-300 mt-1">
                      0 XP
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Start fresh at Cozy Starter Cottage
                    </p>
                  </button>

                  {/* Preset 2: Verified Chores Only */}
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: 'Sync House XP to Verified Chores?',
                        description: `This will recalculate House XP based strictly on points earned from approved/completed chores (${allVerifiedChoresTotal} XP).`,
                        actionLabel: `Set to ${allVerifiedChoresTotal} XP`,
                        actionColor: 'emerald',
                        onConfirm: () => {
                          soundFX.playFanfare();
                          onSetHouseXp?.(allVerifiedChoresTotal, resetHelpersLifetimeToo);
                          setConfirmDialog(null);
                          setSaveSuccessMsg(`House XP synced to verified chores (${allVerifiedChoresTotal} XP)!`);
                          setTimeout(() => setSaveSuccessMsg(null), 3500);
                        }
                      });
                    }}
                    className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 hover:bg-emerald-100/70 dark:bg-emerald-950/20 text-left transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs font-black text-emerald-900 dark:text-emerald-200">
                      <span>Verified Chores</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="text-sm font-black text-emerald-700 dark:text-emerald-300 mt-1">
                      {allVerifiedChoresTotal} XP
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Matches actual approved chore points
                    </p>
                  </button>

                  {/* Preset 3: Kids Only Lifetime XP */}
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: 'Calculate from Kids Only?',
                        description: `This ignores any parent accounts and sums only kids' lifetime XP (${kidsOnlyXp} XP).`,
                        actionLabel: `Set to ${kidsOnlyXp} XP`,
                        actionColor: 'amber',
                        onConfirm: () => {
                          soundFX.playFanfare();
                          onSetHouseXp?.(kidsOnlyXp, resetHelpersLifetimeToo);
                          setConfirmDialog(null);
                          setSaveSuccessMsg(`House XP set to kids' lifetime XP (${kidsOnlyXp} XP)!`);
                          setTimeout(() => setSaveSuccessMsg(null), 3500);
                        }
                      });
                    }}
                    className="p-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 hover:bg-amber-100/70 dark:bg-amber-950/20 text-left transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs font-black text-amber-900 dark:text-amber-200">
                      <span>Kids Only</span>
                      <Users className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="text-sm font-black text-amber-700 dark:text-amber-300 mt-1">
                      {kidsOnlyXp} XP
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Excludes parents, sums kids' lifetime points
                    </p>
                  </button>
                </div>
              </div>

              {/* Breakdown by Member */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  Family Members Contribution Breakdown
                </h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {members.map(m => {
                    const pct = houseProg.totalHouseXp > 0
                      ? Math.round(((m.lifetimePoints || 0) / houseProg.totalHouseXp) * 100)
                      : 0;
                    return (
                      <div key={m.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar member={m} photoUrl={m.avatarPhotoUrl} emoji={m.avatarEmoji} name={m.name} size="sm" showBorder={false} />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate">
                              {m.name}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {m.role === 'parent' ? 'Parent (Excluded from kids presets)' : `${m.age ? `Age ${m.age}` : 'Helper'}`}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-right">
                          <div>
                            <div className="font-black text-amber-900 dark:text-amber-200">
                              ⭐ {m.lifetimePoints || 0} XP
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold">
                              {pct}% of house
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-[11px]">
                            Balance: {m.currentPoints} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ======================================================== */}
              {/* 1. INTERACTIVE CLICKABLE METRIC CARDS (USER REQUEST)     */}
              {/* ======================================================== */}
              <div>
            <div className="flex items-center justify-between pb-1.5 px-0.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Click any metric to filter and inspect all records:
              </span>
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setActiveTab('all');
                }}
                className={`text-xs font-bold cursor-pointer transition-colors ${
                  activeTab === 'all' ? 'text-indigo-600 underline font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                View All Activity ({unifiedLedgerItems.length})
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Card 1: Current Balance */}
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setActiveTab('balance');
                }}
                className={`p-3.5 rounded-2xl text-center flex flex-col justify-center transition-all cursor-pointer relative group text-left sm:text-center ${
                  activeTab === 'balance'
                    ? 'bg-amber-100/90 border-2 border-amber-500 ring-2 ring-amber-400/30 shadow-md scale-[1.01]'
                    : 'bg-amber-50/70 hover:bg-amber-100/60 border border-amber-200 shadow-2xs hover:scale-[1.01]'
                }`}
              >
                <div className="flex items-center justify-between sm:justify-center gap-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-amber-800 block">
                    Current Balance
                  </span>
                  {activeTab === 'balance' && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 sm:hidden" />
                  )}
                </div>
                <span className="text-xl sm:text-2xl font-black text-amber-950 block py-0.5 leading-tight">
                  ⭐ {memberAudit.currentBalance}
                </span>
                <span className="text-[10px] text-amber-700 font-semibold flex items-center justify-center gap-1">
                  <span>Available to spend</span>
                  <ArrowRight className="w-2.5 h-2.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>

              {/* Card 2: Verified Chores */}
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setActiveTab('chores');
                }}
                className={`p-3.5 rounded-2xl text-center flex flex-col justify-center transition-all cursor-pointer relative group text-left sm:text-center ${
                  activeTab === 'chores'
                    ? 'bg-emerald-100/90 border-2 border-emerald-500 ring-2 ring-emerald-400/30 shadow-md scale-[1.01]'
                    : 'bg-emerald-50/70 hover:bg-emerald-100/60 border border-emerald-200 shadow-2xs hover:scale-[1.01]'
                }`}
              >
                <div className="flex items-center justify-between sm:justify-center gap-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800 block">
                    Verified Chores
                  </span>
                  {activeTab === 'chores' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 sm:hidden" />
                  )}
                </div>
                <span className="text-xl sm:text-2xl font-black text-emerald-950 block py-0.5 leading-tight">
                  +{timeframe === 'all' ? memberAudit.allTimeChoreEarned : memberAudit.timeframeChoreEarned}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center justify-center gap-1">
                  <span>{memberAudit.completedLogs.length} completed</span>
                  <ArrowRight className="w-2.5 h-2.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>

              {/* Card 3: Redeemed Rewards */}
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setActiveTab('rewards');
                }}
                className={`p-3.5 rounded-2xl text-center flex flex-col justify-center transition-all cursor-pointer relative group text-left sm:text-center ${
                  activeTab === 'rewards'
                    ? 'bg-purple-100/90 border-2 border-purple-500 ring-2 ring-purple-400/30 shadow-md scale-[1.01]'
                    : 'bg-purple-50/70 hover:bg-purple-100/60 border border-purple-200 shadow-2xs hover:scale-[1.01]'
                }`}
              >
                <div className="flex items-center justify-between sm:justify-center gap-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-purple-800 block">
                    Redeemed Rewards
                  </span>
                  {activeTab === 'rewards' && (
                    <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0 sm:hidden" />
                  )}
                </div>
                <span className="text-xl sm:text-2xl font-black text-purple-950 block py-0.5 leading-tight">
                  -{timeframe === 'all' ? memberAudit.allTimePointsRedeemed : memberAudit.timeframePointsRedeemed}
                </span>
                <span className="text-[10px] text-purple-700 font-semibold flex items-center justify-center gap-1">
                  <span>{memberAudit.activeClaims.length} claimed</span>
                  <ArrowRight className="w-2.5 h-2.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>

              {/* Card 4: Lifetime XP */}
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setActiveTab('xp');
                }}
                className={`p-3.5 rounded-2xl text-center flex flex-col justify-center transition-all cursor-pointer relative group text-left sm:text-center ${
                  activeTab === 'xp'
                    ? 'bg-blue-100/90 border-2 border-blue-500 ring-2 ring-blue-400/30 shadow-md scale-[1.01]'
                    : 'bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200 shadow-2xs hover:scale-[1.01]'
                }`}
              >
                <div className="flex items-center justify-between sm:justify-center gap-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-700 block">
                    Lifetime XP
                  </span>
                  {activeTab === 'xp' && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 sm:hidden" />
                  )}
                </div>
                <span className="text-xl sm:text-2xl font-black text-slate-900 block py-0.5 leading-tight">
                  🏆 {memberAudit.lifetimeXP}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                  <span>Audit XP & Level</span>
                  <ArrowRight className="w-2.5 h-2.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* TAB CONTENT A: BALANCE BREAKDOWN & EQUATION */}
          {/* ======================================================== */}
          {(activeTab === 'all' || activeTab === 'balance') && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-blue-50/70 border border-indigo-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-indigo-200/70 pb-2.5">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-600 shrink-0" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950">
                    Balance Equation for {activeMember.name}
                  </h3>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  memberAudit.variance === 0 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {memberAudit.variance === 0 ? '✓ Balanced Ledger' : `Variance: ${memberAudit.variance > 0 ? '+' : ''}${memberAudit.variance} pts`}
                </span>
              </div>

              {/* Visual Formula Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs font-bold items-center">
                <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100">
                  <span className="text-[10px] text-slate-500 block font-medium">All Verified Chores</span>
                  <span className="text-sm font-black text-emerald-600 block mt-0.5">+{memberAudit.allTimeChoreEarned} pts</span>
                  <span className="text-[10px] text-slate-400">({memberAudit.allCompletedLogs.length} tasks)</span>
                </div>

                <div className="text-slate-400 font-black text-base flex items-center justify-center">
                  <span>−</span>
                </div>

                <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100">
                  <span className="text-[10px] text-slate-500 block font-medium">Claimed Rewards</span>
                  <span className="text-sm font-black text-purple-600 block mt-0.5">-{memberAudit.allTimePointsRedeemed} pts</span>
                  <span className="text-[10px] text-slate-400">({memberAudit.allActiveClaims.length} rewards)</span>
                </div>

                <div className="text-slate-400 font-black text-base flex items-center justify-center">
                  <Equal className="w-4 h-4 text-indigo-400" />
                </div>

                <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-xs">
                  <span className="text-[10px] text-indigo-100 block font-medium">Verified Net Ledger</span>
                  <span className="text-sm font-black block mt-0.5">⭐ {memberAudit.allTimeNetChoresEarned} pts</span>
                  <span className="text-[10px] text-indigo-200">(True chore balance)</span>
                </div>
              </div>

              {/* Detailed Explanation */}
              <div className="bg-white/80 rounded-xl p-3 border border-indigo-100/80 text-xs text-slate-700 leading-relaxed space-y-2">
                <div className="flex items-center gap-1.5 font-black text-slate-900">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Why is the current balance {memberAudit.currentBalance} pts?</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  {memberAudit.variance === 0 ? (
                    <span>{activeMember.name}'s balance of <strong>{memberAudit.currentBalance} pts</strong> matches her verified chore earnings (+{memberAudit.allTimeChoreEarned} pts) minus claimed rewards (-{memberAudit.allTimePointsRedeemed} pts).</span>
                  ) : memberAudit.variance < 0 ? (
                    <span>
                      {activeMember.name}'s balance currently holds <strong>⭐ {memberAudit.currentBalance} points</strong>, which is <strong>{Math.abs(memberAudit.variance)} points lower</strong> than verified net earnings (⭐ {memberAudit.allTimeNetChoresEarned} pts). This difference stems from an initial starter balance override or earlier manual adjustment.
                    </span>
                  ) : (
                    <span>
                      {activeMember.name}'s account holds <strong>⭐ {memberAudit.currentBalance} points</strong>, which includes <strong>+{memberAudit.variance} points</strong> in starter demo points or manual bonus adjustments beyond verified chore earnings (⭐ {memberAudit.allTimeNetChoresEarned} pts).
                    </span>
                  )}
                </p>

                {/* 1-Click Reconciliation Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: `Align ${activeMember.name}'s Balance to Verified Chores?`,
                        description: `This will update ${activeMember.name}'s balance from ⭐ ${memberAudit.currentBalance} to exactly ⭐ ${memberAudit.allTimeNetChoresEarned} pts (based on +${memberAudit.allTimeChoreEarned} verified chores minus -${memberAudit.allTimePointsRedeemed} claimed rewards).`,
                        actionLabel: `Align to ${memberAudit.allTimeNetChoresEarned} pts`,
                        actionColor: 'emerald',
                        onConfirm: () => {
                          handleResetToVerified();
                          setConfirmDialog(null);
                        }
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Align to Verified Chores ({memberAudit.allTimeNetChoresEarned} pts)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: `Reset ${activeMember.name}'s Balance to 0 Points?`,
                        description: `This will clear ${activeMember.name}'s balance from ⭐ ${memberAudit.currentBalance} down to 0 for a completely fresh start. Completed chore records will remain in history.`,
                        actionLabel: 'Yes, Set to 0 pts',
                        actionColor: 'rose',
                        onConfirm: () => {
                          handleSetZero();
                          setConfirmDialog(null);
                        }
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to 0 pts (Fresh Start)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB CONTENT B: LIFETIME XP AUDIT (USER REQUEST: XP EVERYTHING) */}
          {/* ======================================================== */}
          {activeTab === 'xp' && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/80 border border-blue-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-blue-200/70 pb-2.5">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600 shrink-0" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-blue-950">
                    Lifetime XP & Level Audit ({activeMember.name})
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-300">
                  Level {activeMember.level || 1} Helper
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-white rounded-xl border border-blue-100 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Current Lifetime XP</span>
                  <span className="text-xl font-black text-blue-950 block my-0.5">🏆 {memberAudit.lifetimeXP} XP</span>
                  <span className="text-[10px] text-slate-500">Stored on helper profile</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-blue-100 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Verified Chore Earnings</span>
                  <span className="text-xl font-black text-emerald-600 block my-0.5">+{memberAudit.allTimeChoreEarned} XP</span>
                  <span className="text-[10px] text-slate-500">From {memberAudit.allCompletedLogs.length} approved chores</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-blue-100 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">XP Variance</span>
                  <span className={`text-xl font-black block my-0.5 ${
                    memberAudit.xpVariance === 0 ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {memberAudit.xpVariance === 0 ? '0 XP' : `${memberAudit.xpVariance > 0 ? '+' : ''}${memberAudit.xpVariance} XP`}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {memberAudit.xpVariance === 0 ? 'Exact 1:1 match' : 'Starter XP / bonus offset'}
                  </span>
                </div>
              </div>

              {/* XP Actions & Exact Editor */}
              <div className="bg-white/80 rounded-xl p-3 border border-blue-100 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-600 font-medium">
                    Lifetime XP tracks all-time progress across levels and rewards tiers.
                  </span>
                  <button
                    type="button"
                    onClick={handleAlignLifetimeXPToVerifiedChores}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Sync Lifetime XP to Verified Chores ({memberAudit.allTimeChoreEarned} XP)</span>
                  </button>
                </div>

                {/* Manual XP Form */}
                <form onSubmit={handleApplyExactXP} className="flex items-center gap-2 pt-1 border-t border-blue-100">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-blue-600">🏆</span>
                    <input
                      type="number"
                      min="0"
                      max="99999"
                      placeholder={`Set exact Lifetime XP for ${activeMember.name} (currently ${activeMember.lifetimePoints || 0})...`}
                      value={customExactXPInput}
                      onChange={(e) => setCustomExactXPInput(e.target.value)}
                      className="w-full text-xs font-bold pl-8 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!customExactXPInput.trim()}
                    className="px-3.5 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white cursor-pointer active:scale-95 transition-all whitespace-nowrap min-h-[36px]"
                  >
                    Set XP
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. THE COMPLETE ACTIVITY & AUDIT LEDGER (USER REQUEST) */}
          {/* ======================================================== */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-2xs">
            {/* Filter & Search Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {activeTab === 'chores' ? 'Verified Chore Logs' :
                       activeTab === 'rewards' ? 'Reward Redemptions Log' :
                       activeTab === 'events' ? 'Adjustments & Events Log' :
                       'Complete Activity & Redemptions Log'}
                    </span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                    Showing all {unifiedLedgerItems.length} records
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Every chore, claimed reward, and point adjustment recorded for {activeMember.name}
                </p>
              </div>

              {/* Category Filter Buttons */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setActiveTab('all');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({memberAudit.completedLogs.length + memberAudit.activeClaims.length + memberAudit.memberEvents.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setActiveTab('chores');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'chores'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  Chores ({memberAudit.completedLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setActiveTab('rewards');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'rewards'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                  }`}
                >
                  Redemptions ({memberAudit.activeClaims.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setActiveTab('events');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'events'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  Adjustments ({memberAudit.memberEvents.length})
                </button>
              </div>
            </div>

            {/* Search and Sort Toolbar */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by chore, reward title, date (e.g. 2026-08-27)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-1.5 shrink-0 text-xs">
                <span className="text-slate-400 font-bold hidden sm:inline">Sort:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest_points">Highest Points</option>
                  <option value="lowest_points">Lowest Points</option>
                </select>
              </div>
            </div>

            {/* Full Audit List (ALL records with NO 4-item cutoff!) */}
            <div className="max-h-[380px] overflow-y-auto pr-1 divide-y divide-slate-100 space-y-1">
              {unifiedLedgerItems.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <FileText className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-600">
                    No transactions match your current filters.
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Try switching timeframe to "All Time" or clearing your search.
                  </p>
                  {(timeframe !== 'all' || searchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setTimeframe('all');
                        setSearchQuery('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                unifiedLedgerItems.map((item) => {
                  const isExpanded = expandedItemId === item.id;
                  const isChore = item.itemType === 'chore';
                  const isReward = item.itemType === 'reward';
                  const isAdjustment = item.itemType === 'adjustment';

                  return (
                    <div 
                      key={item.id}
                      className={`py-2.5 px-2 rounded-xl transition-colors cursor-pointer ${
                        isExpanded ? 'bg-slate-50/90' : 'hover:bg-slate-50/60'
                      }`}
                      onClick={() => {
                        soundFX.playPop();
                        setExpandedItemId(isExpanded ? null : item.id);
                      }}
                    >
                      <div className="flex items-center justify-between gap-2.5 text-xs">
                        {/* Icon & Title */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                            isChore ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            isReward ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                            'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {isChore ? '✓' : isReward ? '🎁' : '⚙️'}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-slate-800 truncate">
                                {item.title}
                              </span>
                              {isChore && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Chore Verified
                                </span>
                              )}
                              {isReward && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                                  Reward Claimed ({item.status})
                                </span>
                              )}
                              {isAdjustment && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                                  Parent Adjustment
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium mt-0.5 flex-wrap">
                              <span>{item.timestampStr}</span>
                              {item.grade && (
                                <span className="text-amber-700 font-bold bg-amber-50 px-1 rounded">
                                  Grade {item.grade}
                                </span>
                              )}
                              {item.bonusPoints && item.bonusPoints > 0 ? (
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded">
                                  +{item.bonusPoints} inspection bonus
                                </span>
                              ) : null}
                              {item.parentNote && (
                                <span className="text-slate-600 italic truncate max-w-[200px]">
                                  "{item.parentNote}"
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Points Badge & Expand Indicator */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                            item.pointsDelta > 0 
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                              : item.pointsDelta < 0
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.pointsDelta > 0 ? `+${item.pointsDelta}` : item.pointsDelta} pts
                          </span>
                          <button
                            type="button"
                            className="text-slate-400 hover:text-slate-600 p-0.5"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Details Drawer */}
                      {isExpanded && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 text-[11px] text-slate-600 space-y-1.5 animate-in fade-in">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block">Type</span>
                              <span className="font-black text-slate-800 capitalize">{item.itemType}</span>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block">Date Logged</span>
                              <span className="font-bold text-slate-800">{item.timestampStr}</span>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block">Points Impact</span>
                              <span className={`font-black ${item.pointsDelta >= 0 ? 'text-emerald-600' : 'text-purple-600'}`}>
                                {item.pointsDelta > 0 ? `+${item.pointsDelta}` : item.pointsDelta} pts
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block">Audit Status</span>
                              <span className="font-black text-emerald-700">Verified by Mom</span>
                            </div>
                          </div>

                          {isReward && item.originalItem && (
                            <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-200/80 text-purple-950 space-y-1">
                              <p className="font-bold">Redemption Details:</p>
                              <p>Reward Item: <strong>{item.originalItem.rewardTitle}</strong></p>
                              <p>Points Deducted: <strong>{item.originalItem.pointCost} pts</strong></p>
                              <p>Fulfillment Status: <strong className="capitalize">{item.originalItem.status}</strong></p>
                              {item.originalItem.note && <p>Helper Note: "{item.originalItem.note}"</p>}
                              {item.originalItem.parentNote && <p>Parent Review Note: "{item.originalItem.parentNote}"</p>}
                            </div>
                          )}

                          {isChore && item.originalItem && (
                            <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/80 text-emerald-950 space-y-1">
                              <p className="font-bold">Verification Details:</p>
                              <p>Base Chore Points: <strong>{item.originalItem.pointsAwarded ?? 10} pts</strong></p>
                              {item.originalItem.bonusPoints ? (
                                <p>Inspection Bonus: <strong>+{item.originalItem.bonusPoints} pts (Grade {item.originalItem.qualityGrade || 'A'})</strong></p>
                              ) : null}
                              {item.originalItem.notes && <p>Chore Notes: "{item.originalItem.notes}"</p>}
                            </div>
                          )}

                          {isAdjustment && item.originalItem && (
                            <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80 text-amber-950 space-y-1">
                              <p className="font-bold">Adjustment Audit Details:</p>
                              <p>Reason: <strong>{item.originalItem.reason}</strong></p>
                              {item.originalItem.pointsBefore !== undefined && (
                                <p>Balance Transition: <strong>{item.originalItem.pointsBefore} pts → {item.originalItem.pointsAfter} pts</strong></p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* 3. DIRECT BALANCE ADJUSTMENTS FOR MOM */}
          {/* ======================================================== */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Adjust Points Manually</span>
              </h3>
              <span className="text-[11px] text-slate-500">Syncs immediately</span>
            </div>

            {/* Exact Balance Input */}
            <form onSubmit={handleApplyExactPoints} className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-amber-600">⭐</span>
                <input
                  type="number"
                  min="0"
                  max="99999"
                  placeholder={`Set exact points for ${activeMember.name} (currently ${activeMember.currentPoints})...`}
                  value={customExactInput}
                  onChange={(e) => setCustomExactInput(e.target.value)}
                  className="w-full text-xs font-bold pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <button
                type="submit"
                disabled={!customExactInput.trim()}
                className="px-4 py-2.5 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white cursor-pointer active:scale-95 transition-all whitespace-nowrap min-h-[40px] flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Exact</span>
              </button>
            </form>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Quick Add/Subtract:</span>
              <button
                type="button"
                onClick={() => handleQuickDelta(10)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer active:scale-95 min-h-[32px]"
              >
                +10 pts
              </button>
              <button
                type="button"
                onClick={() => handleQuickDelta(25)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer active:scale-95 min-h-[32px]"
              >
                +25 pts
              </button>
              <button
                type="button"
                onClick={() => handleQuickDelta(50)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer active:scale-95 min-h-[32px]"
              >
                +50 pts
              </button>
              <button
                type="button"
                onClick={() => handleQuickDelta(-10)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer active:scale-95 min-h-[32px]"
              >
                -10 pts
              </button>
              <button
                type="button"
                onClick={() => handleQuickDelta(-25)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer active:scale-95 min-h-[32px]"
              >
                -25 pts
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 4. FAMILY-WIDE CLEAN SLATE CONTROLS */}
          {/* ======================================================== */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>Family-Wide Point Resets & Sync</span>
              </p>
              <p className="text-xs text-amber-800 font-medium mt-0.5">
                Apply a clean slate or remove demo seed points across all household members.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {/* Option A: Reset Everyone to 0 */}
              <button
                type="button"
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Reset ALL Family Members to 0 Points?',
                    description: 'This will reset current points to 0 for everyone (Ashbelle, Hilda, Layla, Mani, etc.) so your family can start chore earnings completely from scratch.',
                    actionLabel: 'Reset All Family to 0 pts',
                    actionColor: 'rose',
                    onConfirm: () => {
                      onResetAllSeedPoints();
                      setSaveSuccessMsg('All family balances have been reset to 0 points!');
                      setTimeout(() => setSaveSuccessMsg(null), 3500);
                      setConfirmDialog(null);
                    }
                  });
                }}
                className="p-3 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-left transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center justify-between text-xs font-black text-rose-700">
                  <span>Reset All to 0 pts</span>
                  <RotateCcw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  Clean slate: Sets all family balances to 0 points.
                </p>
              </button>

              {/* Option B: Sync Everyone to Verified Chores */}
              <button
                type="button"
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Sync All Family to Verified Chores?',
                    description: 'Calculates every member\'s verified completed chores minus claimed rewards, and updates their balance accordingly. All unearned demo seed points will be removed.',
                    actionLabel: 'Sync All to Verified Chores',
                    actionColor: 'amber',
                    onConfirm: () => {
                      if (onResetAllToVerified) {
                        onResetAllToVerified();
                      }
                      setSaveSuccessMsg('All family balances synchronized with verified chore logs!');
                      setTimeout(() => setSaveSuccessMsg(null), 3500);
                      setConfirmDialog(null);
                    }
                  });
                }}
                className="p-3 rounded-xl bg-white hover:bg-amber-50 border border-amber-300 text-left transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center justify-between text-xs font-black text-amber-900">
                  <span>Sync to Verified Chores</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  Keeps real chore earnings and wipes demo seed points.
                </p>
              </button>

              {/* Option C: Reset House Level & XP (User Request) */}
              <button
                type="button"
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Reset House Level & XP to 0?',
                    description: 'This will reset the Household Experience to 0 XP (Level 1: Starter Cottage).',
                    actionLabel: 'Reset House XP',
                    actionColor: 'rose',
                    onConfirm: () => {
                      soundFX.playFanfare();
                      onSetHouseXp?.(0);
                      setSaveSuccessMsg('House Level & XP reset to Level 1 (0 XP)!');
                      setTimeout(() => setSaveSuccessMsg(null), 3500);
                      setConfirmDialog(null);
                    }
                  });
                }}
                className="p-3 rounded-xl bg-white hover:bg-amber-50 border border-amber-400 text-left transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center justify-between text-xs font-black text-amber-900">
                  <span>Reset House XP (Lv. 1)</span>
                  <Home className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  Resets house level from {houseProg.currentLevel.level} back to 1.
                </p>
              </button>
            </div>
          </div>
        </>
      )}
    </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-semibold">
            {isHouseXpSelected ? (
              <span>🏡 Household: <strong>{householdInfo?.familyName || 'Family'}</strong> (Lv. {houseProg.currentLevel.level} • {houseProg.totalHouseXp} XP)</span>
            ) : (
              <span>Active: <strong>{activeMember.name}</strong> (⭐ {activeMember.currentPoints} pts, 🏆 {activeMember.lifetimePoints || 0} XP)</span>
            )}
          </span>
          <button
            onClick={() => {
              soundFX.playPop();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-black bg-slate-900 text-white hover:bg-slate-800 cursor-pointer active:scale-95 transition-all min-h-[38px]"
          >
            Done
          </button>
        </div>

        {/* ======================================================== */}
        {/* CUSTOM IN-APP CONFIRMATION DIALOG */}
        {/* ======================================================== */}
        {confirmDialog && confirmDialog.isOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-sm bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="space-y-1.5">
                <h4 className="text-sm font-black text-slate-900">
                  {confirmDialog.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {confirmDialog.description}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDialog.onConfirm}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black text-white cursor-pointer transition-all active:scale-95 shadow-2xs ${
                    confirmDialog.actionColor === 'rose'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : confirmDialog.actionColor === 'emerald'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {confirmDialog.actionLabel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
