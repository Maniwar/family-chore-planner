import { HouseholdMember, HouseholdInfo } from '../types';
import { getMemberProgression } from './progression';

export interface HouseLevelInfo {
  level: number;
  title: string;
  badgeEmoji: string;
  minXp: number;
  maxXp: number;
  epicSubtitle: string;
  description: string;
  unlockedPerks: string[];
  bannerGradient: string;
  badgeClass: string;
  borderClass: string;
  accentText: string;
  auraGlow: string;
}

export const HOUSE_LEVELS: HouseLevelInfo[] = [
  {
    level: 1,
    title: 'Cozy Starter Cottage',
    badgeEmoji: '🏡',
    minXp: 0,
    maxXp: 299,
    epicSubtitle: 'The Hearth of Teamwork',
    description: 'A warm, humble home where daily chore teamwork begins. Every made bed and cleared dish lays the foundation!',
    unlockedPerks: [
      'Daily Chore Tracking & Star Points',
      'Starter Helper Reward Claims',
      'Individual & Family Progress Bars'
    ],
    bannerGradient: 'from-amber-600/90 via-orange-600/80 to-amber-700/90',
    badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    borderClass: 'border-amber-300 dark:border-amber-700',
    accentText: 'text-amber-600 dark:text-amber-400',
    auraGlow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
  },
  {
    level: 2,
    title: 'Sparkling Family Haven',
    badgeEmoji: '✨',
    minXp: 300,
    maxXp: 699,
    epicSubtitle: 'Sunlight & Gleaming Counters',
    description: 'Counters gleam and rooms stay tidy! The family rhythm is established and chores get done with pride.',
    unlockedPerks: [
      'House Evolution Badge on Fridge Schedule',
      '+5% Weekly Teamwork Bonus Points preview',
      'Unlocked Silver Tier Reward Milestones'
    ],
    bannerGradient: 'from-emerald-600/90 via-teal-600/80 to-emerald-700/90',
    badgeClass: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
    borderClass: 'border-emerald-300 dark:border-emerald-700',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    auraGlow: 'shadow-[0_0_25px_rgba(16,185,129,0.3)]',
  },
  {
    level: 3,
    title: 'Harmonious Manor',
    badgeEmoji: '🏰',
    minXp: 700,
    maxXp: 1299,
    epicSubtitle: 'Grand Halls of Order & Peace',
    description: 'A stately home where chores are conquered with master efficiency. Harmony and spotless rooms reign supreme!',
    unlockedPerks: [
      'Family Movie Night & Outing Perk Eligibility',
      'Avatar Aura Cosmetics in Helper Closet',
      'Weekend Team Challenge Boosts'
    ],
    bannerGradient: 'from-sky-600/90 via-indigo-600/80 to-blue-700/90',
    badgeClass: 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-700',
    borderClass: 'border-sky-300 dark:border-sky-700',
    accentText: 'text-sky-600 dark:text-sky-400',
    auraGlow: 'shadow-[0_0_25px_rgba(59,130,246,0.35)]',
  },
  {
    level: 4,
    title: 'Fortress of Tidiness',
    badgeEmoji: '🛡️',
    minXp: 1300,
    maxXp: 2199,
    epicSubtitle: 'Impenetrable Defense Against Clutter',
    description: 'Mess has no chance here! The house stands fortified by disciplined routines and champion family synergy.',
    unlockedPerks: [
      'House Milestone Pizza Party Trophy',
      'Gold Tier Reward Multipliers',
      'Epic House Crest on Printable Fridge Charts'
    ],
    bannerGradient: 'from-purple-600/90 via-fuchsia-600/80 to-violet-700/90',
    badgeClass: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700',
    borderClass: 'border-purple-300 dark:border-purple-700',
    accentText: 'text-purple-600 dark:text-purple-400',
    auraGlow: 'shadow-[0_0_30px_rgba(168,85,247,0.35)]',
  },
  {
    level: 5,
    title: 'Royal Palace of Harmony',
    badgeEmoji: '👑',
    minXp: 2200,
    maxXp: 3499,
    epicSubtitle: 'Golden Halls & Majestic Synergy',
    description: 'A palace fit for royalty! Every helper is a titled lord of tidiness, keeping every corner radiant.',
    unlockedPerks: [
      'Grand Outing & Shopping Spree Privileges',
      'Royal Golden House Aura Glow',
      '+10% Permanent Family Star Bonus'
    ],
    bannerGradient: 'from-amber-500/95 via-yellow-500/90 to-amber-600/95',
    badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-600',
    borderClass: 'border-amber-400 dark:border-amber-600',
    accentText: 'text-amber-600 dark:text-amber-400',
    auraGlow: 'shadow-[0_0_35px_rgba(245,158,11,0.45)]',
  },
  {
    level: 6,
    title: 'Citadel of Family Champions',
    badgeEmoji: '🌟',
    minXp: 3500,
    maxXp: 5199,
    epicSubtitle: 'Legendary Realm of Spotless Wonder',
    description: 'Renowned far and wide for unparalleled cleanliness and teamwork. A legendary monument to family love!',
    unlockedPerks: [
      'Hall of Fame Trophy Showcase Unlocked',
      'Legendary Cosmic Theme Access',
      'Family Vacation Grand Celebration Badge'
    ],
    bannerGradient: 'from-rose-600/95 via-pink-600/90 to-rose-700/95',
    badgeClass: 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-400 dark:border-rose-600',
    borderClass: 'border-rose-400 dark:border-rose-600',
    accentText: 'text-rose-600 dark:text-rose-400',
    auraGlow: 'shadow-[0_0_35px_rgba(244,63,94,0.45)]',
  },
  {
    level: 7,
    title: 'Celestial Sanctuary',
    badgeEmoji: '🌌',
    minXp: 5200,
    maxXp: 7499,
    epicSubtitle: 'Floating Among the Stars in Pure Order',
    description: 'A transcendent home where cleanliness happens with the effortless grace of orbiting constellations.',
    unlockedPerks: [
      'Mythic Celestial House Halo',
      'Ultimate Star Multiplier (1.25x)',
      'Cosmic Family Grandmaster Status'
    ],
    bannerGradient: 'from-cyan-600/95 via-blue-600/90 to-indigo-800/95',
    badgeClass: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-200 border-cyan-400 dark:border-cyan-600',
    borderClass: 'border-cyan-400 dark:border-cyan-600',
    accentText: 'text-cyan-600 dark:text-cyan-400',
    auraGlow: 'shadow-[0_0_40px_rgba(6,182,212,0.5)]',
  },
  {
    level: 8,
    title: 'Olympus of Grandmasters',
    badgeEmoji: '⚡',
    minXp: 7500,
    maxXp: 999999,
    epicSubtitle: 'The Eternal Peak of Household Perfection',
    description: 'The supreme pinnacle of family cooperation. Every task is an art form, and harmony is eternal.',
    unlockedPerks: [
      'Infinite Family Glory & Eternal Hall of Fame',
      'Supreme Jackpot Champion Badge',
      'Ultimate Master of the Household Title'
    ],
    bannerGradient: 'from-amber-400 via-purple-600 to-indigo-900',
    badgeClass: 'bg-gradient-to-r from-amber-200 to-purple-200 text-purple-950 border-purple-400',
    borderClass: 'border-purple-400',
    accentText: 'text-purple-600 dark:text-purple-400',
    auraGlow: 'shadow-[0_0_50px_rgba(168,85,247,0.6)]',
  }
];

