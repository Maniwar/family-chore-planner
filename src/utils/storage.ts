import confetti from 'canvas-confetti';
import { HouseholdMember, Chore, ChoreAssignmentLog, RewardItem, RewardClaim, HouseholdInfo } from '../types';
import { INITIAL_MEMBERS, INITIAL_CHORES, generateSampleLogs, INITIAL_REWARDS, INITIAL_CLAIMS, getTodayDateString } from '../data/initialData';
import { calculateAge } from './age';

export { getTodayDateString };

const STORAGE_KEYS = {
  MEMBERS: 'family_chores_members_v2',
  CHORES: 'family_chores_items_v2',
  LOGS: 'family_chores_logs_v2',
  REWARDS: 'family_chores_rewards_v2',
  CLAIMS: 'family_chores_claims_v2',
  ACTIVE_VIEW_MEMBER: 'family_chores_active_member_v2',
  MOM_MODE: 'family_chores_mom_mode_v2',
  HOUSEHOLD_INFO: 'family_chores_household_info_v1',
};

export const DEFAULT_HOUSEHOLD_INFO: HouseholdInfo = {
  familyName: 'Our Family Home',
  houseAddressOrMotto: 'Clean spaces, happy smiles & teamwork! ✨',
};

export const loadStoredHouseholdInfo = (): HouseholdInfo => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HOUSEHOLD_INFO);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load household info from localStorage', e);
  }
  return DEFAULT_HOUSEHOLD_INFO;
};

export const saveHouseholdInfo = (info: HouseholdInfo): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.HOUSEHOLD_INFO, JSON.stringify(info));
  } catch (e) {
    console.error('Failed to save household info', e);
  }
};

export const loadStoredMembers = (): HouseholdMember[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (saved) {
      const parsed: HouseholdMember[] = JSON.parse(saved);
      // Dynamically calculate current ages from birth dates
      return parsed.map((m) => ({
        ...m,
        age: m.birthDate ? calculateAge(m.birthDate) : m.age,
      }));
    }
  } catch (e) {
    console.error('Failed to load members from localStorage', e);
  }
  return INITIAL_MEMBERS.map((m) => ({
    ...m,
    age: m.birthDate ? calculateAge(m.birthDate) : m.age,
  }));
};

export const saveMembers = (members: HouseholdMember[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  } catch (e) {
    console.error('Failed to save members', e);
  }
};

export const loadStoredChores = (): Chore[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CHORES);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load chores from localStorage', e);
  }
  return INITIAL_CHORES;
};

export const saveChores = (chores: Chore[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CHORES, JSON.stringify(chores));
  } catch (e) {
    console.error('Failed to save chores', e);
  }
};

export const loadStoredLogs = (): ChoreAssignmentLog[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load logs from localStorage', e);
  }
  return generateSampleLogs();
};

export const saveLogs = (logs: ChoreAssignmentLog[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save logs', e);
  }
};

export const loadStoredRewards = (): RewardItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.REWARDS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load rewards', e);
  }
  return INITIAL_REWARDS;
};

export const saveRewards = (rewards: RewardItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(rewards));
  } catch (e) {
    console.error('Failed to save rewards', e);
  }
};

export const loadStoredClaims = (): RewardClaim[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CLAIMS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load claims', e);
  }
  return INITIAL_CLAIMS;
};

export const saveClaims = (claims: RewardClaim[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(claims));
  } catch (e) {
    console.error('Failed to save claims', e);
  }
};

export const resetAllToDemo = (): {
  members: HouseholdMember[];
  chores: Chore[];
  logs: ChoreAssignmentLog[];
  rewards: RewardItem[];
  claims: RewardClaim[];
} => {
  const members = INITIAL_MEMBERS;
  const chores = INITIAL_CHORES;
  const logs = generateSampleLogs();
  const rewards = INITIAL_REWARDS;
  const claims = INITIAL_CLAIMS;

  saveMembers(members);
  saveChores(chores);
  saveLogs(logs);
  saveRewards(rewards);
  saveClaims(claims);

  return { members, chores, logs, rewards, claims };
};

// Date helpers
export const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
};

export const formatDisplayDate = (dateStr: string): string => {
  const date = parseLocalDate(dateStr);
  const today = getTodayDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  const formatted = date.toLocaleDateString(undefined, options);

  if (dateStr === today) return `Today, ${formatted}`;
  if (dateStr === yesterdayStr) return `Yesterday, ${formatted}`;
  if (dateStr === tomorrowStr) return `Tomorrow, ${formatted}`;
  return formatted;
};

export const formatTimeDisplay = (timeStr?: string, timeOfDay?: string): string => {
  if (timeStr && timeStr.includes(':')) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${String(minutes).padStart(2, '0')} ${ampm}`;
  }
  if (timeOfDay) {
    switch (timeOfDay) {
      case 'morning': return 'Morning (by 9am)';
      case 'afternoon': return 'Afternoon (by 2pm)';
      case 'evening': return 'Evening (by 6pm)';
      case 'bedtime': return 'Bedtime (by 8pm)';
      default: return 'Flexible time';
    }
  }
  return 'Anytime';
};

export const isChoreScheduledForDate = (chore: Chore, dateStr: string): boolean => {
  if (!chore.isActive) return false;
  const date = parseLocalDate(dateStr);
  const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday

  switch (chore.frequency) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'weekly':
    case 'custom_days':
      return chore.scheduledDays.includes(dayOfWeek);
    case 'as_needed':
      return true;
    default:
      return true;
  }
};

export const getWeekDates = (centerDateStr: string): { dateStr: string; dayName: string; dayNumber: number; isToday: boolean; isSelected: boolean }[] => {
  const center = parseLocalDate(centerDateStr);
  const currentDayOfWeek = center.getDay(); // 0 is Sunday
  
  // Start on Sunday
  const startOfWeek = new Date(center);
  startOfWeek.setDate(center.getDate() - currentDayOfWeek);

  const days = [];
  const todayStr = getTodayDateString();

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dStr = `${yyyy}-${mm}-${dd}`;

    const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
    const dayNumber = d.getDate();

    days.push({
      dateStr: dStr,
      dayName,
      dayNumber,
      isToday: dStr === todayStr,
      isSelected: dStr === centerDateStr,
    });
  }

  return days;
};

export const triggerConfettiCelebration = () => {
  try {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#10B981', '#F59E0B', '#6366F1', '#EC4899', '#3B82F6'],
    });
  } catch (e) {
    // Graceful fallback
  }
};

export const triggerBigCelebration = () => {
  try {
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#10B981', '#8B5CF6', '#F43F5E', '#06B6D4'],
    });
  } catch (e) {
    // Graceful fallback
  }
};
