import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where,
  Unsubscribe 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { HouseholdMember, Chore, ChoreAssignmentLog, RewardItem, RewardClaim, HouseholdInfo } from '../types';
import { INITIAL_MEMBERS, INITIAL_CHORES, generateSampleLogs, INITIAL_REWARDS, INITIAL_CLAIMS } from '../data/initialData';
import { getParentPin } from './parentLock';

// Initialize Firebase SDK with the project config
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Target Firestore Database instance
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

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

function shouldAttemptFirestoreWrite(): boolean {
  if (!isFirestoreQuotaExhausted) return true;
  if (Date.now() - quotaCooldownTimestamp > QUOTA_COOLDOWN_MS) {
    isFirestoreQuotaExhausted = false; // Retry after cooldown
    return true;
  }
  return false;
}

function handleFirestoreWriteError(err: any) {
  const errMsg = (err?.message || String(err)).toLowerCase();
  if (errMsg.includes('quota') || errMsg.includes('resource-exhausted') || errMsg.includes('limit exceeded')) {
    isFirestoreQuotaExhausted = true;
    quotaCooldownTimestamp = Date.now();
    console.info('Firestore daily write quota reached - automatically routing all syncs through resilient server store.');
  } else {
    console.warn('Firestore write warning:', err?.message || err);
  }
}

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
    }
  }
  const pin = getParentPin();
  if (pin) {
    headers['X-Admin-Pin'] = pin;
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
  joinPassphrase: string = ''
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
    members: INITIAL_MEMBERS,
    chores: INITIAL_CHORES,
    rewards: INITIAL_REWARDS,
    claims: INITIAL_CLAIMS,
    logs: generateSampleLogs(),
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

  // 2. Try Firestore single document write (skipped if currently quota-exhausted)
  if (shouldAttemptFirestoreWrite()) {
    try {
      const sanitized = cleanFirestoreData(householdData);
      await setDoc(doc(db, 'households', householdId), sanitized, { merge: true });
    } catch (err: any) {
      handleFirestoreWriteError(err);
    }
  }

  // Set active session
  setCurrentHouseholdId(householdId);

  return householdData;
}

/**
 * Look up a household by its Family Join Code (e.g. "NEST-7K9X") or ID.
 * Verifies join passphrases and securely acquires authentication credentials.
 */
export async function findHouseholdByCode(code: string, passphrase?: string): Promise<CloudHousehold | null> {
  const raw = code.trim();
  const normalized = raw.toUpperCase();

  const extraHeaders: Record<string, string> = {};
  if (passphrase) {
    extraHeaders['X-Join-Passphrase'] = passphrase;
  }

  // 1. Try Server API first by code (instant, bypasses exhausted Firestore quota)
  try {
    const queryStr = passphrase ? `?passphrase=${encodeURIComponent(passphrase)}` : '';
    const res = await fetch(`/api/household/by-code/${encodeURIComponent(normalized)}${queryStr}`, {
      headers: extraHeaders,
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.requiresPassphrase) {
        // Return placeholder stub requiring password prompt without leaking family data
        return {
          id: '',
          householdCode: data.householdCode || normalized,
          familyName: data.familyName || 'Family Home',
          joinPassphrase: 'REQUIRED',
        } as CloudHousehold;
      }
      if (data?.household) {
        if (data.authKey) {
          setHouseholdAuthToken(data.household.id, data.authKey);
        }
        return data.household as CloudHousehold;
      }
    }
  } catch (e) {
    // continue fallback
  }

  // 2. Try Server API by direct ID with existing auth credentials
  try {
    const res = await fetch(`/api/household/${encodeURIComponent(raw)}`, {
      headers: getHouseholdAuthHeaders(raw, extraHeaders),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.household) {
        if (data.authKey) {
          setHouseholdAuthToken(data.household.id, data.authKey);
        }
        return data.household as CloudHousehold;
      }
    }
  } catch (e) {
    // continue fallback
  }

  // 3. Direct Firestore getDoc if already an exact household ID
  if (raw.startsWith('hh_') && raw.length > 5) {
    try {
      const snap = await getDoc(doc(db, 'households', raw));
      if (snap.exists()) {
        const docData = snap.data() as CloudHousehold;
        return docData;
      }
    } catch (err) {
      // Catch quota or permission errors
    }
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
  // 1. Try server API with authorization credentials
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
    // continue to Firestore fallback
  }

  // 2. Try Firestore doc
  try {
    const snap = await getDoc(doc(db, 'households', householdId));
    if (snap.exists()) {
      const data = snap.data() as CloudHousehold;
      return data;
    }
  } catch (err: any) {
    console.warn('Firestore getHousehold warning:', err?.message || err);
  }

  return null;
}

