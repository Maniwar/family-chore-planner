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
  assignedMemberId: string; // 'unassigned' or memberId
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
  status: 'pending' | 'approved' | 'delivered';
}

export type ViewMode = 
  | 'today'
  | 'weekly'
  | 'inspection'
  | 'members'
  | 'library'
  | 'rewards'
  | 'reports'
  | 'calendar';

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
