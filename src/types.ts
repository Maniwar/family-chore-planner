export type MemberRole = 'parent' | 'child' | 'teen' | 'other';

export interface HouseholdMember {
  id: string;
  name: string;
  role: MemberRole;
  avatarColor: string; // Tailwind color class or hex
  avatarEmoji: string;
  avatarPhotoUrl?: string; // Optional uploaded profile photo (data URL / image URL)
  birthDate?: string; // ISO YYYY-MM-DD for dynamic forward aging
  age?: number;
  currentPoints: number;
  lifetimePoints: number;
  starsCount: number;
  targetWeeklyPoints: number;
  streakDays: number;
}

export interface HouseholdInfo {
  familyName: string; // e.g. "The Berenji Family" or "Our Family Home"
  housePhotoUrl?: string; // Uploaded home facade / house picture
  houseAddressOrMotto?: string; // e.g. "Happy & Clean Home"
  householdCode?: string; // 6-character cloud sync code e.g. "HOME-4921"
  householdId?: string; // Active Cloud household ID
  isCloudSynced?: boolean;
  adminPin?: string; // Cloud-synced 4-digit Parent/Mom mode PIN
  pinProtectionEnabled?: boolean;
}

export type ChoreCategory = 
  | 'Kitchen'
  | 'Living Room'
  | 'Bedrooms'
  | 'Bathrooms'
  | 'Pets'
  | 'Laundry'
  | 'Yard & Outdoor'
  | 'Daily Routine'
  | 'General';

export type ChoreFrequency = 
  | 'daily'
  | 'weekdays'
  | 'weekends'
  | 'weekly'
  | 'custom_days'
  | 'as_needed';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'bedtime' | 'anytime';

export interface Chore {
  id: string;
  title: string;
  description: string;
  category: ChoreCategory;
  assignedMemberId: string; // 'unassigned' or default memberId
  dayAssignments?: { [dayOfWeek: number]: string }; // 0=Sun, 1=Mon, ..., 6=Sat -> memberId for multi-helper day assignments
  frequency: ChoreFrequency;
  scheduledDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  timeOfDay: TimeOfDay;
  scheduledTime?: string; // e.g. "08:30" or "16:00"
  defaultPoints: number;
  qualityChecklist: string[];
  estimatedMinutes: number;
  iconName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isActive: boolean;
}

export type AssignmentStatus = 'pending' | 'needs_review' | 'approved' | 'needs_redo';

export interface ChoreAssignmentLog {
  id: string;
  choreId: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  status: AssignmentStatus;
  completedAt?: string;
  reviewedAt?: string;
  qualityScore?: number; // 1-5 stars
  qualityGrade?: 'A+' | 'A' | 'B' | 'C' | 'Redo';
  feedbackNote?: string;
  pointsAwarded?: number;
  bonusPoints?: number;
  checklistStatus?: { [index: number]: boolean };
  completedNote?: string;
  originalDueDate?: string;
  extendedDueDate?: string;
  penaltyWaived?: boolean;
  penaltyWaivedReason?: string;
  isMissed?: boolean;
  daysLate?: number;
  deductionApplied?: number;
  latenessMultiplier?: number;
  qualityMultiplier?: number;
}

export interface RewardItem {
  id: string;
  title: string;
  pointCost: number;
  icon: string;
  category: 'treat' | 'allowance' | 'screentime' | 'activity' | 'privilege';
  description: string;
  allowedRoles?: MemberRole[];
}

export interface RewardClaim {
  id: string;
  rewardId: string;
  rewardTitle: string;
  memberId: string;
  memberName: string;
  pointCost: number;
  claimedAt: string;
  status: 'pending' | 'approved' | 'delivered' | 'rejected';
  note?: string;
  parentNote?: string;
  approvedAt?: string;
  deliveredAt?: string;
  rejectedAt?: string;
}

export type ViewMode = 
  | 'today'
  | 'status'
  | 'weekly'
  | 'inspection'
  | 'members'
  | 'library'
  | 'rewards'
  | 'redemptions'
  | 'reports'
  | 'calendar';

export type PersonStatusType = 'on_track' | 'behind' | 'way_behind';

export interface PenaltyTierSchedule {
  tier1MaxDays: number; // < 1 day late -> 75%
  tier1Multiplier: number; // 0.75
  tier2MaxDays: number; // 1 to 2 days late -> 50%
  tier2Multiplier: number; // 0.50
  tier3MaxDays: number; // 3 to 6 days late -> 0% earn + 25% balance deduction
  tier3Multiplier: number; // 0
  tier3DeductionPercent: number; // 0.25
  tier4MinDays: number; // 7+ days late / Missed -> 0% earn + 100% balance deduction
  tier4Multiplier: number; // 0
  tier4DeductionPercent: number; // 1.00
}

export interface QualityGradeMultipliers {
  'A+': number; // 1.00
  'A': number;  // 0.90
  'B': number;  // 0.75
  'C': number;  // 0.50
  'Redo': number; // 0.00
}

export interface HouseholdPenaltySettings {
  timezone: string; // e.g. "America/Los_Angeles"
  shipDate: string; // ISO date string - penalties count forward from here
  allowNegativeBalance: boolean; // default: false
  latenessTiers: PenaltyTierSchedule;
  gradeMultipliers: QualityGradeMultipliers;
}

export type ChoreEventType = 
  | 'late' 
  | 'missed' 
  | 'failed_inspection' 
  | 'penalty_applied' 
  | 'penalty_waived' 
  | 'due_extended' 
  | 'nudge_sent';

export interface ChoreEvent {
  id: string;
  householdId: string;
  type: ChoreEventType;
  memberId: string;
  memberName: string;
  choreId?: string;
  choreTitle?: string;
  pointsBefore?: number;
  pointsAfter?: number;
  pointsDelta?: number; // e.g. -10 or 0
  reason?: string;
  extendedToDate?: string;
  tier?: number;
  weekNumber: number;
  year: number;
  createdAt: string;
}

export interface NudgeRecord {
  id: string;
  householdId: string;
  memberId: string;
  memberName: string;
  senderRole: MemberRole;
  senderName: string;
  message: string;
  choreId?: string;
  choreTitle?: string;
  createdAt: string;
  acknowledged?: boolean;
  acknowledgedAt?: string;
}

export interface AIAssignmentSuggestion {
  choreId: string;
  choreTitle: string;
  assignedMemberId: string;
  assignedMemberName: string;
  reason: string;
  developmentalFocus: string;
  confidenceScore: number;
  recommendedTimeOfDay?: TimeOfDay;
}

export interface AIAssignmentResult {
  suggestions: AIAssignmentSuggestion[];
  fairnessSummary: string;
  ageTierInsights: {
    memberId: string;
    memberName: string;
    age?: number;
    assignedChoresCount: number;
    totalPoints: number;
    insight: string;
  }[];
  fairnessRating: number; // 1-100
}

export interface GoogleCalendarItem {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  accessRole?: string;
}

export interface CalendarSyncLog {
  id: string;
  choreId: string;
  choreTitle: string;
  memberName: string;
  date: string;
  googleEventId: string;
  htmlLink?: string;
  syncedAt: string;
}
