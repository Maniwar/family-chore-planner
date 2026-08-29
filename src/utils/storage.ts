import confetti from 'canvas-confetti';
import { 
  HouseholdMember, 
  Chore, 
  ChoreAssignmentLog, 
  RewardItem, 
  RewardClaim, 
  HouseholdInfo,
  HouseholdPenaltySettings,
  ChoreEvent,
  NudgeRecord
} from '../types';
import { INITIAL_MEMBERS, INITIAL_CHORES, generateSampleLogs, INITIAL_REWARDS, INITIAL_CLAIMS, getTodayDateString } from '../data/initialData';
import { calculateAge } from './age';
import { DEFAULT_PENALTY_SETTINGS } from './penaltyEngine';

export { getTodayDateString, DEFAULT_PENALTY_SETTINGS };

const STORAGE_KEYS = {
  MEMBERS: 'family_chores_members_v2',
  CHORES: 'family_chores_items_v2',
  LOGS: 'family_chores_logs_v2',
  REWARDS: 'family_chores_rewards_v2',
  CLAIMS: 'family_chores_claims_v2',
  ACTIVE_VIEW_MEMBER: 'family_chores_active_member_v2',
  MOM_MODE: 'family_chores_mom_mode_v2',
  HOUSEHOLD_INFO: 'family_chores_household_info_v1',
  PENALTY_SETTINGS: 'family_chores_penalty_settings_v1',
  EVENTS: 'family_chores_events_v1',
  NUDGES: 'family_chores_nudges_v1',
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

export const loadStoredPenaltySettings = (): HouseholdPenaltySettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PENALTY_SETTINGS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load penalty settings from localStorage', e);
  }
  return DEFAULT_PENALTY_SETTINGS;
};

export const savePenaltySettings = (settings: HouseholdPenaltySettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PENALTY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save penalty settings', e);
  }
};

export const generateSampleEvents = (): ChoreEvent[] => {
  const now = Date.now();
  return [
    {
      id: 'evt_w1',
      householdId: 'default',
      type: 'penalty_waived',
      memberId: 'mem_layla',
      memberName: 'Layla',
      choreId: 'chore_kitchen_unload_dw',
      choreTitle: 'Unload & Load Dishwasher & Handwash Delicate Items',
      reason: 'Doctor appointment and extra homework',
      weekNumber: 35,
      year: 2026,
      createdAt: new Date(now - 10 * 3600 * 1000).toISOString(),
    },
    {
      id: 'evt_w2',
      householdId: 'default',
      type: 'penalty_waived',
      memberId: 'mem_sven',
      memberName: 'Sven',
      choreId: 'chore_living_pillows_throws',
      choreTitle: 'Fluff Couch Pillows, Fold Throws & Clear Coffee Table',
      reason: 'Parent waived backlog for weekend family trip',
      weekNumber: 35,
      year: 2026,
      createdAt: new Date(now - 22 * 3600 * 1000).toISOString(),
    },
    {
      id: 'evt_w3',
      householdId: 'default',
      type: 'penalty_waived',
      memberId: 'mem_layla',
      memberName: 'Layla',
      choreId: 'chore_dining_set_table',
      choreTitle: 'Set Table for Family Meals & Clear Table Afterward',
      reason: 'Sick with flu on Wednesday',
      weekNumber: 34,
      year: 2026,
      createdAt: new Date(now - 4 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'evt_w4',
      householdId: 'default',
      type: 'penalty_waived',
      memberId: 'mem_ashbelle',
      memberName: 'Ashbelle',
      choreId: 'chore_bath_toilets',
      choreTitle: 'Deep Clean & Sanitize Bathroom Sinks, Toilets & Mirrors',
      reason: 'College entrance practice exam weekend',
      weekNumber: 34,
      year: 2026,
      createdAt: new Date(now - 6 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'evt_1',
      householdId: 'default',
      type: 'penalty_applied',
      memberId: 'mem_theena',
      memberName: 'Theena',
      choreId: 'chore_bath_tub_shower',
      choreTitle: 'Scrub Bathtub, Shower Walls & Chrome Fixtures',
      pointsBefore: 120,
      pointsAfter: 115,
      pointsDelta: -5,
      reason: '3 days late lateness deduction (25%)',
      tier: 3,
      weekNumber: 35,
      year: 2026,
      createdAt: new Date(now - 36 * 3600 * 1000).toISOString(),
    },
    {
      id: 'evt_2',
      householdId: 'default',
      type: 'nudge_sent',
      memberId: 'mem_theena',
      memberName: 'Theena',
      choreId: 'chore_bath_tub_shower',
      choreTitle: 'Scrub Bathtub, Shower Walls & Chrome Fixtures',
      reason: 'Mom: Please wrap this up before dinner tonight!',
      weekNumber: 35,
      year: 2026,
      createdAt: new Date(now - 12 * 3600 * 1000).toISOString(),
    },
    {
      id: 'evt_3',
      householdId: 'default',
      type: 'due_extended',
      memberId: 'mem_ashbelle',
      memberName: 'Ashbelle',
      choreId: 'chore_kitchen_pots_pans',
      choreTitle: 'Handwash Big Pots, Pans & Baking Sheets',
      reason: 'Extended by 1 day for exam study',
      extendedToDate: '2026-08-30',
      weekNumber: 35,
      year: 2026,
      createdAt: new Date(now - 48 * 3600 * 1000).toISOString(),
    },
  ];
};

export const loadStoredEvents = (): ChoreEvent[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load events from localStorage', e);
  }
  return generateSampleEvents();
};

export const saveEvents = (events: ChoreEvent[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  } catch (e) {
    console.error('Failed to save events', e);
  }
};

export const loadStoredNudges = (): NudgeRecord[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.NUDGES);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load nudges from localStorage', e);
  }
  return [
    {
      id: 'nudge_1',
      householdId: 'default',
      memberId: 'theena',
      memberName: 'Theena',
      senderRole: 'parent',
      senderName: 'Mom',
      message: 'Hey Theena, please wrap up the bathroom sinks before tonight to keep your points! ⭐',
      choreId: 'theena_1',
      choreTitle: 'Scrub Upstairs Kids Bathroom Sinks & Mirrors',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      acknowledged: false,
    }
  ];
};

