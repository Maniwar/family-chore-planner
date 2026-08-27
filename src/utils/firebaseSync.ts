import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where,
  writeBatch,
  Unsubscribe 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { HouseholdMember, Chore, ChoreAssignmentLog, RewardItem, RewardClaim, HouseholdInfo } from '../types';
import { INITIAL_MEMBERS, INITIAL_CHORES, generateSampleLogs, INITIAL_REWARDS, INITIAL_CLAIMS } from '../data/initialData';

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
  joinPassphrase?: string; // Optional household join security password
  createdAt: string;
  updatedAt: string;
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
 * Creates a brand new household in Firestore with initial seeded members, chores, and rewards.
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
    createdAt: now,
    updatedAt: now,
  };

  // 1. Save Household root document
  await setDoc(doc(db, 'households', householdId), householdData);

  // 2. Seed initial collection batch
  const batch = writeBatch(db);

  // Members
  INITIAL_MEMBERS.forEach((member) => {
    const memberRef = doc(db, 'households', householdId, 'members', member.id);
    batch.set(memberRef, { ...member, householdId });
  });

  // Chores
  INITIAL_CHORES.forEach((chore) => {
    const choreRef = doc(db, 'households', householdId, 'chores', chore.id);
    batch.set(choreRef, { ...chore, householdId });
  });

  // Rewards
  INITIAL_REWARDS.forEach((reward) => {
    const rewardRef = doc(db, 'households', householdId, 'rewards', reward.id);
    batch.set(rewardRef, { ...reward, householdId });
  });

  // Sample Logs
  const sampleLogs = generateSampleLogs();
  sampleLogs.forEach((log) => {
    const logRef = doc(db, 'households', householdId, 'logs', log.id);
    batch.set(logRef, { ...log, householdId });
  });

  await batch.commit();

  // Set active session
  setCurrentHouseholdId(householdId);

  return householdData;
}

/**
 * Look up a household by its 6-character Family Join Code
 */
export async function findHouseholdByCode(code: string): Promise<CloudHousehold | null> {
  const normalized = code.trim().toUpperCase();
  const q = query(
    collection(db, 'households'),
    where('householdCode', '==', normalized)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }

  const docData = snapshot.docs[0].data() as CloudHousehold;
  return docData;
}

/**
 * Fetch Household Details
 */
export async function getHousehold(householdId: string): Promise<CloudHousehold | null> {
  const snap = await getDoc(doc(db, 'households', householdId));
  if (!snap.exists()) return null;
  return snap.data() as CloudHousehold;
}

/**
 * Subscribe to Real-Time Household Info
 */
export function subscribeHousehold(
  householdId: string, 
  callback: (info: HouseholdInfo, household: CloudHousehold) => void
): Unsubscribe {
  return onSnapshot(doc(db, 'households', householdId), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as CloudHousehold;
      callback({
        familyName: data.familyName,
        houseAddressOrMotto: data.houseAddressOrMotto,
        housePhotoUrl: data.housePhotoUrl,
      }, data);
    }
  });
}

/**
 * Subscribe to Real-Time Members
 */
export function subscribeMembers(
  householdId: string, 
  callback: (members: HouseholdMember[]) => void
): Unsubscribe {
  const membersRef = collection(db, 'households', householdId, 'members');
  return onSnapshot(membersRef, (snapshot) => {
    const members: HouseholdMember[] = [];
    snapshot.forEach((doc) => {
      members.push(doc.data() as HouseholdMember);
    });
    callback(members);
  });
}

/**
 * Subscribe to Real-Time Chores
 */
export function subscribeChores(
  householdId: string, 
  callback: (chores: Chore[]) => void
): Unsubscribe {
  const choresRef = collection(db, 'households', householdId, 'chores');
  return onSnapshot(choresRef, (snapshot) => {
    const chores: Chore[] = [];
    snapshot.forEach((doc) => {
      chores.push(doc.data() as Chore);
    });
    callback(chores);
  });
}

/**
 * Subscribe to Real-Time Logs
 */
export function subscribeLogs(
  householdId: string, 
  callback: (logs: ChoreAssignmentLog[]) => void
): Unsubscribe {
  const logsRef = collection(db, 'households', householdId, 'logs');
  return onSnapshot(logsRef, (snapshot) => {
    const logs: ChoreAssignmentLog[] = [];
    snapshot.forEach((doc) => {
      logs.push(doc.data() as ChoreAssignmentLog);
    });
    callback(logs);
  });
}

