/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ThemePreset = 
  | 'rose' 
  | 'fiesta' 
  | 'ocean' 
  | 'lavender' 
  | 'emerald' 
  | 'sunset' 
  | 'midnight' 
  | 'candy' 
  | 'citrus';

export interface ThemeConfig {
  id: ThemePreset;
  name: string;
  emoji: string;
  tagline: string;
  isDark: boolean;
  
  // App Canvas Background & Ambiance
  appBgClass: string;
  appTextClass: string;
  ambientGlow: {
    orb1: string;
    orb2: string;
    orb3: string;
  };

  // Header & Branding
  headerBg: string;
  headerBorder: string;
  headerLogoBg: string;
  headerLogoText: string;
  headerSubtitleText: string;
  headerAccentGlow: string;

  // Navigation
  navBg: string;
  navBorder: string;
  navActiveBg: string;
  navActiveText: string;
  navInactiveText: string;
  navHoverBg: string;
  navIndicator: string;

  // Primary Buttons & Highlights
  primaryBg: string;
  primaryHover: string;
  primaryText: string;
  primaryGradient: string;
  accentRing: string;

  // Badges & Chips
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;

  // Cards & Containers
  cardBg: string;
  cardBorder: string;
  cardHoverBorder: string;
  cardHeaderBg: string;
  cardText: string;
  cardSubtext: string;
  cardMutedBg: string;

  // Hero & Overview Banners
  heroBannerBg: string;
  heroBannerText: string;
  heroBannerBorder: string;
  heroBannerGlow: string;
}

