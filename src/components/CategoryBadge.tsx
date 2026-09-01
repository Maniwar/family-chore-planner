import React from 'react';
import {
  UtensilsCrossed,
  BedDouble,
  Sofa,
  Bath,
  TreePine,
  Shirt,
  PawPrint,
  SunMedium,
  Trash2,
  Car,
  BookOpen,
  Sparkles,
  Brush,
  Star,
  Zap,
  Leaf,
  LucideIcon
} from 'lucide-react';

export type BadgeStyle =
  | 'original'
  | 'emoji-3d'
  | 'emoji-sticker'
  | 'emoji-kawaii'
  | 'pastel'
  | 'vintage'
  | 'minimal'
  | 'retro'
  | 'glass'
  | 'neon'
  | 'nature'
  | 'bubble';

export interface BadgeStyleOption {
  id: BadgeStyle;
  name: string;
  emoji: string;
  category: 'emoji' | 'vector' | 'thematic';
  tagline: string;
  previewLabel: string;
}

export const BADGE_STYLES: BadgeStyleOption[] = [
  {
    id: 'original',
    name: 'Classic Emoji (Original)',
    emoji: '🏡',
    category: 'emoji',
    tagline: 'The original vibrant family room emojis with cheerful colorful pills',
    previewLabel: 'Kitchen',
  },
  {
    id: 'emoji-3d',
    name: '3D Glossy Emoji',
    emoji: '🎈',
    category: 'emoji',
    tagline: 'Vibrant 3D-style emojis with soft elevated shadows & gradient badges',
    previewLabel: 'Kitchen',
  },
  {
    id: 'emoji-sticker',
    name: 'Cute Sticker Tag',
    emoji: '🏷️',
    category: 'emoji',
    tagline: 'White die-cut sticker badges with playful room emojis & crisp outlines',
    previewLabel: 'Kitchen',
  },
  {
    id: 'emoji-kawaii',
    name: 'Kawaii Friends Emoji',
    emoji: '🐱',
    category: 'emoji',
    tagline: 'Adorable pastel candy bubbles with cute animal & household friends',
    previewLabel: 'Kitchen',
  },
  {
    id: 'pastel',
    name: 'Pastel Vector Capsule',
    emoji: '🌸',
    category: 'vector',
    tagline: 'Clear, beautifully sized Apple-style vector icons on soft pastel pills',
    previewLabel: 'Kitchen',
  },
  {
    id: 'vintage',
    name: 'Vintage Storybook',
    emoji: '🧸',
    category: 'thematic',
    tagline: 'Warm parchment, terracotta tones & nostalgic storybook serif typography',
    previewLabel: 'Kitchen',
  },
  {
    id: 'minimal',
    name: 'Scandinavian Minimal',
    emoji: '📐',
    category: 'vector',
    tagline: 'Prominent monoline line-art icons with spacious clean editorial borders',
    previewLabel: 'Kitchen',
  },
  {
    id: 'retro',
    name: 'Retro Arcade 8-Bit',
    emoji: '🎮',
    category: 'thematic',
    tagline: 'Chunky 2px dark border, bold comic shadows & power coin stars',
    previewLabel: 'KITCHEN',
  },
  {
    id: 'glass',
    name: 'Apple Glassmorphism',
    emoji: '🫧',
    category: 'thematic',
    tagline: 'Translucent frosted acrylic glass with specular highlights & bright icons',
    previewLabel: 'Kitchen',
  },
  {
    id: 'neon',
    name: 'Cyber Neon Glow',
    emoji: '⚡',
    category: 'thematic',
    tagline: 'High-contrast dark badge with vibrant electric neon colors & sharp glow',
    previewLabel: 'Kitchen',
  },
  {
    id: 'nature',
    name: 'Earthy Botanical',
    emoji: '🌿',
    category: 'thematic',
    tagline: 'Forest sage, terracotta & organic warm botanical tones',
    previewLabel: 'Kitchen',
  },
  {
    id: 'bubble',
    name: 'Juicy Jelly Bubble',
    emoji: '🍬',
    category: 'emoji',
    tagline: 'Glossy candy jelly capsules with colorful gradient shine & emojis',
    previewLabel: 'Kitchen',
  },
];

