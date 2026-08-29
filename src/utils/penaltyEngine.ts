import { 
  Chore, 
  ChoreAssignmentLog, 
  HouseholdMember, 
  HouseholdPenaltySettings, 
  PersonStatusType, 
  QualityGradeMultipliers 
} from '../types';

export const DEFAULT_PENALTY_SETTINGS: HouseholdPenaltySettings = {
  timezone: typeof Intl !== 'undefined' && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles' : 'America/Los_Angeles',
  shipDate: '2026-08-29T00:00:00.000Z',
  allowNegativeBalance: false,
  latenessTiers: {
    tier1MaxDays: 1, // < 1 day late -> earns 75%
    tier1Multiplier: 0.75,
    tier2MaxDays: 2, // 1 to 2 days late -> earns 50%
    tier2Multiplier: 0.50,
    tier3MaxDays: 6, // 3 to 6 days late -> earns 0%, 25% balance deduction
    tier3Multiplier: 0.0,
    tier3DeductionPercent: 0.25,
    tier4MinDays: 7, // 7+ days late / Missed -> earns 0%, 100% balance deduction
    tier4Multiplier: 0.0,
    tier4DeductionPercent: 1.00,
  },
  gradeMultipliers: {
    'A+': 1.00,
    'A': 0.90,
    'B': 0.75,
    'C': 0.50,
    'Redo': 0.00,
  },
};

/**
 * Parses a date string (YYYY-MM-DD) into midnight in the target timezone or local.
 */
export function parseDateInTimezone(dateStr: string, timeStr?: string): Date {
  const parts = dateStr.split('-').map(Number);
  const year = parts[0];
  const month = parts[1] - 1;
  const day = parts[2];

  let hours = 23;
  let minutes = 59;
  let seconds = 59;

  if (timeStr && timeStr.includes(':')) {
    const [h, m] = timeStr.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      hours = h;
      minutes = m;
      seconds = 0;
    }
  }

  return new Date(year, month, day, hours, minutes, seconds);
}

/**
 * Calculates whole calendar days late.
 */