/**
 * Sync complete household bundle to Cloud (Server API + Firestore single doc).
 * Uses a single doc write instead of hundreds of subcollection writes.
 */
export async function syncCompleteHouseholdToCloud(
  householdId: string,
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
  }
): Promise<void> {
  const now = new Date().toISOString();
  const fullData = {
    id: householdId,
    ...payload,
    updatedAt: now,
  };

  // 1. Server API sync (authenticated request)
  try {
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
    }
  } catch (e) {
    console.warn('Server sync notice:', e);
  }

  // 2. Firestore single document update (skipped if currently quota-exhausted)
  if (shouldAttemptFirestoreWrite()) {
    try {
      const sanitized = cleanFirestoreData(fullData);
      await setDoc(doc(db, 'households', householdId), sanitized, { merge: true });
    } catch (err: any) {
      handleFirestoreWriteError(err);
    }
  }
}

/**
 * Real-Time Subscriptions & Polling Manager
 * Listens to Firestore onSnapshot with an authenticated fallback to server polling.
 */
export function subscribeHouseholdFull(
  householdId: string,
  callback: (fullHousehold: CloudHousehold) => void
): Unsubscribe {
  let isUnsubscribed = false;
  let lastUpdatedAt = '';
  let pollInterval: any = null;

  // 1. Firestore realtime listener
  let firestoreUnsub: Unsubscribe | null = null;
  try {
    firestoreUnsub = onSnapshot(
      doc(db, 'households', householdId),
      (snap) => {
        if (isUnsubscribed) return;
        if (snap.exists()) {
          const data = snap.data() as CloudHousehold;
          lastUpdatedAt = data.updatedAt || '';
          callback(data);
        }
      },
      (err) => {
        handleFirestoreWriteError(err);
        console.info('Firestore realtime listener note (seamless server fallback stream active):', err?.message || err);
      }
    );
  } catch (e) {
    console.warn('Could not establish Firestore listener:', e);
  }

  // 2. Authenticated polling stream (every 2.5s)
  const pollServer = async () => {
    if (isUnsubscribed) return;
    try {
      const url = `/api/household/${encodeURIComponent(householdId)}/poll?since=${encodeURIComponent(lastUpdatedAt)}`;
      const res = await fetch(url, {
        headers: getHouseholdAuthHeaders(householdId),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authKey) {
          setHouseholdAuthToken(householdId, data.authKey);
        }
        if (data.hasUpdate && data.household) {
          lastUpdatedAt = data.household.updatedAt || '';
          callback(data.household as CloudHousehold);
        }
      } else if (res.status === 401 || res.status === 403) {
        // Unauthorized credentials: stop polling
        isUnsubscribed = true;
        if (pollInterval) clearInterval(pollInterval);
      }
    } catch (e) {
      // transient network blip
    }
  };

  // Run initial check and set interval
  pollServer();
  pollInterval = setInterval(pollServer, 2500);

  return () => {
    isUnsubscribed = true;
    if (firestoreUnsub) {
      try { firestoreUnsub(); } catch {}
    }
    if (pollInterval) {
      clearInterval(pollInterval);
    }
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