export const saveNudges = (nudges: NudgeRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.NUDGES, JSON.stringify(nudges));
  } catch (e) {
    console.error('Failed to save nudges', e);
  }
};

export const resetAllToDemo = (): {
  members: HouseholdMember[];
  chores: Chore[];
  logs: ChoreAssignmentLog[];
  rewards: RewardItem[];
  claims: RewardClaim[];
  penaltySettings: HouseholdPenaltySettings;
  events: ChoreEvent[];
  nudges: NudgeRecord[];
} => {
  const members = INITIAL_MEMBERS;
  const chores = INITIAL_CHORES;
  const logs = generateSampleLogs();
  const rewards = INITIAL_REWARDS;
  const claims = INITIAL_CLAIMS;
  const penaltySettings = DEFAULT_PENALTY_SETTINGS;
  const events = generateSampleEvents();
  const nudges = loadStoredNudges();

  saveMembers(members);
  saveChores(chores);
  saveLogs(logs);
  saveRewards(rewards);
  saveClaims(claims);
  savePenaltySettings(penaltySettings);
  saveEvents(events);
  saveNudges(nudges);

  return { members, chores, logs, rewards, claims, penaltySettings, events, nudges };
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

  // If dayAssignments is configured, check if this day is assigned or scheduled
  if (chore.dayAssignments && Object.keys(chore.dayAssignments).length > 0) {
    return Object.prototype.hasOwnProperty.call(chore.dayAssignments, dayOfWeek);
  }

  switch (chore.frequency) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'weekly':
    case 'custom_days':
      return Array.isArray(chore.scheduledDays) && chore.scheduledDays.includes(dayOfWeek);
    case 'as_needed':
      return true;
    default:
      return true;
  }
};

export const getChoreAssigneeForDate = (chore: Chore, dateStr: string): string => {
  const date = parseLocalDate(dateStr);
  const dayOfWeek = date.getDay(); // 0=Sunday..6=Saturday
  if (chore.dayAssignments && chore.dayAssignments[dayOfWeek]) {
    return chore.dayAssignments[dayOfWeek];
  }
  return chore.assignedMemberId || 'unassigned';
};

export const formatChoreScheduleDisplay = (chore: Chore): string => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // If dayAssignments are present with individual days
  if (chore.dayAssignments && Object.keys(chore.dayAssignments).length > 0) {
    const assignedDays = Object.keys(chore.dayAssignments).map(Number).sort((a, b) => a - b);
    if (assignedDays.length === 7) return 'Every Day (Rotating)';
    if (assignedDays.length === 5 && [1, 2, 3, 4, 5].every(d => assignedDays.includes(d))) return 'Weekdays (Rotating)';
    if (assignedDays.length === 2 && [0, 6].every(d => assignedDays.includes(d))) return 'Weekends (Rotating)';
    return assignedDays.map(d => dayNames[d]).join(', ');
  }

  switch (chore.frequency) {
    case 'daily':
      return 'Every Day';
    case 'weekdays':
      return 'Weekdays (Mon–Fri)';
    case 'weekends':
      return 'Weekends (Sat & Sun)';
    case 'as_needed':
      return 'As Needed';
    case 'weekly':
    case 'custom_days':
    default: {
      if (!chore.scheduledDays || chore.scheduledDays.length === 0) return 'Weekly';
      if (chore.scheduledDays.length === 7) return 'Every Day';
      if (chore.scheduledDays.length === 5 && [1, 2, 3, 4, 5].every(d => chore.scheduledDays.includes(d))) return 'Weekdays (Mon–Fri)';
      if (chore.scheduledDays.length === 2 && [0, 6].every(d => chore.scheduledDays.includes(d))) return 'Weekends (Sat & Sun)';
      const sorted = [...chore.scheduledDays].sort((a, b) => a - b);
      return sorted.map(d => dayNames[d]).join(', ');
    }
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
