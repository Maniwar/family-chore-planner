import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Chore, HouseholdMember, GoogleCalendarItem, CalendarSyncLog } from '../types';

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              expires_in?: number;
            }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

// Initialize Firebase
const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope('https://www.googleapis.com/auth/calendar');
googleAuthProvider.addScope('https://www.googleapis.com/auth/calendar.events');
googleAuthProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

const STORAGE_KEYS = {
  CALENDAR_TOKEN: 'family_chores_gcal_token',
  TOKEN_EXPIRES_AT: 'family_chores_gcal_expires_at',
  SELECTED_CALENDAR_ID: 'family_chores_gcal_calendar_id',
  SYNC_LOGS: 'family_chores_gcal_sync_logs',
  USER_INFO: 'family_chores_gcal_user',
};

// In-memory token cache as required by workspace integration
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Check if user has a valid active Google Calendar token
export function getSavedCalendarToken(): string | null {
  if (cachedAccessToken) return cachedAccessToken;

  const token = localStorage.getItem(STORAGE_KEYS.CALENDAR_TOKEN);
  const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
  if (!token || !expiresAt) return null;
  if (Date.now() > Number(expiresAt)) {
    localStorage.removeItem(STORAGE_KEYS.CALENDAR_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    cachedAccessToken = null;
    return null;
  }
  cachedAccessToken = token;
  return token;
}

export function saveCalendarToken(token: string, expiresInSeconds: number = 3600): void {
  cachedAccessToken = token;
  const expiresAt = Date.now() + (expiresInSeconds - 60) * 1000;
  try {
    localStorage.setItem(STORAGE_KEYS.CALENDAR_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, String(expiresAt));
  } catch {}
}

export function clearCalendarToken(): void {
  cachedAccessToken = null;
  try {
    localStorage.removeItem(STORAGE_KEYS.CALENDAR_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_CALENDAR_ID);
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
  } catch {}
  firebaseSignOut(auth).catch(() => {});
}

export function getSavedCalendarId(): string {
  return localStorage.getItem(STORAGE_KEYS.SELECTED_CALENDAR_ID) || 'primary';
}

export function saveSelectedCalendarId(calendarId: string): void {
  localStorage.setItem(STORAGE_KEYS.SELECTED_CALENDAR_ID, calendarId);
}

export function getSavedSyncLogs(): CalendarSyncLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveSyncLogs(logs: CalendarSyncLog[]): void {
  localStorage.setItem(STORAGE_KEYS.SYNC_LOGS, JSON.stringify(logs.slice(0, 100)));
}

// Request token via Firebase Auth popup with Google Identity Services fallback
export async function requestGoogleCalendarAuth(): Promise<{ accessToken: string; user?: User | null }> {
  isSigningIn = true;
  try {
    // 1. Primary: Firebase Auth Popup Flow
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (credential?.accessToken) {
      saveCalendarToken(credential.accessToken, 3600);
      try {
        localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify({
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
        }));
      } catch {}
      return { accessToken: credential.accessToken, user: result.user };
    }
  } catch (firebaseErr: any) {
    console.warn('Firebase signInWithPopup flow error, trying Google Identity Services fallback:', firebaseErr);
  } finally {
    isSigningIn = false;
  }

  // 2. Fallback: Google Identity Services token client using OAuth client ID
  return new Promise(async (resolve, reject) => {
    try {
      let clientId = firebaseConfig.oAuthClientId || '695929293431-nsu6ggrtjokv5ififpepebt5su3rtsmp.apps.googleusercontent.com';
      try {
        const res = await fetch('/api/auth/client-id');
        if (res.ok) {
          const data = await res.json();
          if (data.client_id || data.clientId) {
            clientId = data.client_id || data.clientId;
          }
        }
      } catch {}

      if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
        reject(new Error('Google Identity Services SDK is not loaded. Please refresh the page.'));
        return;
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
        callback: (response) => {
          if (response.error) {
            reject(new Error(`Google Calendar Auth Failed: ${response.error}`));
            return;
          }
          if (response.access_token) {
            saveCalendarToken(response.access_token, response.expires_in || 3600);
            resolve({ accessToken: response.access_token });
          } else {
            reject(new Error('No access token returned from Google authentication.'));
          }
        },
      });

      client.requestAccessToken();
    } catch (e: any) {
      reject(e);
    }
  });
}