export const THEMES: Record<ThemePreset, ThemeConfig> = {
  // 1. Cozy Family Rose (Warm, loving, classic)
  rose: {
    id: 'rose',
    name: 'Cozy Family Rose',
    emoji: '🌸',
    tagline: 'Warm petal pink & joyful blush accents',
    isDark: false,
    appBgClass: 'bg-[#fff9fa] text-slate-800',
    appTextClass: 'text-slate-800',
    ambientGlow: {
      orb1: 'bg-rose-300/25',
      orb2: 'bg-pink-200/30',
      orb3: 'bg-amber-200/20',
    },
    headerBg: 'bg-white/95 backdrop-blur-md',
    headerBorder: 'border-rose-100',
    headerLogoBg: 'bg-gradient-to-br from-rose-500 to-pink-600',
    headerLogoText: 'text-white',
    headerSubtitleText: 'text-rose-600',
    headerAccentGlow: 'from-rose-500/10 via-pink-500/5 to-transparent',
    navBg: 'bg-white/90 backdrop-blur-md',
    navBorder: 'border-rose-100',
    navActiveBg: 'bg-rose-500 text-white shadow-xs',
    navActiveText: 'text-white font-bold',
    navInactiveText: 'text-slate-600 hover:text-rose-700',
    navHoverBg: 'hover:bg-rose-50',
    navIndicator: 'bg-rose-500',
    primaryBg: 'bg-rose-600',
    primaryHover: 'hover:bg-rose-700',
    primaryText: 'text-white',
    primaryGradient: 'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500',
    accentRing: 'ring-rose-400',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    cardBg: 'bg-white/90 backdrop-blur-xs',
    cardBorder: 'border-rose-100/80',
    cardHoverBorder: 'hover:border-rose-300',
    cardHeaderBg: 'bg-rose-50/40',
    cardText: 'text-slate-900',
    cardSubtext: 'text-slate-500',
    cardMutedBg: 'bg-rose-50/30',
    heroBannerBg: 'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500',
    heroBannerText: 'text-white',
    heroBannerBorder: 'border-rose-400/30',
    heroBannerGlow: 'shadow-rose-500/20',
  },

  // 2. Tropical Fiesta Gold (Sunny, optimistic, warm energy)
  fiesta: {
    id: 'fiesta',
    name: 'Tropical Fiesta Gold',
    emoji: '🥭',
    tagline: 'Warm golden honey & sunny citrus marigold',
    isDark: false,
    appBgClass: 'bg-[#fffdf5] text-slate-800',
    appTextClass: 'text-slate-800',
    ambientGlow: {
      orb1: 'bg-amber-300/30',
      orb2: 'bg-orange-200/30',
      orb3: 'bg-yellow-200/30',
    },
    headerBg: 'bg-white/95 backdrop-blur-md',
    headerBorder: 'border-amber-100',
    headerLogoBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
    headerLogoText: 'text-slate-950',
    headerSubtitleText: 'text-amber-700',
    headerAccentGlow: 'from-amber-500/15 via-orange-500/5 to-transparent',
    navBg: 'bg-white/90 backdrop-blur-md',
    navBorder: 'border-amber-100',
    navActiveBg: 'bg-amber-500 text-slate-950 shadow-xs font-black',
    navActiveText: 'text-slate-950 font-black',
    navInactiveText: 'text-slate-600 hover:text-amber-800',
    navHoverBg: 'hover:bg-amber-50',
    navIndicator: 'bg-amber-500',
    primaryBg: 'bg-amber-500',
    primaryHover: 'hover:bg-amber-600',
    primaryText: 'text-slate-950 font-black',
    primaryGradient: 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400',
    accentRing: 'ring-amber-400',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-900 font-bold',
    badgeBorder: 'border-amber-200',
    cardBg: 'bg-white/90 backdrop-blur-xs',
    cardBorder: 'border-amber-100/80',
    cardHoverBorder: 'hover:border-amber-300',
    cardHeaderBg: 'bg-amber-50/40',
    cardText: 'text-slate-900',
    cardSubtext: 'text-slate-500',
    cardMutedBg: 'bg-amber-50/30',
    heroBannerBg: 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400',
    heroBannerText: 'text-slate-950',
    heroBannerBorder: 'border-amber-300/40',
    heroBannerGlow: 'shadow-amber-500/25',
  },

  // 3. Ocean Breeze & Coral (Calm, fresh coastal waters)
  ocean: {
    id: 'ocean',
    name: 'Ocean Breeze & Coral',
    emoji: '🌊',
    tagline: 'Refreshing seafoam teal & deep azure waters',
    isDark: false,
    appBgClass: 'bg-[#f0fbfb] text-slate-800',
    appTextClass: 'text-slate-800',
    ambientGlow: {
      orb1: 'bg-teal-300/25',
      orb2: 'bg-cyan-200/30',
      orb3: 'bg-sky-200/25',
    },
    headerBg: 'bg-white/95 backdrop-blur-md',
    headerBorder: 'border-teal-100',
    headerLogoBg: 'bg-gradient-to-br from-teal-500 to-cyan-600',
    headerLogoText: 'text-white',
    headerSubtitleText: 'text-teal-700',
    headerAccentGlow: 'from-teal-500/10 via-cyan-500/5 to-transparent',
    navBg: 'bg-white/90 backdrop-blur-md',
    navBorder: 'border-teal-100',
    navActiveBg: 'bg-teal-600 text-white shadow-xs',
    navActiveText: 'text-white font-bold',
    navInactiveText: 'text-slate-600 hover:text-teal-800',
    navHoverBg: 'hover:bg-teal-50',
    navIndicator: 'bg-teal-600',
    primaryBg: 'bg-teal-600',
    primaryHover: 'hover:bg-teal-700',
    primaryText: 'text-white',
    primaryGradient: 'bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-500',
    accentRing: 'ring-teal-400',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-800',
    badgeBorder: 'border-teal-200',
    cardBg: 'bg-white/90 backdrop-blur-xs',
    cardBorder: 'border-teal-100/80',
    cardHoverBorder: 'hover:border-teal-300',
    cardHeaderBg: 'bg-teal-50/40',
    cardText: 'text-slate-900',
    cardSubtext: 'text-slate-500',
    cardMutedBg: 'bg-teal-50/30',
    heroBannerBg: 'bg-gradient-to-r from-teal-700 via-cyan-700 to-sky-600',
    heroBannerText: 'text-white',
    heroBannerBorder: 'border-teal-400/30',
    heroBannerGlow: 'shadow-teal-600/20',
  },

  // 4. Twilight Lavender & Dreams (Dreamy, calm amethyst)
  lavender: {
    id: 'lavender',
    name: 'Twilight Lavender',
    emoji: '💜',
    tagline: 'Dreamy royal amethyst & serene twilight lilac',
    isDark: false,
    appBgClass: 'bg-[#faf6fe] text-slate-800',
    appTextClass: 'text-slate-800',
    ambientGlow: {
      orb1: 'bg-purple-300/25',
      orb2: 'bg-violet-200/30',
      orb3: 'bg-fuchsia-200/20',
    },
    headerBg: 'bg-white/95 backdrop-blur-md',
    headerBorder: 'border-purple-100',
    headerLogoBg: 'bg-gradient-to-br from-purple-600 to-violet-700',
    headerLogoText: 'text-white',
    headerSubtitleText: 'text-purple-700',
    headerAccentGlow: 'from-purple-500/10 via-violet-500/5 to-transparent',
    navBg: 'bg-white/90 backdrop-blur-md',
    navBorder: 'border-purple-100',
    navActiveBg: 'bg-purple-600 text-white shadow-xs',
    navActiveText: 'text-white font-bold',
    navInactiveText: 'text-slate-600 hover:text-purple-800',
    navHoverBg: 'hover:bg-purple-50',
    navIndicator: 'bg-purple-600',
    primaryBg: 'bg-purple-600',
    primaryHover: 'hover:bg-purple-700',
    primaryText: 'text-white',
    primaryGradient: 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-500',
    accentRing: 'ring-purple-400',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-200',
    cardBg: 'bg-white/90 backdrop-blur-xs',
    cardBorder: 'border-purple-100/80',
    cardHoverBorder: 'hover:border-purple-300',
    cardHeaderBg: 'bg-purple-50/40',
    cardText: 'text-slate-900',
    cardSubtext: 'text-slate-500',
    cardMutedBg: 'bg-purple-50/30',
    heroBannerBg: 'bg-gradient-to-r from-purple-700 via-violet-700 to-indigo-600',
    heroBannerText: 'text-white',
    heroBannerBorder: 'border-purple-400/30',
    heroBannerGlow: 'shadow-purple-600/20',
  },

  // 5. Enchanted Forest Sage (Natural, grounded, organic green)
  emerald: {
    id: 'emerald',
    name: 'Enchanted Forest Sage',
    emoji: '🌲',
    tagline: 'Lush botanical emerald & organic cool mint',
    isDark: false,
    appBgClass: 'bg-[#f3f9f4] text-slate-800',
    appTextClass: 'text-slate-800',
    ambientGlow: {
      orb1: 'bg-emerald-300/25',
      orb2: 'bg-green-200/30',
      orb3: 'bg-teal-200/20',
    },
    headerBg: 'bg-white/95 backdrop-blur-md',
    headerBorder: 'border-emerald-100',
    headerLogoBg: 'bg-gradient-to-br from-emerald-600 to-green-700',
    headerLogoText: 'text-white',
    headerSubtitleText: 'text-emerald-700',
    headerAccentGlow: 'from-emerald-500/10 via-teal-500/5 to-transparent',
    navBg: 'bg-white/90 backdrop-blur-md',
    navBorder: 'border-emerald-100',
    navActiveBg: 'bg-emerald-600 text-white shadow-xs',
    navActiveText: 'text-white font-bold',
    navInactiveText: 'text-slate-600 hover:text-emerald-800',
    navHoverBg: 'hover:bg-emerald-50',
    navIndicator: 'bg-emerald-600',
    primaryBg: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    primaryText: 'text-white',
    primaryGradient: 'bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600',
    accentRing: 'ring-emerald-400',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
    cardBg: 'bg-white/90 backdrop-blur-xs',
    cardBorder: 'border-emerald-100/80',
    cardHoverBorder: 'hover:border-emerald-300',
    cardHeaderBg: 'bg-emerald-50/40',
    cardText: 'text-slate-900',
    cardSubtext: 'text-slate-500',
    cardMutedBg: 'bg-emerald-50/30',
    heroBannerBg: 'bg-gradient-to-r from-emerald-700 via-green-700 to-teal-700',
    heroBannerText: 'text-white',
    heroBannerBorder: 'border-emerald-400/30',
    heroBannerGlow: 'shadow-emerald-600/20',
  },

  // 6. Sunset Canyon Terracotta (Rustic desert, warm earth tones)
  sunset: {
    id: 'sunset',
    name: 'Sunset Canyon Terracotta',
    emoji: '🌅',
    tagline: 'Warm terracotta clay & desert canyon glow',
    isDark: false,
    appBgClass: 'bg-[#fdf7f2] text-slate-800',
    appTextClass: 'text-slate-800',
    ambientGlow: {
      orb1: 'bg-orange-300/30',
      orb2: 'bg-rose-200/30',
      orb3: 'bg-amber-200/25',
    },
    headerBg: 'bg-white/95 backdrop-blur-md',
    headerBorder: 'border-orange-100',
    headerLogoBg: 'bg-gradient-to-br from-orange-600 to-rose-600',
    headerLogoText: 'text-white',
    headerSubtitleText: 'text-orange-800',
    headerAccentGlow: 'from-orange-500/12 via-rose-500/6 to-transparent',
    navBg: 'bg-white/90 backdrop-blur-md',
    navBorder: 'border-orange-100',
    navActiveBg: 'bg-orange-600 text-white shadow-xs',
    navActiveText: 'text-white font-bold',
    navInactiveText: 'text-slate-600 hover:text-orange-900',
    navHoverBg: 'hover:bg-orange-50',
    navIndicator: 'bg-orange-600',
    primaryBg: 'bg-orange-600',
    primaryHover: 'hover:bg-orange-700',
    primaryText: 'text-white',
    primaryGradient: 'bg-gradient-to-r from-orange-600 via-rose-600 to-amber-600',
    accentRing: 'ring-orange-400',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-800',
    badgeBorder: 'border-orange-200',
    cardBg: 'bg-white/90 backdrop-blur-xs',
    cardBorder: 'border-orange-100/80',
    cardHoverBorder: 'hover:border-orange-300',
    cardHeaderBg: 'bg-orange-50/40',
    cardText: 'text-slate-900',
    cardSubtext: 'text-slate-500',
    cardMutedBg: 'bg-orange-50/30',
    heroBannerBg: 'bg-gradient-to-r from-orange-700 via-rose-700 to-amber-600',
    heroBannerText: 'text-white',
    heroBannerBorder: 'border-orange-400/30',
    heroBannerGlow: 'shadow-orange-600/20',
  },

  // 7. Midnight Space & Neon Stars (Vibrant Dark Mode / Gamer vibe for kids)
  midnight: {
    id: 'midnight',
    name: 'Midnight Space & Neon',
    emoji: '🌌',
    tagline: 'Cosmic space navy with neon cyan & star glow',
    isDark: true,
    appBgClass: 'bg-[#0b0f19] text-slate-100',
    appTextClass: 'text-slate-100',
    ambientGlow: {
      orb1: 'bg-cyan-500/15',
      orb2: 'bg-indigo-600/20',
      orb3: 'bg-purple-600/15',
    },
    headerBg: 'bg-[#111726]/90 backdrop-blur-md',
    headerBorder: 'border-slate-800',
    headerLogoBg: 'bg-gradient-to-br from-cyan-400 to-indigo-500',
    headerLogoText: 'text-slate-950 font-black',
    headerSubtitleText: 'text-cyan-400',
    headerAccentGlow: 'from-cyan-500/20 via-indigo-500/10 to-transparent',
    navBg: 'bg-[#111726]/90 backdrop-blur-md',
    navBorder: 'border-slate-800',
    navActiveBg: 'bg-cyan-500 text-slate-950 shadow-md font-black',
    navActiveText: 'text-slate-950 font-black',
    navInactiveText: 'text-slate-400 hover:text-cyan-300',
    navHoverBg: 'hover:bg-slate-800/80',
    navIndicator: 'bg-cyan-400',
    primaryBg: 'bg-cyan-500',
    primaryHover: 'hover:bg-cyan-400',
    primaryText: 'text-slate-950 font-black',
    primaryGradient: 'bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400',
    accentRing: 'ring-cyan-400',
    badgeBg: 'bg-cyan-950/80',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-800',
    cardBg: 'bg-[#131b2e]/90 backdrop-blur-md',
    cardBorder: 'border-slate-800',
    cardHoverBorder: 'hover:border-cyan-500/50',
    cardHeaderBg: 'bg-slate-900/60',
    cardText: 'text-white',
    cardSubtext: 'text-slate-400',
    cardMutedBg: 'bg-slate-900/40',
    heroBannerBg: 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-cyan-500/30',
    heroBannerText: 'text-white',
    heroBannerBorder: 'border-cyan-500/40',
    heroBannerGlow: 'shadow-cyan-500/20',
  },

  // 8. Pastel Rainbow Candy (Sweet, playful, cheerful for younger kids)
  candy: {
    id: 'candy',
    name: 'Pastel Rainbow Candy',
    emoji: '🍭',
    tagline: 'Playful cotton candy pink & rainbow marshmallow',
    isDark: false,
    appBgClass: 'bg-[#fffafd] text-slate-800',
    appTextClass: 'text-slate-800',
    ambientGlow: {
      orb1: 'bg-pink-300/30',
      orb2: 'bg-sky-200/30',
      orb3: 'bg-yellow-200/30',
    },
    headerBg: 'bg-white/95 backdrop-blur-md',
    headerBorder: 'border-pink-100',
    headerLogoBg: 'bg-gradient-to-br from-pink-400 via-purple-400 to-sky-400',
    headerLogoText: 'text-white font-black',
    headerSubtitleText: 'text-pink-600',
    headerAccentGlow: 'from-pink-500/15 via-purple-500/8 to-transparent',
    navBg: 'bg-white/90 backdrop-blur-md',
    navBorder: 'border-pink-100',
    navActiveBg: 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-xs',
    navActiveText: 'text-white font-bold',
    navInactiveText: 'text-slate-600 hover:text-pink-700',
    navHoverBg: 'hover:bg-pink-50',
    navIndicator: 'bg-pink-500',
    primaryBg: 'bg-pink-500',
    primaryHover: 'hover:bg-pink-600',
    primaryText: 'text-white',
    primaryGradient: 'bg-gradient-to-r from-pink-500 via-purple-500 to-sky-400',
    accentRing: 'ring-pink-400',
    badgeBg: 'bg-pink-50',
    badgeText: 'text-pink-700',
    badgeBorder: 'border-pink-200',
    cardBg: 'bg-white/90 backdrop-blur-xs',
    cardBorder: 'border-pink-100/80',
    cardHoverBorder: 'hover:border-pink-300',
    cardHeaderBg: 'bg-pink-50/40',
    cardText: 'text-slate-900',
    cardSubtext: 'text-slate-500',
    cardMutedBg: 'bg-pink-50/30',
    heroBannerBg: 'bg-gradient-to-r from-pink-500 via-purple-500 to-sky-400',
    heroBannerText: 'text-white',
    heroBannerBorder: 'border-pink-300/40',
    heroBannerGlow: 'shadow-pink-500/25',
  },

  // 9. Nordic Minimal Citrus (Modern, architectural, clean slate & lime pop)
  citrus: {
    id: 'citrus',
    name: 'Nordic Minimal Citrus',
    emoji: '🍋',
    tagline: 'Modern monochrome slate & electric lime pop',
    isDark: false,
    appBgClass: 'bg-[#f8fafc] text-slate-800',
    appTextClass: 'text-slate-800',
    ambientGlow: {
      orb1: 'bg-lime-200/35',
      orb2: 'bg-slate-200/40',
      orb3: 'bg-emerald-200/20',
    },
    headerBg: 'bg-white/95 backdrop-blur-md',
    headerBorder: 'border-slate-200',
    headerLogoBg: 'bg-slate-900',
    headerLogoText: 'text-lime-400 font-black',
    headerSubtitleText: 'text-lime-700 font-bold',
    headerAccentGlow: 'from-lime-500/10 via-slate-500/5 to-transparent',
    navBg: 'bg-white/90 backdrop-blur-md',
    navBorder: 'border-slate-200',
    navActiveBg: 'bg-slate-900 text-lime-400 shadow-xs font-black',
    navActiveText: 'text-lime-400 font-black',
    navInactiveText: 'text-slate-600 hover:text-slate-900',
    navHoverBg: 'hover:bg-slate-100',
    navIndicator: 'bg-lime-500',
    primaryBg: 'bg-slate-900',
    primaryHover: 'hover:bg-slate-800',
    primaryText: 'text-lime-400 font-bold',
    primaryGradient: 'bg-gradient-to-r from-slate-900 via-slate-800 to-lime-600',
    accentRing: 'ring-lime-400',
    badgeBg: 'bg-lime-50',
    badgeText: 'text-lime-900 font-bold',
    badgeBorder: 'border-lime-300',
    cardBg: 'bg-white/95 backdrop-blur-xs',
    cardBorder: 'border-slate-200',
    cardHoverBorder: 'hover:border-slate-400',
    cardHeaderBg: 'bg-slate-50',
    cardText: 'text-slate-900',
    cardSubtext: 'text-slate-500',
    cardMutedBg: 'bg-slate-50',
    heroBannerBg: 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700',
    heroBannerText: 'text-white',
    heroBannerBorder: 'border-lime-400/40',
    heroBannerGlow: 'shadow-slate-900/30',
  },
};