export interface MemberHouseContribution {
  member: HouseholdMember;
  playerXp: number;
  playerLevel: number;
  playerLevelTitle: string;
  badgeEmoji: string;
  contributionPercent: number; // 0 to 100
  choresCompletedEstimate: number;
  isLeadContributor: boolean;
}

export interface HouseProgressionResult {
  totalHouseXp: number;
  currentLevel: HouseLevelInfo;
  nextLevel: HouseLevelInfo | null;
  levelProgressPercent: number; // 0 to 100
  xpInCurrentLevel: number;
  xpSpanForLevel: number;
  pointsToNextLevel: number;
  memberContributions: MemberHouseContribution[];
  leadContributor: MemberHouseContribution | null;
  totalFamilyMembers: number;
  isMaxLevel: boolean;
}

export function calculateHouseProgression(
  members: HouseholdMember[],
  householdInfo?: HouseholdInfo
): HouseProgressionResult {
  // Aggregate total XP from all household members
  const memberProgressions = members.map(member => {
    const prog = getMemberProgression(member);
    return {
      member,
      playerXp: prog.xp,
      playerLevel: prog.currentLevel.level,
      playerLevelTitle: prog.currentLevel.title,
      badgeEmoji: prog.currentLevel.badgeEmoji,
      choresCompletedEstimate: member.starsCount || Math.round(prog.xp / 15),
    };
  });

  const sumMemberXp = memberProgressions.reduce((acc, curr) => acc + curr.playerXp, 0);
  
  // If a manual or reset House XP is specified in householdInfo, use it; otherwise use sum
  const totalHouseXp = householdInfo?.customHouseXp !== undefined 
    ? Math.max(0, Math.round(householdInfo.customHouseXp))
    : sumMemberXp;

  // Find current house level
  const currentLevel = HOUSE_LEVELS.slice().reverse().find(l => totalHouseXp >= l.minXp) || HOUSE_LEVELS[0];
  const nextLevel = HOUSE_LEVELS.find(l => l.level === currentLevel.level + 1) || null;

  const xpInCurrentLevel = totalHouseXp - currentLevel.minXp;
  const xpSpanForLevel = nextLevel ? nextLevel.minXp - currentLevel.minXp : 2500;
  const levelProgressPercent = nextLevel
    ? Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpSpanForLevel) * 100)))
    : 100;
  const pointsToNextLevel = nextLevel ? Math.max(0, nextLevel.minXp - totalHouseXp) : 0;

  // Find highest contributor
  const maxContributedXp = Math.max(...memberProgressions.map(m => m.playerXp), 0);

  const memberContributions: MemberHouseContribution[] = memberProgressions
    .map(mp => {
      const contributionPercent = totalHouseXp > 0 ? Math.round((mp.playerXp / totalHouseXp) * 100) : 0;
      return {
        member: mp.member,
        playerXp: mp.playerXp,
        playerLevel: mp.playerLevel,
        playerLevelTitle: mp.playerLevelTitle,
        badgeEmoji: mp.badgeEmoji,
        contributionPercent,
        choresCompletedEstimate: mp.choresCompletedEstimate,
        isLeadContributor: mp.playerXp > 0 && mp.playerXp === maxContributedXp,
      };
    })
    .sort((a, b) => b.playerXp - a.playerXp);

  const leadContributor = memberContributions.find(m => m.isLeadContributor) || memberContributions[0] || null;

  return {
    totalHouseXp,
    currentLevel,
    nextLevel,
    levelProgressPercent,
    xpInCurrentLevel,
    xpSpanForLevel,
    pointsToNextLevel,
    memberContributions,
    leadContributor,
    totalFamilyMembers: members.length,
    isMaxLevel: nextLevel === null,
  };
}