export interface CategoryDetails {
  icon: LucideIcon;
  emoji: string;
  kawaiiEmoji: string;
  label: string;
  fullLabel: string;
}

export function getCategoryDetails(cat: string): CategoryDetails {
  switch (cat) {
    case 'Kitchen':
      return { icon: UtensilsCrossed, emoji: '🍳', kawaiiEmoji: '🥞', label: 'Kitchen', fullLabel: 'Kitchen' };
    case 'Bedrooms':
      return { icon: BedDouble, emoji: '🛏️', kawaiiEmoji: '🧸', label: 'Bedrooms', fullLabel: 'Bedrooms' };
    case 'Living Room':
      return { icon: Sofa, emoji: '🛋️', kawaiiEmoji: '📺', label: 'Living', fullLabel: 'Living Room' };
    case 'Bathrooms':
      return { icon: Bath, emoji: '🛁', kawaiiEmoji: '🫧', label: 'Bathrooms', fullLabel: 'Bathrooms' };
    case 'Laundry':
      return { icon: Shirt, emoji: '🧺', kawaiiEmoji: '🧦', label: 'Laundry', fullLabel: 'Laundry' };
    case 'Pets':
      return { icon: PawPrint, emoji: '🐾', kawaiiEmoji: '🐶', label: 'Pets', fullLabel: 'Pets & Animals' };
    case 'Yard & Outdoor':
      return { icon: TreePine, emoji: '🌿', kawaiiEmoji: '🌻', label: 'Yard', fullLabel: 'Yard & Outdoor' };
    case 'Daily Routine':
      return { icon: SunMedium, emoji: '☀️', kawaiiEmoji: '⭐', label: 'Routine', fullLabel: 'Daily Routine' };
    case 'Trash & Recycling':
      return { icon: Trash2, emoji: '🗑️', kawaiiEmoji: '♻️', label: 'Trash', fullLabel: 'Trash & Recycling' };
    case 'Vehicles':
      return { icon: Car, emoji: '🚗', kawaiiEmoji: '🏎️', label: 'Auto', fullLabel: 'Vehicles' };
    case 'Study & Desk':
      return { icon: BookOpen, emoji: '📚', kawaiiEmoji: '✏️', label: 'Study', fullLabel: 'Study & Desk' };
    case 'Special Projects':
      return { icon: Sparkles, emoji: '✨', kawaiiEmoji: '🎨', label: 'Special', fullLabel: 'Special Projects' };
    default:
      return {
        icon: Brush,
        emoji: '🧹',
        kawaiiEmoji: '🧼',
        label: cat.length > 9 ? cat.slice(0, 8) + '…' : cat,
        fullLabel: cat,
      };
  }
}

export function getCategoryBaseInfo(cat: string) {
  const details = getCategoryDetails(cat);
  return { icon: details.icon, label: details.label };
}

