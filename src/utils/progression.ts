import { HouseholdMember } from '../types';

export interface LevelThreshold {
  level: number;
  title: string;
  badgeEmoji: string;
  minPoints: number;
  maxPoints: number;
  frameStyle: string; // Tailwind border / ring class
  perk: string;
}

export const PROGRESSION_LEVELS: LevelThreshold[] = [
  {
    level: 1,
    title: 'Rookie Helper',
    badgeEmoji: '🌱',
    minPoints: 0,
    maxPoints: 149,
    frameStyle: 'ring-1 ring-slate-300',
    perk: 'Unlocks Daily Chores & Starter Rewards (50–130 pts)',
  },
  {
    level: 2,
    title: 'Apprentice Helper',
    badgeEmoji: '🥉',
    minPoints: 150,
    maxPoints: 349,
    frameStyle: 'ring-2 ring-amber-500/60 shadow-xs',
    perk: 'Unlocks In-App Avatar Cosmetics & Silver Perks (180–280 pts)',
  },
  {
    level: 3,
    title: 'Household Star',
    badgeEmoji: '🥈',
    minPoints: 350,
    maxPoints: 549,
    frameStyle: 'ring-2 ring-slate-400 shadow-sm',
    perk: 'Unlocks $15 Cash Allowance & Privilege Cards (320–480 pts)',
  },
  {
    level: 4,
    title: 'Master Contributor',
    badgeEmoji: '🥇',
    minPoints: 550,
    maxPoints: 999,
    frameStyle: 'ring-3 ring-amber-400 shadow-md',
    perk: 'Unlocks $25 Cash (8% Bonus), Rule Breaker & Grand Outings (575–800 pts)',
  },
  {
    level: 5,
    title: 'Family Legend',
    badgeEmoji: '👑',
    minPoints: 1000,
    maxPoints: 2099,
    frameStyle: 'ring-3 ring-purple-500 shadow-lg ring-offset-1',
    perk: 'Unlocks $50 Cash (12% Bonus) & Shopping Spree (950–1,400 pts)',
  },
  {
    level: 6,
    title: 'Chore Grandmaster',
    badgeEmoji: '⚡',
    minPoints: 2100,
    maxPoints: 999999,
    frameStyle: 'ring-4 ring-rose-500 shadow-xl ring-offset-2',
    perk: 'The $100 Ultimate Cash Jackpot (16% Max Bonus! 2+ Months of Chores)',
  },
];

export function getMemberProgression(member: HouseholdMember) {
  // Use lifetimePoints for permanent player level progression (never lost on spends!)
  const xp = member.lifetimePoints ?? member.currentPoints ?? 0;
  
  const currentLevel = PROGRESSION_LEVELS.slice().reverse().find(l => xp >= l.minPoints) || PROGRESSION_LEVELS[0];
  const nextLevel = PROGRESSION_LEVELS.find(l => l.level === currentLevel.level + 1) || null;

  const pointsInLevel = xp - currentLevel.minPoints;
  const levelSpan = nextLevel ? nextLevel.minPoints - currentLevel.minPoints : 1000;
  const progressPercent = nextLevel 
    ? Math.min(100, Math.max(0, Math.round((pointsInLevel / levelSpan) * 100)))
    : 100;

  // Calculate Streak Multiplier bonus preview
  let streakMultiplier = 1.0;
  if (member.streakDays >= 14) streakMultiplier = 1.5; // +50% XP
  else if (member.streakDays >= 7) streakMultiplier = 1.25; // +25% XP
  else if (member.streakDays >= 3) streakMultiplier = 1.1; // +10% XP

  return {
    xp,
    currentLevel,
    nextLevel,
    progressPercent,
    pointsToNext: nextLevel ? Math.max(0, nextLevel.minPoints - xp) : 0,
    streakMultiplier,
  };
}

export interface CosmeticAvatarItem {
  id: string;
  name: string;
  type: 'frame' | 'theme_glow' | 'badge_title';
  icon: string;
  pointCost: number;
  minLevel: number;
  description: string;
  cssClass: string;
}

export const COSMETIC_ITEMS: CosmeticAvatarItem[] = [
  {
    id: 'cos_neon_glow',
    name: 'Cyber Ice Glow Frame',
    type: 'frame',
    icon: 'Sparkles',
    pointCost: 85,
    minLevel: 2,
    description: 'Frosted cyan laser rim around your profile avatar.',
    cssClass: 'ring-2 ring-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]',
  },
  {
    id: 'cos_rainbow_sparkle',
    name: 'Rainbow Prismatic Aura',
    type: 'frame',
    icon: 'Sparkle',
    pointCost: 95,
    minLevel: 2,
    description: 'Radiant emerald and rainbow gemstone sparkle shimmering around avatar.',
    cssClass: 'ring-2 ring-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.7)]',
  },
  {
    id: 'cos_fire_gold',
    name: 'Golden Champion Aura',
    type: 'frame',
    icon: 'Trophy',
    pointCost: 180,
    minLevel: 3,
    description: 'Glittering champion gold border that catches the eye.',
    cssClass: 'ring-3 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.7)]',
  },
  {
    id: 'cos_ruby_fire',
    name: 'Dragon Ruby Crest',
    type: 'frame',
    icon: 'Zap',
    pointCost: 210,
    minLevel: 3,
    description: 'Fiery crimson border with radiant dragon power.',
    cssClass: 'ring-3 ring-rose-500 shadow-[0_0_16px_rgba(244,63,94,0.7)]',
  },
  {
    id: 'cos_galaxy_void',
    name: 'Cosmic Galaxy Crown',
    type: 'frame',
    icon: 'Crown',
    pointCost: 350,
    minLevel: 4,
    description: 'Deep violet interstellar pulsing glow for top chore heroes.',
    cssClass: 'ring-4 ring-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8)]',
  },
  {
    id: 'cos_phoenix_wings',
    name: 'Blazing Phoenix Wings',
    type: 'frame',
    icon: 'Sparkles',
    pointCost: 750,
    minLevel: 5,
    description: 'Radiant celestial phoenix flames illuminating your profile photo.',
    cssClass: 'ring-4 ring-amber-500 shadow-[0_0_24px_rgba(245,158,11,0.9)] ring-offset-2 ring-offset-slate-900',
  },
];
