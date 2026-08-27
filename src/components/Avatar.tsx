import React, { useState } from 'react';
import { User, Sparkles } from 'lucide-react';

interface AvatarProps {
  photoUrl?: string;
  emoji?: string;
  name: string;
  colorClass?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBorder?: boolean;
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
}) => {
  const [imageError, setImageError] = useState(false);
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  const borderClass = showBorder ? 'border border-slate-200 shadow-2xs' : '';

  if (photoUrl && !imageError) {
    return (
      <div
        className={`relative inline-flex shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-slate-100 ${sizeConfig.container} ${borderClass} ${className}`}
        title={name}
      >
        <img
          src={photoUrl}
          alt={name}
          className="w-full h-full object-cover rounded-2xl"
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
        />
        {/* Subtle emoji badge overlay if emoji exists */}
        {emoji && (size === 'lg' || size === 'xl' || size === '2xl') && (
          <span className="absolute -bottom-1 -right-1 text-xs bg-white rounded-full p-0.5 shadow-xs border border-slate-200 leading-none">
            {emoji}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center rounded-2xl ${colorClass} ${sizeConfig.container} ${borderClass} font-bold select-none ${className}`}
      title={name}
    >
      {emoji ? (
        <span className={sizeConfig.emoji} role="img" aria-label={name}>
          {emoji}
        </span>
      ) : (
        <User className="w-1/2 h-1/2 opacity-70" />
      )}
    </div>
  );
};