interface CategoryBadgeProps {
  category: string;
  size?: 'xs' | 'sm' | 'md';
  style?: BadgeStyle;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = 'md',
  style = 'original',
  className = '',
}) => {
  const { icon: Icon, emoji, kawaiiEmoji, label } = getCategoryDetails(category);
  const isSm = size === 'sm';
  const isXs = size === 'xs';

  // 1. ORIGINAL CLASSIC EMOJI (The beloved colorful family pills with authentic emoji)
  if (style === 'original') {
    const getOriginalColor = (c: string) => {
      switch (c) {
        case 'Kitchen':
          return 'bg-amber-100/90 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300/80 dark:border-amber-700/60';
        case 'Bedrooms':
          return 'bg-indigo-100/90 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border-indigo-300/80 dark:border-indigo-700/60';
        case 'Living Room':
          return 'bg-purple-100/90 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border-purple-300/80 dark:border-purple-700/60';
        case 'Bathrooms':
          return 'bg-cyan-100/90 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-200 border-cyan-300/80 dark:border-cyan-700/60';
        case 'Laundry':
          return 'bg-sky-100/90 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 border-sky-300/80 dark:border-sky-700/60';
        case 'Pets':
          return 'bg-rose-100/90 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-300/80 dark:border-rose-700/60';
        case 'Yard & Outdoor':
          return 'bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300/80 dark:border-emerald-700/60';
        case 'Daily Routine':
          return 'bg-orange-100/90 dark:bg-orange-950/60 text-orange-900 dark:text-orange-200 border-orange-300/80 dark:border-orange-700/60';
        case 'Trash & Recycling':
          return 'bg-teal-100/90 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 border-teal-300/80 dark:border-teal-700/60';
        case 'Vehicles':
          return 'bg-blue-100/90 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border-blue-300/80 dark:border-blue-700/60';
        case 'Study & Desk':
          return 'bg-yellow-100/90 dark:bg-yellow-950/60 text-yellow-900 dark:text-yellow-200 border-yellow-300/80 dark:border-yellow-700/60';
        case 'Special Projects':
          return 'bg-fuchsia-100/90 dark:bg-fuchsia-950/60 text-fuchsia-900 dark:text-fuchsia-200 border-fuchsia-300/80 dark:border-fuchsia-700/60';
        default:
          return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700';
      }
    };

    return (
      <span
        className={`inline-flex min-w-0 items-center gap-1  rounded-full font-bold border shadow-2xs whitespace-nowrap ${getOriginalColor(category)} ${
          isXs ? 'px-1.5 py-0.5 text-[10px]' : isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
        } ${className}`}
      >
        <span className={isXs ? 'text-xs leading-none' : isSm ? 'text-sm leading-none' : 'text-base leading-none'}>
          {emoji}
        </span>
        <span className="truncate">{label}</span>
      </span>
    );
  }

  // 2. 3D GLOSSY EMOJI (Vibrant elevated capsule with juicy soft shadow)
  if (style === 'emoji-3d') {
    return (
      <span
        className={`inline-flex min-w-0 items-center gap-1  rounded-full font-extrabold border border-white/20 dark:border-slate-700 shadow-sm whitespace-nowrap bg-gradient-to-b from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 text-slate-800 dark:text-slate-100 ${
          isXs ? 'px-1.5 py-0.5 text-[10px]' : isSm ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
        } ${className}`}
      >
        <span className={`inline-block drop-shadow-sm ${isXs ? 'text-xs' : isSm ? 'text-sm' : 'text-base'}`}>
          {emoji}
        </span>
        <span className="truncate">{label}</span>
      </span>
    );
  }

  // 3. CUTE STICKER TAG (Die-cut sticker with bold borders & sticker paper look)
  if (style === 'emoji-sticker') {
    return (
      <span
        className={`inline-flex min-w-0 items-center gap-1  rounded-xl font-bold border-2 border-slate-800 dark:border-slate-200 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,0.9)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.9)] whitespace-nowrap ${
          isXs ? 'px-1.5 py-0.5 text-[9px]' : isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]'
        } ${className}`}
      >
        <span className={isXs ? 'text-xs' : isSm ? 'text-sm' : 'text-base'}>{emoji}</span>
        <span className="truncate tracking-tight">{label}</span>
      </span>
    );
  }

  // 4. KAWAII FRIENDS EMOJI (Super cute pastel candy friends)
  if (style === 'emoji-kawaii') {
    return (
      <span
        className={`inline-flex min-w-0 items-center gap-1  rounded-full font-black border border-pink-300 dark:border-pink-800 shadow-xs whitespace-nowrap bg-gradient-to-r from-pink-100 via-rose-50 to-pink-100 dark:from-pink-950/60 dark:to-rose-950/60 text-pink-800 dark:text-pink-200 ${
          isXs ? 'px-1.5 py-0.5 text-[10px]' : isSm ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
        } ${className}`}
      >
        <span className={`inline-block animate-bounce-short ${isXs ? 'text-xs' : isSm ? 'text-sm' : 'text-base'}`}>
          {kawaiiEmoji}
        </span>
        <span className="truncate">{label}</span>
      </span>
    );
  }

  // 5. JUICY JELLY BUBBLE (Glossy translucent candy bubble with vibrant emoji)
  if (style === 'bubble') {
    return (
      <span
        className={`inline-flex min-w-0 items-center gap-1  rounded-full font-bold border border-white/20 shadow-xs whitespace-nowrap bg-gradient-to-r from-violet-500/15 via-fuchsia-500/15 to-pink-500/15 text-purple-900 dark:text-purple-200 dark:border-purple-600/50 ${
          isXs ? 'px-1.5 py-0.5 text-[10px]' : isSm ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
        } ${className}`}
      >
        <span className={isXs ? 'text-xs' : isSm ? 'text-sm' : 'text-base'}>{emoji}</span>
        <span className="truncate">{label}</span>
      </span>
    );
  }

  // 6. VINTAGE STORYBOOK STYLE (Warm parchment, sepia, terracotta, serif)
  if (style === 'vintage') {
    return (
      <span
        className={`inline-flex min-w-0 items-center gap-1  rounded-md border font-serif tracking-normal shadow-2xs whitespace-nowrap bg-[#faf6ee] dark:bg-stone-900 border-[#e2d5c1] dark:border-stone-700 text-[#714b2d] dark:text-[#d7bfa8] ${
          isXs ? 'px-1.5 py-0.5 text-[10px]' : isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
        } ${className}`}
      >
        <span className="w-4 h-4 rounded-sm bg-[#ede2cf] dark:bg-stone-800 text-[#855734] dark:text-[#e0c8b2] flex items-center justify-center ">
          <Icon className="w-3 h-3 stroke-[2.2]" />
        </span>
        <span className="truncate">{label}</span>
      </span>
    );
  }

  // 7. SCANDINAVIAN MINIMAL (Crisp monoline vector art, generous visible icon, quiet typography)
  if (style === 'minimal') {
    return (
      <span
        className={`inline-flex min-w-0 items-center gap-1  rounded-md border font-medium tracking-tight whitespace-nowrap bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 ${
          isXs ? 'px-1.5 py-0.5 text-[10px]' : isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
        } ${className}`}
      >
        <Icon className={`${isXs ? 'w-3 h-3' : isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-slate-600 dark:text-slate-300 stroke-[2] `} />
        <span className="truncate">{label}</span>
      </span>
    );
  }

  // 8. RETRO ARCADE POP (Chunky 2px solid dark borders, bold game badges & shadows)
  if (style === 'retro') {
    return (
      <span
        className={`inline-flex min-w-0 items-center gap-1  rounded-md border-2 border-slate-900 dark:border-white font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] whitespace-nowrap bg-amber-300 dark:bg-amber-400 text-slate-950 ${
          isXs ? 'px-1.5 py-0.5 text-[9px]' : isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]'
        } ${className}`}
      >
        <Icon className={`${isXs ? 'w-3 h-3' : isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} stroke-[2.75]`} />
        <span className="truncate">{label}</span>
      </span>
    );
  }

  // 9. APPLE GLASSMORPHISM (Translucent frosted acrylic glass with glowing icon)
  if (style === 'glass') {
    return (
      <span
        className={`inline-flex min-w-0 items-center gap-1.5 rounded-full font-bold whitespace-nowrap apple-glass-pill ${
          isXs ? 'px-2 py-0.5 text-[10px]' : isSm ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
        } ${className}`}
      >
        <span className="w-4 h-4 rounded-full bg-sky-500/20 dark:bg-sky-400/20 text-sky-600 dark:text-sky-300 flex items-center justify-center">
          <Icon className="w-3 h-3 stroke-[2.2]" />
        </span>
        <span className="truncate">{label}</span>
      </span>
    );
  }

  // 10. CYBER NEON GLOW (High-contrast dark badge with vibrant electric neon colors)
  if (style === 'neon') {
    return (
      <span
        className={`inline-flex min-w-0 items-center gap-1  rounded-full font-extrabold tracking-wide border border-cyan-400/80 dark:border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.35)] whitespace-nowrap bg-slate-900 text-cyan-300 ${
          isXs ? 'px-1.5 py-0.5 text-[10px]' : isSm ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
        } ${className}`}
      >
        <Zap className={`${isXs ? 'w-3 h-3' : isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-cyan-400 fill-cyan-400 `} />
        <span className="truncate">{label}</span>
      </span>
    );
  }

  // 11. EARTHY BOTANICAL (Forest sage, terracotta & organic warm botanical tones)
  if (style === 'nature') {
    return (
      <span
        className={`inline-flex min-w-0 items-center gap-1  rounded-full font-bold border border-emerald-300/80 dark:border-emerald-800 shadow-2xs whitespace-nowrap bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 ${
          isXs ? 'px-1.5 py-0.5 text-[10px]' : isSm ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
        } ${className}`}
      >
        <Leaf className={`${isXs ? 'w-3 h-3' : isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-emerald-600 dark:text-emerald-400 fill-emerald-500/20 `} />
        <span className="truncate">{label}</span>
      </span>
    );
  }

  // 12. PASTEL VECTOR CAPSULE (Crisp, well-sized Apple-style vector icons on soft pastel pills)
  const getPastelCategoryColors = (cat: string) => {
    switch (cat) {
      case 'Kitchen':
        return {
          badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200/90 dark:border-amber-800/60',
          icon: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
        };
      case 'Bedrooms':
        return {
          badge: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border-indigo-200/90 dark:border-indigo-800/60',
          icon: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300',
        };
      case 'Living Room':
        return {
          badge: 'bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 border-purple-200/90 dark:border-purple-800/60',
          icon: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
        };
      case 'Bathrooms':
        return {
          badge: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200 border-cyan-200/90 dark:border-cyan-800/60',
          icon: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300',
        };
      case 'Laundry':
        return {
          badge: 'bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 border-sky-200/90 dark:border-sky-800/60',
          icon: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300',
        };
      case 'Pets':
        return {
          badge: 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-200/90 dark:border-rose-800/60',
          icon: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
        };
      case 'Yard & Outdoor':
        return {
          badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-200/90 dark:border-emerald-800/60',
          icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
        };
      case 'Daily Routine':
        return {
          badge: 'bg-orange-50 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200 border-orange-200/90 dark:border-orange-800/60',
          icon: 'bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300',
        };
      default:
        return {
          badge: 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200/90 dark:border-slate-700',
          icon: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
        };
    }
  };

  const colors = getPastelCategoryColors(category);

  return (
    <span
      className={`inline-flex min-w-0 items-center gap-1  rounded-full font-bold border shadow-2xs whitespace-nowrap ${colors.badge} ${
        isXs ? 'px-1.5 py-0.5 text-[10px]' : isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${className}`}
    >
      <span className={`w-4 h-4 rounded-full flex items-center justify-center  ${colors.icon}`}>
        <Icon className="w-2.5 h-2.5 stroke-[2.5]" />
      </span>
      <span className="truncate">{label}</span>
    </span>
  );
};