// Fetch list of user's Google Calendars
export async function fetchGoogleCalendars(accessToken: string): Promise<GoogleCalendarItem[]> {
  const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearCalendarToken();
      throw new Error('Google authentication expired. Please reconnect your Google Calendar.');
    }
    throw new Error(`Failed to fetch calendars: ${response.statusText}`);
  }

  const data = await response.json();
  const items: GoogleCalendarItem[] = (data.items || []).map((cal: any) => ({
    id: cal.id,
    summary: cal.summary,
    description: cal.description,
    primary: cal.primary,
    backgroundColor: cal.backgroundColor,
    accessRole: cal.accessRole,
  }));

  return items;
}

// Create a dedicated "Family Chores" calendar if user wants
export async function createFamilyChoreCalendar(accessToken: string, summary: string = '🏡 Family Chores & Tasks'): Promise<GoogleCalendarItem> {
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary,
      description: 'Household chores, inspection schedules, and family tasks synced from Family Chore Hub',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create calendar: ${response.statusText}`);
  }

  const created = await response.json();
  return {
    id: created.id,
    summary: created.summary,
    description: created.description,
    primary: false,
  };
}

// Helper to determine event start & end times based on chore schedule
function getEventStartEndTime(dateStr: string, chore: Chore): { startIso: string; endIso: string } {
  let time = chore.scheduledTime || '09:00';
  
  if (!chore.scheduledTime) {
    switch (chore.timeOfDay) {
      case 'morning': time = '08:30'; break;
      case 'afternoon': time = '15:30'; break;
      case 'evening': time = '18:30'; break;
      case 'bedtime': time = '20:30'; break;
      default: time = '10:00'; break;
    }
  }

  const [hours, minutes] = time.split(':').map(Number);
  const startDate = new Date(`${dateStr}T${String(hours || 9).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')}:00`);
  
  const durationMinutes = chore.estimatedMinutes || 25;
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  return {
    startIso: startDate.toISOString(),
    endIso: endDate.toISOString(),
  };
}

// Sync a single chore to Google Calendar
export async function syncChoreToGoogleCalendar(
  accessToken: string,
  calendarId: string,
  chore: Chore,
  member: HouseholdMember | null,
  dateStr: string
): Promise<{ eventId: string; htmlLink: string }> {
  const { startIso, endIso } = getEventStartEndTime(dateStr, chore);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';

  const memberName = member ? `${member.avatarEmoji} ${member.name}` : 'Unassigned Helper';
  const checklistText = chore.qualityChecklist.length > 0
    ? `\n\n📋 Quality Inspection Checklist:\n${chore.qualityChecklist.map((step, i) => `  [ ] ${step}`).join('\n')}`
    : '';

  const description = `✨ Helper Assigned: ${memberName}\n` +
    `⭐ Reward Points: ${chore.defaultPoints} pts\n` +
    `🏠 Category: ${chore.category}\n` +
    `⏱️ Estimated Time: ${chore.estimatedMinutes} mins\n` +
    (chore.description ? `\n📝 Instructions: ${chore.description}` : '') +
    checklistText +
    `\n\n🔍 Mom's Quality Standard: Must be inspected and graded before points are credited.\n` +
    `Synced via Family Chore & Quality Tracker.`;

  const eventPayload = {
    summary: `🧹 ${chore.title} — ${member ? member.name : 'Helper'}`,
    description,
    start: {
      dateTime: startIso,
      timeZone,
    },
    end: {
      dateTime: endIso,
      timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 15 },
        { method: 'popup', minutes: 5 },
      ],
    },
  };

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventPayload),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Google Calendar sync failed (${response.status}): ${errBody}`);
  }

  const result = await response.json();
  return {
    eventId: result.id,
    htmlLink: result.htmlLink || 'https://calendar.google.com',
  };
}