/**
 * Subscribe to Real-Time Rewards
 */
export function subscribeRewards(
  householdId: string, 
  callback: (rewards: RewardItem[]) => void
): Unsubscribe {
  const rewardsRef = collection(db, 'households', householdId, 'rewards');
  return onSnapshot(rewardsRef, (snapshot) => {
    const rewards: RewardItem[] = [];
    snapshot.forEach((doc) => {
      rewards.push(doc.data() as RewardItem);
    });
    callback(rewards);
  });
}

/**
 * Subscribe to Real-Time Reward Claims
 */
export function subscribeClaims(
  householdId: string, 
  callback: (claims: RewardClaim[]) => void
): Unsubscribe {
  const claimsRef = collection(db, 'households', householdId, 'claims');
  return onSnapshot(claimsRef, (snapshot) => {
    const claims: RewardClaim[] = [];
    snapshot.forEach((doc) => {
      claims.push(doc.data() as RewardClaim);
    });
    callback(claims);
  });
}

/**
 * Real-Time Firestore Mutation Helpers
 */

export async function syncHouseholdInfoToCloud(householdId: string, info: HouseholdInfo): Promise<void> {
  await updateDoc(doc(db, 'households', householdId), {
    familyName: info.familyName,
    houseAddressOrMotto: info.houseAddressOrMotto || '',
    housePhotoUrl: info.housePhotoUrl || '',
    updatedAt: new Date().toISOString(),
  });
}

export async function syncMemberToCloud(householdId: string, member: HouseholdMember): Promise<void> {
  await setDoc(doc(db, 'households', householdId, 'members', member.id), member, { merge: true });
}

export async function syncAllMembersToCloud(householdId: string, members: HouseholdMember[]): Promise<void> {
  const batch = writeBatch(db);
  members.forEach((m) => {
    const ref = doc(db, 'households', householdId, 'members', m.id);
    batch.set(ref, m, { merge: true });
  });
  await batch.commit();
}

export async function syncChoreToCloud(householdId: string, chore: Chore): Promise<void> {
  await setDoc(doc(db, 'households', householdId, 'chores', chore.id), chore, { merge: true });
}

export async function deleteChoreFromCloud(householdId: string, choreId: string): Promise<void> {
  await deleteDoc(doc(db, 'households', householdId, 'chores', choreId));
}

export async function syncAllChoresToCloud(householdId: string, chores: Chore[]): Promise<void> {
  const batch = writeBatch(db);
  chores.forEach((c) => {
    const ref = doc(db, 'households', householdId, 'chores', c.id);
    batch.set(ref, c, { merge: true });
  });
  await batch.commit();
}

export async function syncLogToCloud(householdId: string, log: ChoreAssignmentLog): Promise<void> {
  await setDoc(doc(db, 'households', householdId, 'logs', log.id), log, { merge: true });
}

export async function syncAllLogsToCloud(householdId: string, logs: ChoreAssignmentLog[]): Promise<void> {
  const batch = writeBatch(db);
  logs.forEach((l) => {
    const ref = doc(db, 'households', householdId, 'logs', l.id);
    batch.set(ref, l, { merge: true });
  });
  await batch.commit();
}

export async function syncRewardToCloud(householdId: string, reward: RewardItem): Promise<void> {
  await setDoc(doc(db, 'households', householdId, 'rewards', reward.id), reward, { merge: true });
}

export async function syncAllRewardsToCloud(householdId: string, rewards: RewardItem[]): Promise<void> {
  const batch = writeBatch(db);
  rewards.forEach((r) => {
    const ref = doc(db, 'households', householdId, 'rewards', r.id);
    batch.set(ref, r, { merge: true });
  });
  await batch.commit();
}

export async function deleteRewardFromCloud(householdId: string, rewardId: string): Promise<void> {
  await deleteDoc(doc(db, 'households', householdId, 'rewards', rewardId));
}

export async function syncClaimToCloud(householdId: string, claim: RewardClaim): Promise<void> {
  await setDoc(doc(db, 'households', householdId, 'claims', claim.id), claim, { merge: true });
}

export async function syncAllClaimsToCloud(householdId: string, claims: RewardClaim[]): Promise<void> {
  const batch = writeBatch(db);
  claims.forEach((c) => {
    const ref = doc(db, 'households', householdId, 'claims', c.id);
    batch.set(ref, c, { merge: true });
  });
  await batch.commit();
}