interface StarPointsBadgeProps {
  points: number;
  suffix?: string;
  size?: 'xs' | 'sm' | 'md';
  style?: BadgeStyle;
  className?: string;
}

export const StarPointsBadge: React.FC<StarPointsBadgeProps> = ({
  points,
  suffix = '',
  size = 'md',
  style = 'original',
  className = '',
}) => {
  const isSm = size === 'sm';
  const isXs = size === 'xs';

  // 1. ORIGINAL CLASSIC STAR BADGE
  if (style === 'original') {
    return (
      <span
        className={` shrink-0 inline-flex items-center gap-1  rounded-full font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200/90 dark:border-amber-800/70 shadow-2xs whitespace-nowrap ${
          isXs ? 'px-1.5 py-0.5 text-[10px]' : isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs'
        } ${className}`}
      >
        <span className={isXs ? 'text-xs' : isSm ? 'text-sm' : 'text-base'}>⭐</span>
        <span>{points}{suffix ? ` ${suffix}` : ''}</span>
      </span>
    );
  }

  // 2. 3D GLOSSY STAR
  if (style === 'emoji-3d') {
    return (
      <span
        className={`shrink-0 inline-flex items-center gap-1  rounded-full font-extrabold border border-amber-200/90 dark:border-slate-700 shadow-sm whitespace-nowrap bg-gradient-to-b from-amber-50 to-amber-100 dark:from-slate-800 dark:to-slate-900 text-amber-950 dark:text-amber-200 ${
          isXs ? 'px-1.5 py-0.5 text-[10px]' : isSm ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-0.5 text-xs'
        } ${className}`}
      >
        <span className={`inline-block drop-shadow-sm ${isXs ? 'text-xs' : isSm ? 'text-sm' : 'text-base'}`}>⭐</span>
        <span>{points}{suffix ? ` ${suffix}` : ''}</span>
      </span>
    );
  }

  // 3. CUTE STICKER STAR
  if (style === 'emoji-sticker') {
    return (
      <span
        className={`shrink-0 inline-flex items-center gap-1  rounded-xl font-bold border-2 border-slate-800 dark:border-slate-200 bg-amber-100 dark:bg-slate-900 text-slate-900 dark:text-white shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,0.9)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.9)] whitespace-nowrap ${
          isXs ? 'px-1.5 py-0.5 text-[9px]' : isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]'
        } ${className}`}
      >
        <span className={isXs ? 'text-xs' : isSm ? 'text-sm' : 'text-base'}>⭐</span>
        <span>{points}{suffix ? ` ${suffix}` : ''}</span>
      </span>
    );
  }

  // 4. KAWAII STAR
  if (style === 'emoji-kawaii') {
    return (
      <span
        className={`shrink-0 inline-flex items-center gap-1  rounded-full font-black shadow-xs whitespace-nowrap bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-950/60 dark:to-yellow-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 ${
          isXs ? 'px-1.5 py-0.5 text-[10px]' : isSm ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-0.5 text-xs'
        } ${className}`}
      >
        <span className={`inline-block animate-spin-slow ${isXs ? 'text-xs' : isSm ? 'text-sm' : 'text-base'}`}>✨</span>
        <span>{points}{suffix ? ` ${suffix}` : ''}</span>
      </span>
    );
  }

  // 5. JUICY JELLY STAR
  if (style === 'bubble') {
    return (
      <span
        className={`shrink-0 inline-flex items-center gap-1  rounded-full font-extrabold border border-amber-300/80 shadow-xs whitespace-nowrap bg-gradient-to-r from-amber-400/20 to-yellow-400/20 text-amber-900 dark:text-amber-200 ${
          isXs ? 'px-1.5 py-0.5 text-[10px]' : isSm ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-0.5 text-xs'
        } ${className}`}
      >
        <span className={isXs ? 'text-xs' : isSm ? 'text-sm' : 'text-base'}>⭐</span>
        <span>{points}{suffix ? ` ${suffix}` : ''}</span>
      </span>
    );
  }

  // 6. VINTAGE STORYBOOK STAR
  if (style === 'vintage') {
    return (
      <span
        className={`shrink-0 inline-flex items-center gap-1  rounded-md border font-serif font-bold shadow-2xs whitespace-nowrap bg-[#fcf5e8] dark:bg-stone-900 border-[#dfccb0] dark:border-stone-700 text-[#855325] dark:text-[#e4c9ad] ${
          isXs ? 'px-1.5 py-0.5 text-[10px]' : isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs'
        } ${className}`}
      >
        <Star className={`${isXs ? 'w-3 h-3' : isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} fill-[#c58d4a] text-[#a57032] `} />
        <span>{points}{suffix ? ` ${suffix}` : ''}</span>
      </span>
    );
  }

  // 7. SCANDINAVIAN MINIMAL STAR
  if (style === 'minimal') {
    return (
      <span
        className={`shrink-0 inline-flex items-center gap-1  rounded-md border font-semibold tracking-tight whitespace-nowrap bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 ${
          isXs ? 'px-1.5 py-0.5 text-[10px]' : isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs'
        } ${className}`}
      >
        <Star className={`${isXs ? 'w-3 h-3' : isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-amber-500 fill-amber-400/40 stroke-[2] `} />
        <span>{points}{suffix ? ` ${suffix}` : ''}</span>
      </span>
    );
  }

  // 8. RETRO ARCADE STAR
  if (style === 'retro') {
    return (
      <span
        className={`shrink-0 inline-flex items-center gap-1  rounded-md border-2 border-slate-900 dark:border-white font-black shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] whitespace-nowrap bg-yellow-400 dark:bg-yellow-400 text-slate-950 ${
          isXs ? 'px-1.5 py-0.5 text-[9px]' : isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]'
        } ${className}`}
      >
        <Star className={`${isXs ? 'w-3 h-3' : isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} fill-slate-950 text-slate-950 `} />
        <span>{points}{suffix ? ` ${suffix}` : ''}</span>
      </span>
    );
  }

  // 9. APPLE GLASS STAR
  if (style === 'glass') {
    return (
      <span
        className={`shrink-0 inline-flex items-center gap-1.5 rounded-full font-bold whitespace-nowrap apple-glass-pill ${
          isXs ? 'px-2 py-0.5 text-[10px]' : isSm ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
        } ${className}`}
      >
        <Star className={`${isXs ? 'w-3 h-3' : isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} fill-amber-400 text-amber-500 drop-shadow-sm`} />
        <span>{points}{suffix ? ` ${suffix}` : ''}</span>
      </span>
    );
  }

  // 10. CYBER NEON STAR
  if (style === 'neon') {
    return (
      <span
        className={`shrink-0 inline-flex items-center gap-1  rounded-full font-black border border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)] whitespace-nowrap bg-slate-900 text-amber-300 ${
          isXs ? 'px-1.5 py-0.5 text-[10px]' : isSm ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-0.5 text-xs'
        } ${className}`}
      >
        <Star className={`${isXs ? 'w-3 h-3' : isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} fill-amber-400 text-amber-400 `} />
        <span>{points}{suffix ? ` ${suffix}` : ''}</span>
      </span>
    );
  }

  // 11. BOTANICAL NATURE STAR
  if (style === 'nature') {
    return (
      <span
        className={`shrink-0 inline-flex items-center gap-1  rounded-full font-bold border border-amber-300 dark:border-amber-800 shadow-2xs whitespace-nowrap bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ${
          isXs ? 'px-1.5 py-0.5 text-[10px]' : isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs'
        } ${className}`}
      >
        <Star className={`${isXs ? 'w-3 h-3' : isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} fill-amber-400 text-amber-500 `} />
        <span>{points}{suffix ? ` ${suffix}` : ''}</span>
      </span>
    );
  }

  // 12. DEFAULT PASTEL VECTOR STAR
  return (
    <span
      className={` shrink-0 inline-flex items-center gap-1  rounded-full font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200/90 dark:border-amber-800/70 shadow-2xs whitespace-nowrap ${
        isXs ? 'px-1.5 py-0.5 text-[10px]' : isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs'
      } ${className}`}
    >
      <Star className={`${isXs ? 'w-3 h-3' : isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} fill-amber-400 text-amber-400 `} />
      <span>{points}{suffix ? ` ${suffix}` : ''}</span>
    </span>
  );
};

