/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const STORAGE_KEYS = {
  PARENT_PIN: 'family_parent_pin',
  PIN_PROTECTION_ENABLED: 'family_parent_pin_enabled',
  SESSION_UNLOCKED: 'family_parent_session_unlocked',
};

const DEFAULT_PIN = '1234';

export function getParentPin(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.PARENT_PIN) || DEFAULT_PIN;
  } catch {
    return DEFAULT_PIN;
  }
}

export function setParentPin(newPin: string): boolean {
  if (!/^\d{4}$/.test(newPin)) {
    return false;
  }
  try {
    localStorage.setItem(STORAGE_KEYS.PARENT_PIN, newPin);
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

export function setPinProtectionEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PIN_PROTECTION_ENABLED, String(enabled));
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

export function resetPinToDefault(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PARENT_PIN, DEFAULT_PIN);
  } catch {}
}
