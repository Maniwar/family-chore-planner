/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCurrentHouseholdId, syncCompleteHouseholdToCloud } from './firebaseSync';

const STORAGE_KEYS = {
  PARENT_PIN: 'family_parent_pin',
  PIN_PROTECTION_ENABLED: 'family_parent_pin_enabled',
  SESSION_UNLOCKED: 'family_parent_session_unlocked',
};

export const DEFAULT_PIN = '1234';

export function getParentPin(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.PARENT_PIN) || DEFAULT_PIN;
  } catch {
    return DEFAULT_PIN;
  }
}

/**
 * Syncs the parent PIN and protection state from cloud household data into local storage.
 * Called automatically when a device connects to a household or receives a cloud update.
 */
export function syncParentPinFromCloud(cloudPin?: string, cloudPinEnabled?: boolean): void {
  try {
    if (cloudPin && /^\d{4}$/.test(cloudPin.trim())) {
      localStorage.setItem(STORAGE_KEYS.PARENT_PIN, cloudPin.trim());
    }
    if (cloudPinEnabled !== undefined) {
      localStorage.setItem(STORAGE_KEYS.PIN_PROTECTION_ENABLED, String(cloudPinEnabled));
    }
  } catch (e) {
    console.warn('Failed to sync parent PIN from cloud:', e);
  }
}

/**
 * Sets a new 4-digit Parent PIN locally and persists it to the Cloud Household
 * so all connected devices immediately adopt the new PIN.
 */
export function setParentPin(newPin: string, householdId?: string): boolean {
  const cleanPin = newPin.trim();
  if (!/^\d{4}$/.test(cleanPin)) {
    return false;
  }
  try {
    localStorage.setItem(STORAGE_KEYS.PARENT_PIN, cleanPin);

    // Sync to cloud if active household exists
    const targetHouseholdId = householdId || getCurrentHouseholdId();
    if (targetHouseholdId) {
      syncCompleteHouseholdToCloud(targetHouseholdId, { adminPin: cleanPin }).catch((err) => {
        console.warn('Could not sync PIN to cloud:', err);
      });
    }

    return true;
  } catch {
    return false;
  }
}

export function isPinProtectionEnabled(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.PIN_PROTECTION_ENABLED);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setPinProtectionEnabled(enabled: boolean, householdId?: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PIN_PROTECTION_ENABLED, String(enabled));

    // Sync to cloud if active household exists
    const targetHouseholdId = householdId || getCurrentHouseholdId();
    if (targetHouseholdId) {
      syncCompleteHouseholdToCloud(targetHouseholdId, { pinProtectionEnabled: enabled }).catch((err) => {
        console.warn('Could not sync PIN protection setting to cloud:', err);
      });
    }
  } catch {}
}

export function verifyParentPin(enteredPin: string): boolean {
  const currentPin = getParentPin();
  return enteredPin.trim() === currentPin.trim();
}

export function isParentSessionUnlocked(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.SESSION_UNLOCKED) === 'true';
  } catch {
    return false;
  }
}

export function setParentSessionUnlocked(unlocked: boolean): void {
  try {
    if (unlocked) {
      sessionStorage.setItem(STORAGE_KEYS.SESSION_UNLOCKED, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.SESSION_UNLOCKED);
    }
  } catch {}
}

export function resetPinToDefault(householdId?: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PARENT_PIN, DEFAULT_PIN);
    const targetHouseholdId = householdId || getCurrentHouseholdId();
    if (targetHouseholdId) {
      syncCompleteHouseholdToCloud(targetHouseholdId, { adminPin: DEFAULT_PIN }).catch(console.warn);
    }
  } catch {}
}