export function calculateDaysLate(
  choreDateStr: string,
  extendedDateStr?: string,
  scheduledTime?: string,
  _shipDateStr?: string
): number {
  const now = new Date();
  const effectiveDueDateStr = extendedDateStr || choreDateStr;
  const dueDate = parseDateInTimezone(effectiveDueDateStr, scheduledTime);

  // If due date and time is in the future, 0 days late
  if (now.getTime() <= dueDate.getTime()) {
    return 0;
  }

  // Calculate calendar days passed between the due date and today
  const dueParts = effectiveDueDateStr.split('-').map(Number);
  const dueMidnight = new Date(dueParts[0], dueParts[1] - 1, dueParts[2], 0, 0, 0, 0);
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  const diffMs = todayMidnight.getTime() - dueMidnight.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export interface PenaltyTierDetail {
  tier: number; // 0 (on-time), 1 (<1d), 2 (1-2d), 3 (3-6d), 4 (7+d / Missed)
  earnMultiplier: number;
  deductionPercent: number;
  deductionPoints: number;
  earnPoints: number;
  tierLabel: string;
  nextWorseningNotice: string | null;
  severityColor: string;
}

/**
 * Computes the penalty tier and forecast for a specific chore.
 */
export function getPenaltyTierInfo(
  daysLate: number,
  basePoints: number,
  isMissed: boolean = false,
  isWaived: boolean = false,
  settings: HouseholdPenaltySettings = DEFAULT_PENALTY_SETTINGS
): PenaltyTierDetail {
  if (isWaived) {
    return {
      tier: 0,
      earnMultiplier: 1.0,
      deductionPercent: 0,
      deductionPoints: 0,
      earnPoints: basePoints,
      tierLabel: 'Waived (100% Points)',
      nextWorseningNotice: null,
      severityColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    };
  }

  if (isMissed || daysLate >= settings.latenessTiers.tier4MinDays) {
    const deduction = Math.round(basePoints * settings.latenessTiers.tier4DeductionPercent);
    return {
      tier: 4,
      earnMultiplier: settings.latenessTiers.tier4Multiplier,
      deductionPercent: settings.latenessTiers.tier4DeductionPercent,
      deductionPoints: deduction,
      earnPoints: 0,
      tierLabel: 'Missed / 7+ Days Late (-100% Penalty)',
      nextWorseningNotice: 'Maximum penalty reached',
      severityColor: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/60 dark:border-rose-800',
    };
  }

  if (daysLate >= 3 && daysLate <= settings.latenessTiers.tier3MaxDays) {
    const deduction = Math.round(basePoints * settings.latenessTiers.tier3DeductionPercent);
    const daysUntilTier4 = settings.latenessTiers.tier4MinDays - daysLate;
    return {
      tier: 3,
      earnMultiplier: settings.latenessTiers.tier3Multiplier,
      deductionPercent: settings.latenessTiers.tier3DeductionPercent,
      deductionPoints: deduction,
      earnPoints: 0,
      tierLabel: `${daysLate}d Late: 0% Earn & -25% Balance`,
      nextWorseningNotice: `Drops to -100% deduction in ${daysUntilTier4} day${daysUntilTier4 > 1 ? 's' : ''}`,
      severityColor: 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/50',
    };
  }

  if (daysLate >= 1 && daysLate <= settings.latenessTiers.tier2MaxDays) {
    const earnPoints = Math.round(basePoints * settings.latenessTiers.tier2Multiplier);
    return {
      tier: 2,
      earnMultiplier: settings.latenessTiers.tier2Multiplier,
      deductionPercent: 0,
      deductionPoints: 0,
      earnPoints,
      tierLabel: `${daysLate}d Late: Earn 50% (${earnPoints} pts)`,
      nextWorseningNotice: 'Drops to 0% earn + 25% penalty after 3 days late',
      severityColor: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/50',
    };
  }

  if (daysLate > 0 && daysLate < settings.latenessTiers.tier1MaxDays) {
    const earnPoints = Math.round(basePoints * settings.latenessTiers.tier1Multiplier);
    return {
      tier: 1,
      earnMultiplier: settings.latenessTiers.tier1Multiplier,
      deductionPercent: 0,
      deductionPoints: 0,
      earnPoints,
      tierLabel: `< 1d Late: Earn 75% (${earnPoints} pts)`,
      nextWorseningNotice: 'Drops to 50% tomorrow',
      severityColor: 'text-amber-600 bg-amber-50/80 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40',
    };
  }

  return {
    tier: 0,
    earnMultiplier: 1.0,
    deductionPercent: 0,
    deductionPoints: 0,
    earnPoints: basePoints,
    tierLabel: 'On Time (100% Points)',
    nextWorseningNotice: null,
    severityColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  };
}

/**
 * Calculates stacked points awarded during inspection:
 * (Base Points * Lateness Multiplier * Quality Grade Multiplier)
 */
export function calculateInspectionAward(
  basePoints: number,
  qualityGrade: 'A+' | 'A' | 'B' | 'C' | 'Redo',
  daysLate: number,
  isWaived: boolean = false,
  settings: HouseholdPenaltySettings = DEFAULT_PENALTY_SETTINGS
): {
  finalPoints: number;
  latenessMultiplier: number;
  qualityMultiplier: number;
  isRedo: boolean;
} {
  const qualityMultiplier = settings.gradeMultipliers[qualityGrade] ?? 1.0;
  if (qualityGrade === 'Redo') {
    return {
      finalPoints: 0,
      latenessMultiplier: 0,
      qualityMultiplier: 0,
      isRedo: true,
    };
  }

  const tierInfo = getPenaltyTierInfo(daysLate, basePoints, false, isWaived, settings);
  const latenessMultiplier = tierInfo.earnMultiplier;
  const finalPoints = Math.max(0, Math.round(basePoints * latenessMultiplier * qualityMultiplier));

  return {
    finalPoints,
    latenessMultiplier,
    qualityMultiplier,
    isRedo: false,
  };
}

/**
 * Helper to determine if a chore was scheduled for a given date.
 */
export function isChoreScheduledForDate(chore: Chore, dateStr: string): boolean {
  if (!chore.isActive) return false;
  const date = parseDateInTimezone(dateStr);
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  if (chore.frequency === 'daily') return true;
  if (chore.frequency === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (chore.frequency === 'weekends') return dayOfWeek === 0 || dayOfWeek === 6;
  if (chore.frequency === 'weekly' || chore.frequency === 'custom_days') {
    return chore.scheduledDays ? chore.scheduledDays.includes(dayOfWeek) : false;
  }
  return false;
}

/**
 * Formats YYYY-MM-DD for N days relative to today.
 */
export function getRelativeDateStr(daysOffset: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface OverdueChoreItem {
  chore: Chore;
  log?: ChoreAssignmentLog;
  originalDueDate: string;
  effectiveDueDate: string;
  daysLate: number;
  isRedo: boolean;
  isMissed: boolean;
  isWaived: boolean;
  tierInfo: PenaltyTierDetail;
}

export interface PersonStatusSummary {
  member: HouseholdMember;
  status: PersonStatusType;
  overdueCount: number;
  redoCount: number;
  totalUnresolvedCount: number;
  oldestDaysLate: number;
  pointsAtRisk: number;
  summaryLine: string;
  overdueItems: OverdueChoreItem[];
  onTimeDoneCount: number;
  totalDueThisWeek: number;
}

/**
 * Analyzes a family member's current status for this week.
 * Definitions:
 * - Overdue: due date/time has passed and chore has not passed inspection.
 * - Days late: whole calendar days past due date.
 * - Redo: failed inspection, returns to kid's list and stays late by original due date.
 * - On track: everything due so far is done, passed, and on time.
 * - Behind: 1+ Overdue or Redo.
 * - Way behind: any chore >= 3 days late, or 3+ Overdue.
 */
export function evaluateMemberStatusThisWeek(
  member: HouseholdMember,
  chores: Chore[],
  logs: ChoreAssignmentLog[],
  settings: HouseholdPenaltySettings = DEFAULT_PENALTY_SETTINGS,
  lookbackDays: number = 7
): PersonStatusSummary {
  const memberChores = chores.filter(c => c.assignedMemberId === member.id && c.isActive);
  const todayStr = getRelativeDateStr(0);

  const overdueItems: OverdueChoreItem[] = [];
  let onTimeDoneCount = 0;
  let totalDueThisWeek = 0;

  // Check the past 7 days (including today)
  for (let i = lookbackDays; i >= 0; i--) {
    const dateStr = getRelativeDateStr(-i);
    const isToday = i === 0;

    for (const chore of memberChores) {
      if (!isChoreScheduledForDate(chore, dateStr)) continue;

      totalDueThisWeek++;
      const log = logs.find(l => l.choreId === chore.id && l.date === dateStr && l.memberId === member.id);

      const isApproved = log?.status === 'approved';
      const isWaived = Boolean(log?.penaltyWaived);
      const isNeedsRedo = log?.status === 'needs_redo';
      const isCompletedWaiting = log?.status === 'needs_review';
      const isPending = !log || log.status === 'pending';

      if (isApproved || isWaived) {
        // Checked and passed inspection or waived by parent
        if ((log?.daysLate || 0) === 0 || isWaived) {
          onTimeDoneCount++;
        }
        continue;
      }

      // If it's today and still pending, check if time has passed
      if (isToday && !isNeedsRedo && !isCompletedWaiting) {
        // Today's pending chores are not late until midnight / past due
        const now = new Date();
        const dueDate = parseDateInTimezone(dateStr, chore.scheduledTime);
        if (now.getTime() <= dueDate.getTime()) {
          continue; // still due today, not yet overdue
        }
      }

      // It is Overdue or Needs Redo
      const originalDueDate = log?.originalDueDate || dateStr;
      const effectiveDueDate = log?.extendedDueDate || originalDueDate;
      const isMissed = Boolean(log?.isMissed);

      const daysLate = calculateDaysLate(
        originalDueDate,
        log?.extendedDueDate,
        chore.scheduledTime,
        settings.shipDate
      );

      // If due date was extended to the future, it is not late
      if (daysLate === 0 && !isNeedsRedo) {
        continue;
      }

      const tierInfo = getPenaltyTierInfo(
        daysLate,
        chore.defaultPoints,
        isMissed,
        isWaived,
        settings
      );

      overdueItems.push({
        chore,
        log,
        originalDueDate,
        effectiveDueDate,
        daysLate,
        isRedo: isNeedsRedo,
        isMissed,
        isWaived,
        tierInfo,
      });
    }
  }

  // Sort overdue items by days late (highest first)
  overdueItems.sort((a, b) => b.daysLate - a.daysLate);

  const overdueCount = overdueItems.filter(item => !item.isRedo).length;
  const redoCount = overdueItems.filter(item => item.isRedo).length;
  const totalUnresolved = overdueItems.length;

  const oldestDaysLate = overdueItems.length > 0 ? overdueItems[0].daysLate : 0;
  const pointsAtRisk = overdueItems.reduce((sum, item) => {
    return sum + (item.tierInfo.deductionPoints > 0 ? item.tierInfo.deductionPoints : item.chore.defaultPoints);
  }, 0);

  let status: PersonStatusType = 'on_track';
  if (oldestDaysLate >= 3 || overdueCount >= 3) {
    status = 'way_behind';
  } else if (totalUnresolved > 0) {
    status = 'behind';
  }

  let summaryLine = totalDueThisWeek === 0 ? 'No pending chores · All caught up! ⭐' : 'All chores on time & complete! ⭐';
  if (status === 'way_behind') {
    summaryLine = `${totalUnresolved} overdue · oldest ${oldestDaysLate}d late · ${pointsAtRisk} pts at risk`;
  } else if (status === 'behind') {
    summaryLine = `${totalUnresolved} behind · ${oldestDaysLate > 0 ? `${oldestDaysLate}d late · ` : ''}${pointsAtRisk} pts at risk`;
  }

  return {
    member,
    status,
    overdueCount,
    redoCount,
    totalUnresolvedCount: totalUnresolved,
    oldestDaysLate,
    pointsAtRisk,
    summaryLine,
    overdueItems,
    onTimeDoneCount,
    totalDueThisWeek,
  };
}

/**
 * Evaluates the entire household's overall on-track status.
 */
export function evaluateHouseholdStatus(
  members: HouseholdMember[],
  chores: Chore[],
  logs: ChoreAssignmentLog[],
  settings: HouseholdPenaltySettings = DEFAULT_PENALTY_SETTINGS
) {
  const memberSummaries = members.map(m => evaluateMemberStatusThisWeek(m, chores, logs, settings));

  // Behind members sorted worst first (way_behind first, then by highest days late, then overdue count)
  const behindMembers = memberSummaries
    .filter(s => s.status !== 'on_track')
    .sort((a, b) => {
      if (a.status === 'way_behind' && b.status !== 'way_behind') return -1;
      if (b.status === 'way_behind' && a.status !== 'way_behind') return 1;
      if (b.oldestDaysLate !== a.oldestDaysLate) return b.oldestDaysLate - a.oldestDaysLate;
      return b.totalUnresolvedCount - a.totalUnresolvedCount;
    });

  const onTrackMembers = memberSummaries.filter(s => s.status === 'on_track');

  const totalOverdue = memberSummaries.reduce((acc, s) => acc + s.overdueCount, 0);
  const totalRedo = memberSummaries.reduce((acc, s) => acc + s.redoCount, 0);
  const totalDue = memberSummaries.reduce((acc, s) => acc + s.totalDueThisWeek, 0);
  const totalOnTimeDone = memberSummaries.reduce((acc, s) => acc + s.onTimeDoneCount, 0);

  // Awaiting inspection logs
  const awaitingInspectionCount = logs.filter(l => l.status === 'needs_review').length;

  const onTrackPercent = totalDue > 0 ? Math.round((totalOnTimeDone / totalDue) * 100) : 100;

  return {
    onTrackPercent,
    totalOverdue,
    totalRedo,
    awaitingInspectionCount,
    behindMembers,
    onTrackMembers,
    allMemberSummaries: memberSummaries,
  };
}

/**
 * Returns ISO week number.
 */
export function getISOWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
