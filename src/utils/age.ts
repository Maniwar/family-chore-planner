/**
 * Dynamic age calculation utilities.
 * Ensures family member ages progress forward dynamically based on their birth date
 * rather than remaining static values.
 */

import { HouseholdMember } from '../types';

/**
 * Calculates dynamic age in full years from a birth date string (YYYY-MM-DD)
 * relative to a given reference date (defaults to today).
 */
export function calculateAge(birthDateStr?: string, referenceDate: string | Date = new Date()): number {
  if (!birthDateStr) return 0;
  
  const refDate = typeof referenceDate === 'string' 
    ? new Date(referenceDate.length === 10 ? `${referenceDate}T12:00:00` : referenceDate) 
    : referenceDate;
  
  const parts = birthDateStr.split('-');
  if (parts.length < 3) return 0;
  
  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1; // 0-indexed
  const birthDay = parseInt(parts[2], 10);
  
  const birth = new Date(birthYear, birthMonth, birthDay);
  
  let age = refDate.getFullYear() - birth.getFullYear();
  const m = refDate.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && refDate.getDate() < birth.getDate())) {
    age--;
  }
  
  return Math.max(0, age);
}

/**
 * Returns the effective current age of a household member.
 * If birthDate is specified, calculates dynamic age.
 * Falls back to member.age if birthDate is missing.
 */
export function getMemberEffectiveAge(
  member: Pick<HouseholdMember, 'birthDate' | 'age'>,
  referenceDate?: string | Date
): number | undefined {
  if (member.birthDate) {
    return calculateAge(member.birthDate, referenceDate);
  }
  return member.age;
}

/**
 * Derives an estimated ISO birth date string (YYYY-MM-DD) for a given age in years,
 * placing their birthday in the middle of their birth year.
 */
export function estimateBirthDateFromAge(age: number): string {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - age;
  // Use mid-year default
  return `${birthYear}-06-15`;
}
