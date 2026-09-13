import { initializeApp, getApps, getApp } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';
import { HouseholdMember, Chore, ChoreAssignmentLog, RewardItem, RewardClaim, HouseholdInfo } from '../types';
import { INITIAL_MEMBERS, INITIAL_CHORES, generateSampleLogs, INITIAL_REWARDS, INITIAL_CLAIMS } from '../data/initialData';
import { getParentPin } from './parentLock';
import { getUserGeminiApiKey } from './geminiApiKey';

export type Unsubscribe = () => void;

// Initialize Firebase SDK with the project config
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Target Firestore Database instance - DISABLED (Migration to API complete)

export interface CloudHousehold {
  id: string;
  householdCode: string;
  familyName: string;
  houseAddressOrMotto?: string;
  housePhotoUrl?: string;
  adminPin?: string;
  pinProtectionEnabled?: boolean;
  joinPassphrase?: string; // Optional household join security password
  members?: HouseholdMember[];
  chores?: Chore[];
  logs?: ChoreAssignmentLog[];
  rewards?: RewardItem[];
  claims?: RewardClaim[];
  penaltySettings?: any;
  events?: any[];
  nudges?: any[];
  customHouseXp?: number;
  createdAt: string;
  updatedAt: string;
  version?: number;
}

// Quota circuit-breaker to avoid spamming Firestore when daily free tier limits are hit
let isFirestoreQuotaExhausted = false;
let quotaCooldownTimestamp = 0;
const QUOTA_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Recursively sanitize Firestore data to remove any `undefined` values that crash the SDK
 */
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === undefined || obj === null) {
    return null as unknown as T;
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanFirestoreData(item)) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj as Record<string, any>)) {
    if (value !== undefined) {
      cleaned[key] = cleanFirestoreData(value);
    }
  }
  return cleaned as T;
}

// Helper functions removed

