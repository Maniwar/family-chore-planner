import React, { useState } from 'react';
import { User } from 'lucide-react';
import { CosmeticEffects } from './CosmeticEffects';
import { COSMETIC_ITEMS } from '../utils/progression';
import { INITIAL_MEMBERS } from '../data/initialData';
import { HouseholdMember } from '../types';

interface AvatarProps {
  photoUrl?: string;
  emoji?: string;
  name?: string;
  colorClass?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBorder?: boolean;
  cosmeticClass?: string; // Optional equipped cosmetic frame effect
  cosmeticId?: string; // Direct cosmetic ID if available
  memberId?: string; // Optional member ID for auto-resolving equipped cosmetic
  member?: HouseholdMember; // Optional complete member object
  level?: number; // Optional level badge to display cleanly
  hideEmojiBadge?: boolean; // Suppress emoji badge when level is present
}

const SIZE_MAP = {
  xs: {
    container: 'w-6 h-6 text-xs',
    image: 'w-6 h-6',
    emoji: 'text-xs',
  },
  sm: {
    container: 'w-8 h-8 text-sm',
    image: 'w-8 h-8',
    emoji: 'text-sm',
  },
  md: {
    container: 'w-10 h-10 text-base',
    image: 'w-10 h-10',
    emoji: 'text-lg',
  },
  lg: {
    container: 'w-12 h-12 text-lg',
    image: 'w-12 h-12',
    emoji: 'text-2xl',
  },
  xl: {
    container: 'w-16 h-16 text-2xl',
    image: 'w-16 h-16',
    emoji: 'text-3xl',
  },
  '2xl': {
    container: 'w-20 h-20 text-3xl',
    image: 'w-20 h-20',
    emoji: 'text-4xl',
  },
};

export const Avatar: React.FC<AvatarProps> = ({
  photoUrl,
  emoji,
  name,
  colorClass = 'bg-slate-100 text-slate-800',
  size = 'md',
  className = '',
  showBorder = true,
  cosmeticClass = '',
  cosmeticId,
  memberId,
  member,
  level,
  hideEmojiBadge = false,
}) => {
  const [imageError, setImageError] = useState(false);

  // Derive resolved properties with priority: explicit prop > member object > fallback
  const effectiveName = name || member?.name || 'Helper';
  const effectivePhotoUrl = photoUrl || member?.avatarPhotoUrl;
  const effectiveEmoji = emoji || member?.avatarEmoji;
  const effectiveColorClass = member?.avatarColor && colorClass === 'bg-slate-100 text-slate-800' 
    ? member.avatarColor 
    : colorClass;
  const effectiveMemberId = memberId || member?.id;

  React.useEffect(() => {
    setImageError(false);
  }, [effectivePhotoUrl]);

  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  // Resolve cosmetic ID
  const activeCosmeticId = cosmeticId || member?.equippedCosmeticId || (() => {
    if (cosmeticClass) {
      if (cosmeticClass.includes('cos_phoenix_wings')) return 'cos_phoenix_wings';
      if (cosmeticClass.includes('cos_galaxy_void')) return 'cos_galaxy_void';
      if (cosmeticClass.includes('cos_ruby_fire')) return 'cos_ruby_fire';
      if (cosmeticClass.includes('cos_fire_gold')) return 'cos_fire_gold';
      if (cosmeticClass.includes('cos_rainbow_sparkle')) return 'cos_rainbow_sparkle';
      if (cosmeticClass.includes('cos_neon_glow')) return 'cos_neon_glow';
      const match = COSMETIC_ITEMS.find(c => c.cssClass === cosmeticClass);
      if (match) return match.id;
    }

    // Auto-resolve equipped cosmetic by memberId or name across all screens
    if (effectiveMemberId || effectiveName) {
      try {
        let membersList: HouseholdMember[] = [];
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('family_chores_members_v2');
          if (raw) membersList = JSON.parse(raw);
        }
        if (!membersList || membersList.length === 0) {
          membersList = INITIAL_MEMBERS;
        }

        const normTarget = (effectiveName || '').toLowerCase().trim().split(' ')[0];
        const found = membersList.find(m => {
          if (effectiveMemberId && m.id === effectiveMemberId) return true;
          if (normTarget) {
            const mNorm = m.name.toLowerCase().trim().split(' ')[0];
            return mNorm === normTarget || m.name.toLowerCase().includes(normTarget);
          }
          return false;
        });

        if (found?.equippedCosmeticId) {
          return found.equippedCosmeticId;
        }
      } catch {
        // ignore parse error
      }
    }

    return undefined;
  })();

  const borderClass = activeCosmeticId 
    ? '' // CosmeticEffects provides the glowing stylized ring and border
    : (showBorder ? 'border border-slate-200 shadow-2xs' : '');

  const hasValidPhoto = Boolean(effectivePhotoUrl && typeof effectivePhotoUrl === 'string' && effectivePhotoUrl.trim().length > 0);

  if (hasValidPhoto && !imageError) {
    return (
      <div
        className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${sizeConfig.container} ${borderClass} ${className}`}
        title={effectiveName}
      >
        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center relative z-10">
          <img
            src={effectivePhotoUrl}
            alt={effectiveName}
            className="w-full h-full object-cover rounded-full"
            referrerPolicy="no-referrer"
            onError={() => {
              console.warn(`[Avatar] Image load issue for "${effectiveName}". Falling back to emoji/icon.`);
              setImageError(true);
            }}
          />
        </div>

        {/* Epic animated cosmetic particle overlays */}
        {activeCosmeticId && (
          <CosmeticEffects cosmeticId={activeCosmeticId} size={size} />
        )}

        {/* Subtle emoji badge overlay if emoji exists and not suppressed by level */}
        {effectiveEmoji && !hideEmojiBadge && (level === undefined) && (size === 'lg' || size === 'xl' || size === '2xl') && (
          <span className="absolute -bottom-1 -right-1 text-xs bg-white rounded-full p-0.5 shadow-xs border border-slate-200 leading-none z-20">
            {effectiveEmoji}
          </span>
        )}

        {/* Crisp, centered level badge that is never covered */}
        {level !== undefined && (
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md border-2 border-white dark:border-slate-900 leading-none z-40 whitespace-nowrap pointer-events-none drop-shadow-xs">
            Lv.{level}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${effectiveColorClass} ${sizeConfig.container} ${borderClass} font-bold select-none ${className}`}
      title={effectiveName}
    >
      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center relative z-10">
        {effectiveEmoji ? (
          <span className={sizeConfig.emoji} role="img" aria-label={effectiveName}>
            {effectiveEmoji}
          </span>
        ) : (
          <User className="w-1/2 h-1/2 opacity-70" />
        )}
      </div>

      {/* Epic animated cosmetic particle overlays */}
      {activeCosmeticId && (
        <CosmeticEffects cosmeticId={activeCosmeticId} size={size} />
      )}

      {/* Crisp, centered level badge that is never covered */}
      {level !== undefined && (
        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md border-2 border-white dark:border-slate-900 leading-none z-40 whitespace-nowrap pointer-events-none drop-shadow-xs">
          Lv.{level}
        </span>
      )}
    </div>
  );
};
