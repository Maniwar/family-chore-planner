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
  rarity: 'Standard' | 'Rare' | 'Epic' | 'Mythic' | 'Legendary';
  rarityBadge: string;
  badgeColor: string;
  tagline: string;
  features: string[];
}

export const COSMETIC_ITEMS: CosmeticAvatarItem[] = [
  {
    id: 'cos_neon_glow',
    name: 'Cyber Ice Glow Frame',
    type: 'frame',
    icon: 'Sparkles',
    pointCost: 85,
    minLevel: 2,
    rarity: 'Rare',
    rarityBadge: 'Rare • Cyber',
    badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-200 dark:border-cyan-700',
    tagline: 'High-voltage cryogenic neon laser border with orbital photon pulses.',
    description: 'Electric cyan neon laser rim featuring a revolving cyber photon spark, animated cardinal compass nodes, and a frosted cryo-aura.',
    features: ['Revolving Orbital Photon', 'Cryo Laser Pulse Ring', 'Cardinal Compass Nodes'],
    cssClass: 'cos_neon_glow ring-2 ring-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.7)]',
  },
  {
    id: 'cos_rainbow_sparkle',
    name: 'Rainbow Prismatic Aura',
    type: 'frame',
    icon: 'Sparkles',
    pointCost: 95,
    minLevel: 2,
    rarity: 'Rare',
    rarityBadge: 'Rare • Prismatic',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700',
    tagline: 'Hypnotic continuous 360° rainbow gemstone conic aura with dual orbiting stars.',
    description: 'A continuously rotating iridescent gemstone aura passing through sapphire, emerald, and amber with counter-orbiting diamond stars.',
    features: ['360° Rainbow Conic Spin', 'Counter-Orbiting Stars', 'Chromatic Gemstone Sheen'],
    cssClass: 'cos_rainbow_sparkle ring-2 ring-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.7)]',
  },
  {
    id: 'cos_fire_gold',
    name: 'Golden Champion Aura',
    type: 'frame',
    icon: 'Trophy',
    pointCost: 180,
    minLevel: 3,
    rarity: 'Epic',
    rarityBadge: 'Epic • Prestige',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700',
    tagline: 'Radiant 24K gold championship ring with floating crown and specular sweeps.',
    description: 'Polished 24K gold concentric frame crowned with an animated levitating Champion Crown and orbiting gold dust particles.',
    features: ['Floating Champion Crown', 'Dual 24K Gold Concentric Rings', 'Golden Stardust Sparkles'],
    cssClass: 'cos_fire_gold ring-3 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)]',
  },
  {
    id: 'cos_ruby_fire',
    name: 'Dragon Ruby Crest',
    type: 'frame',
    icon: 'Zap',
    pointCost: 210,
    minLevel: 3,
    rarity: 'Epic',
    rarityBadge: 'Epic • Dragon Flame',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-700',
    tagline: 'Scorching crimson dragon magma flames with ascending embers and sharp horns.',
    description: 'Blazing dragon fire frame crowned with fiery dragon horns and a glowing ruby core, with animated embers rising upward.',
    features: ['Dragon Horns & Ruby Core', 'Ascending Magma Embers', 'Fiery Living Heatwave Rim'],
    cssClass: 'cos_ruby_fire ring-3 ring-rose-500 shadow-[0_0_16px_rgba(244,63,94,0.8)]',
  },
  {
    id: 'cos_galaxy_void',
    name: 'Cosmic Galaxy Crown',
    type: 'frame',
    icon: 'Crown',
    pointCost: 350,
    minLevel: 4,
    rarity: 'Mythic',
    rarityBadge: 'Mythic • Celestial',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-700',
    tagline: 'Deep interstellar violet nebula vortex with 3 orbiting planetary stars.',
    description: 'Swirling deep ultraviolet accretion ring crowned with an interstellar star crown and 3 multi-speed orbiting planetary bodies.',
    features: ['3-Body Planetary Orbits', 'Cosmic Galaxy Star Crown', 'Ultraviolet Nebula Vortex'],
    cssClass: 'cos_galaxy_void ring-4 ring-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.85)]',
  },
  {
    id: 'cos_phoenix_wings',
    name: 'Blazing Phoenix Wings',
    type: 'frame',
    icon: 'Crown',
    pointCost: 750,
    minLevel: 5,
    rarity: 'Legendary',
    rarityBadge: 'LEGENDARY • Solar God',
    badgeColor: 'bg-gradient-to-r from-amber-500 to-red-500 text-white border-amber-300 shadow-sm',
    tagline: 'The supreme chore artifact: animated celestial wings, solar crown, and divine flares.',
    description: 'The pinnacle of achievement. Majestic animated glowing golden-crimson phoenix wings fluttering on both sides, solar flame halo, and celestial embers.',
    features: ['Fluttering Celestial Wings', 'Solar Phoenix Flame Halo', 'Ascending Divine Embers', 'Hyper-Radiant Flare Aura'],
    cssClass: 'cos_phoenix_wings ring-4 ring-amber-500 shadow-[0_0_24px_rgba(245,158,11,0.95)] ring-offset-2 ring-offset-slate-900',
  },
];