// Generate an unguessable high-entropy Family Code e.g. "NEST-7K9X" or "HERO-3M8P"
export function generateHouseholdCode(): string {
  const prefixes = ['NEST', 'HERO', 'STAR', 'VIBE', 'NOVA', 'LUNA', 'APEX', 'ZEN', 'COVE', 'BEAM'];
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude ambiguous 0,1,O,I
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${prefix}-${randomPart}`;
}

export const HOUSEHOLD_SESSION_KEY = 'family_chores_current_household_id_v1';
export const HOUSEHOLD_AUTH_KEY_PREFIX = 'family_household_auth_token_';

export const getHouseholdAuthToken = (householdId: string): string => {
  try {
    return localStorage.getItem(`${HOUSEHOLD_AUTH_KEY_PREFIX}${householdId}`) || '';
  } catch {
    return '';
  }
};

export const setHouseholdAuthToken = (householdId: string, token: string | null): void => {
  try {
    if (token) {
      localStorage.setItem(`${HOUSEHOLD_AUTH_KEY_PREFIX}${householdId}`, token);
    } else {
      localStorage.removeItem(`${HOUSEHOLD_AUTH_KEY_PREFIX}${householdId}`);
    }
  } catch {}
};

export function getHouseholdAuthHeaders(householdId?: string, extraHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders || {}),
  };
  const targetId = householdId || getCurrentHouseholdId();
  if (targetId) {
    const token = getHouseholdAuthToken(targetId);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['X-Household-Auth'] = token;
      headers['X-Household-Id'] = targetId;
    }
  }
  const pin = getParentPin();
  if (pin) {
    headers['X-Admin-Pin'] = pin;
  }
  const userGeminiKey = getUserGeminiApiKey();
  if (userGeminiKey) {
    headers['X-Gemini-Api-Key'] = userGeminiKey;
  }
  return headers;
}

export const getCurrentHouseholdId = (): string | null => {
  return localStorage.getItem(HOUSEHOLD_SESSION_KEY);
};

export const setCurrentHouseholdId = (householdId: string | null): void => {
  if (householdId) {
    localStorage.setItem(HOUSEHOLD_SESSION_KEY, householdId);
  } else {
    localStorage.removeItem(HOUSEHOLD_SESSION_KEY);
  }
};

/**
 * Creates a brand new household with initial seeded members, chores, and rewards.
 * Uses unified single-document architecture to minimize Firestore operations by 98%
 * and syncs with resilient backend API.
 */
export async function createNewHousehold(
  familyName: string, 
  motto: string = 'Clean spaces, happy smiles & teamwork! ✨',
  adminPin: string = '1234',
  joinPassphrase: string = '',
  initialState?: {
    members?: HouseholdMember[];
    chores?: Chore[];
    rewards?: RewardItem[];
    claims?: RewardClaim[];
    logs?: ChoreAssignmentLog[];
  }
): Promise<CloudHousehold> {
  const householdId = 'hh_' + Math.random().toString(36).substring(2, 11);
  const householdCode = generateHouseholdCode();
  const now = new Date().toISOString();

  const householdData: CloudHousehold = {
    id: householdId,
    householdCode,
    familyName: familyName.trim() || 'Our Family Home',
    houseAddressOrMotto: motto,
    adminPin,
    joinPassphrase: joinPassphrase.trim() || undefined,
    members: initialState?.members && initialState.members.length > 0 ? initialState.members : INITIAL_MEMBERS,
    chores: initialState?.chores && initialState.chores.length > 0 ? initialState.chores : INITIAL_CHORES,
    rewards: initialState?.rewards && initialState.rewards.length > 0 ? initialState.rewards : INITIAL_REWARDS,
    claims: initialState?.claims && initialState.claims.length > 0 ? initialState.claims : INITIAL_CLAIMS,
    logs: initialState?.logs && initialState.logs.length > 0 ? initialState.logs : generateSampleLogs(),
    createdAt: now,
    updatedAt: now,
    version: 1,
  };

  // 1. Sync to server API (bulletproof fallback)
  try {
    const res = await fetch('/api/household/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(householdData),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.authKey) {
        setHouseholdAuthToken(householdId, data.authKey);
      }
      if (data.household) {
        Object.assign(householdData, data.household);
      }
    }
  } catch (e) {
    console.warn('Server API create notice:', e);
  }

  // Set active session
  setCurrentHouseholdId(householdId);

  return householdData;
}

/**
 * Ensures the client has an active authenticated household session with a valid auth token.
 * Creates a household on the server if no session exists yet, allowing AI endpoints to authenticate.
 */
export async function ensureAuthenticatedHousehold(): Promise<string | null> {
  const currentId = getCurrentHouseholdId();
  if (currentId) {
    const token = getHouseholdAuthToken(currentId);
    if (token) return token;
  }

  try {
    const created = await createNewHousehold(
      'Our Family Home',
      'Clean spaces, happy smiles & teamwork! ✨',
      '1234',
      'welcome' + Math.random().toString(36).substring(2, 7)
    );
    if (created?.id) {
      setCurrentHouseholdId(created.id);
      return getHouseholdAuthToken(created.id);
    }
  } catch (e) {
    console.warn('Could not auto-register household session:', e);
  }
  return null;
}

/**
 * Look up a household by its Family Join Code (e.g. "NEST-7K9X") or ID.
 * Verifies join passphrases and securely acquires authentication credentials.
 */
export async function findHouseholdByCode(code: string, passphrase?: string): Promise<CloudHousehold | null> {
  const raw = code.trim();
  const normalized = raw.toUpperCase();

  try {
    if (passphrase) {
      // Trying to actually join with a passphrase
      const res = await fetch(`/api/household/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Join-Passphrase': passphrase
        },
        body: JSON.stringify({ householdCode: normalized })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.household && data.authKey) {
          setHouseholdAuthToken(data.household.id, data.authKey);
          return data.household as CloudHousehold;
        }
      }
      return null;
    } else {
      // Just looking it up to see if it exists and needs a passphrase
      const res = await fetch(`/api/household/by-code/${encodeURIComponent(normalized)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success === false && data.requiresPassphrase) {
          return {
            id: '',
            householdCode: normalized,
            familyName: 'Family Home',
            joinPassphrase: 'REQUIRED',
          } as CloudHousehold;
        } else if (data.household) {
           return data.household as CloudHousehold; 
        }
      }
      return null;
    }
  } catch (e) {
    console.error("API lookup error:", e);
  }
  return null;
}

/**
 * Permanently disabled for privacy and security. Unauthenticated strangers
 * will never be automatically assigned any other family's household.
 */
export async function getPrimaryHousehold(): Promise<CloudHousehold | null> {
  return null;
}

/**
 * Fetch Complete Household Details - Authenticated Request
 */
export async function getHousehold(householdId: string): Promise<CloudHousehold | null> {
  // Use API
  try {
    const res = await fetch(`/api/household/${encodeURIComponent(householdId)}`, {
      headers: getHouseholdAuthHeaders(householdId),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.household) {
        if (data.authKey) {
          setHouseholdAuthToken(householdId, data.authKey);
        }
        return data.household as CloudHousehold;
      }
    } else if (res.status === 401 || res.status === 403) {
      console.warn('Household access unauthorized. Invalid credentials for:', householdId);
      return null;
    }
  } catch (e) {
    // network issue
  }

  return null;
}

/**
 * Sync complete household bundle to Cloud (Server API + Firestore single doc).
 * Uses a single doc write instead of hundreds of subcollection writes.
 */
export async function syncCompleteHouseholdToCloud(
  householdId: string | null | undefined,
  payload: {
    familyName?: string;
    houseAddressOrMotto?: string;
    housePhotoUrl?: string;
    householdCode?: string;
    adminPin?: string;
    pinProtectionEnabled?: boolean;
    joinPassphrase?: string;
    members?: HouseholdMember[];
    chores?: Chore[];
    logs?: ChoreAssignmentLog[];
    rewards?: RewardItem[];
    claims?: RewardClaim[];
    penaltySettings?: any;
    events?: any[];
    nudges?: any[];
    customHouseXp?: number;
    version?: number;
  }
): Promise<void> {
  if (!householdId) {
    console.warn("Attempted to sync without a valid household ID. Changes are queued locally.");
    return;
  }

  const now = new Date().toISOString();
  const fullData = {
    id: householdId,
    ...payload,
    updatedAt: now,
  };

  const res = await fetch(`/api/household/${encodeURIComponent(householdId)}/sync`, {
    method: 'POST',
    headers: getHouseholdAuthHeaders(householdId),
    body: JSON.stringify(fullData),
  });

  if (res.ok) {
    const data = await res.json();
    if (data?.authKey) {
      setHouseholdAuthToken(householdId, data.authKey);
    }
  } else {
    let errBody;
    try {
      errBody = await res.json();
    } catch {
      errBody = { error: res.statusText };
    }
    const errObj = new Error(errBody.error || `Failed to sync: ${res.status}`);
    (errObj as any).status = res.status;
    (errObj as any).body = errBody;
    throw errObj;
  }
}

/**
 * Real-Time Subscriptions & Polling Manager
 * Uses authenticated long-polling / fast-polling against the server.
 */
export function subscribeHouseholdFull(
  householdId: string,
  callback: (fullHousehold: CloudHousehold) => void
): Unsubscribe {
  let isUnsubscribed = false;
  let lastUpdatedAt = '';

  const poll = async () => {
    if (isUnsubscribed) return;
    try {
      const qs = lastUpdatedAt ? `?since=${encodeURIComponent(lastUpdatedAt)}` : '';
      const res = await fetch(`/api/household/${encodeURIComponent(householdId)}/poll${qs}`, {
        headers: getHouseholdAuthHeaders(householdId)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.hasUpdate && data.household) {
          lastUpdatedAt = data.household.updatedAt || '';
          callback(data.household);
        }
      }
    } catch (e) {
      // Ignore network errors
    }

    if (!isUnsubscribed) {
      setTimeout(poll, 2000); // Poll every 2 seconds
    }
  };

  poll();

  return () => {
    isUnsubscribed = true;
  };
}

// Backward-compatible individual helper exports
export async function syncHouseholdInfoToCloud(householdId: string, info: HouseholdInfo): Promise<void> {
  return syncCompleteHouseholdToCloud(householdId, {
    familyName: info.familyName,
    houseAddressOrMotto: info.houseAddressOrMotto,
    housePhotoUrl: info.housePhotoUrl,
  });
}

export async function syncMemberToCloud(householdId: string, member: HouseholdMember): Promise<void> {
  const current = await getHousehold(householdId);
  const existingMembers = current?.members || [];
  const updated = existingMembers.some(m => m.id === member.id)
    ? existingMembers.map(m => m.id === member.id ? member : m)
    : [...existingMembers, member];
  return syncCompleteHouseholdToCloud(householdId, { members: updated });
}

export async function syncAllMembersToCloud(householdId: string, members: HouseholdMember[]): Promise<void> {
  return syncCompleteHouseholdToCloud(householdId, { members });
}

export async function syncChoreToCloud(householdId: string, chore: Chore): Promise<void> {
  const current = await getHousehold(householdId);
  const existingChores = current?.chores || [];
  const updated = existingChores.some(c => c.id === chore.id)
    ? existingChores.map(c => c.id === chore.id ? chore : c)
    : [...existingChores, chore];
  return syncCompleteHouseholdToCloud(householdId, { chores: updated });
}

export async function deleteChoreFromCloud(householdId: string, choreId: string): Promise<void> {
  const current = await getHousehold(householdId);
  const updated = (current?.chores || []).filter(c => c.id !== choreId);
  return syncCompleteHouseholdToCloud(householdId, { chores: updated });
}

export async function syncAllChoresToCloud(householdId: string, chores: Chore[]): Promise<void> {
  return syncCompleteHouseholdToCloud(householdId, { chores });
}

export async function syncLogToCloud(householdId: string, log: ChoreAssignmentLog): Promise<void> {
  const current = await getHousehold(householdId);
  const existingLogs = current?.logs || [];
  const updated = existingLogs.some(l => l.id === log.id)
    ? existingLogs.map(l => l.id === log.id ? log : l)
    : [log, ...existingLogs];
  return syncCompleteHouseholdToCloud(householdId, { logs: updated });
}

export async function syncAllLogsToCloud(householdId: string, logs: ChoreAssignmentLog[]): Promise<void> {
  return syncCompleteHouseholdToCloud(householdId, { logs });
}

export async function syncRewardToCloud(householdId: string, reward: RewardItem): Promise<void> {
  const current = await getHousehold(householdId);
  const existing = current?.rewards || [];
  const updated = existing.some(r => r.id === reward.id)
    ? existing.map(r => r.id === reward.id ? reward : r)
    : [...existing, reward];
  return syncCompleteHouseholdToCloud(householdId, { rewards: updated });
}

export async function syncAllRewardsToCloud(householdId: string, rewards: RewardItem[]): Promise<void> {
  return syncCompleteHouseholdToCloud(householdId, { rewards });
}

export async function deleteRewardFromCloud(householdId: string, rewardId: string): Promise<void> {
  const current = await getHousehold(householdId);
  const updated = (current?.rewards || []).filter(r => r.id !== rewardId);
  return syncCompleteHouseholdToCloud(householdId, { rewards: updated });
}

export async function syncClaimToCloud(householdId: string, claim: RewardClaim): Promise<void> {
  const current = await getHousehold(householdId);
  const existing = current?.claims || [];
  const updated = existing.some(c => c.id === claim.id)
    ? existing.map(c => c.id === claim.id ? claim : c)
    : [claim, ...existing];
  return syncCompleteHouseholdToCloud(householdId, { claims: updated });
}

export async function syncAllClaimsToCloud(householdId: string, claims: RewardClaim[]): Promise<void> {
  return syncCompleteHouseholdToCloud(householdId, { claims });
}
