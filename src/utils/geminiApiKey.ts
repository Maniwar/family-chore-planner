/**
 * Client-side BYOK (Bring Your Own Key) utility for Google Gemini API.
 * 
 * Keys are stored strictly on the user's local device (localStorage)
 * and never persisted to the shared server or multi-household database.
 */

const STORAGE_KEY = 'family_chores_user_gemini_api_key';

export function getUserGeminiApiKey(): string | null {
  try {
    const key = localStorage.getItem(STORAGE_KEY);
    if (key && key.trim().length > 0) {
      return key.trim();
    }
  } catch (e) {
    console.warn('Could not read user Gemini API key from localStorage:', e);
  }
  return null;
}

export function setUserGeminiApiKey(key: string | null): void {
  try {
    if (key && key.trim().length > 0) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    // Dispatch a storage event so all components react immediately
    window.dispatchEvent(new CustomEvent('gemini-api-key-updated', { detail: { hasKey: Boolean(key) } }));
  } catch (e) {
    console.warn('Could not save user Gemini API key to localStorage:', e);
  }
}

export function hasUserGeminiApiKey(): boolean {
  return Boolean(getUserGeminiApiKey());
}

export interface ApiKeyStatus {
  hasUserKey: boolean;
  userKeyMasked?: string;
  hasServerKey: boolean;
}

export async function checkApiKeyStatus(): Promise<ApiKeyStatus> {
  const userKey = getUserGeminiApiKey();
  let hasServerKey = false;

  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      const data = await res.json();
      hasServerKey = Boolean(data.hasGeminiKey);
    }
  } catch {
    // Health check failed or offline
  }

  let userKeyMasked: string | undefined = undefined;
  if (userKey) {
    if (userKey.length > 8) {
      userKeyMasked = `${userKey.slice(0, 4)}...${userKey.slice(-4)}`;
    } else {
      userKeyMasked = '••••••••';
    }
  }

  return {
    hasUserKey: Boolean(userKey),
    userKeyMasked,
    hasServerKey,
  };
}

export async function testGeminiApiKey(keyToTest: string): Promise<{ success: boolean; message: string }> {
  const trimmed = keyToTest.trim();
  if (!trimmed) {
    return { success: false, message: 'Please enter an API key.' };
  }

  try {
    const res = await fetch('/api/ai/verify-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gemini-Api-Key': trimmed,
      },
      body: JSON.stringify({ key: trimmed }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.valid) {
      return { success: true, message: data.message || 'Key verified successfully! ✨' };
    } else {
      return { success: false, message: data.error || 'The API key appears invalid or expired.' };
    }
  } catch (e: any) {
    return { success: false, message: e.message || 'Verification request failed. Check your internet connection.' };
  }
}
