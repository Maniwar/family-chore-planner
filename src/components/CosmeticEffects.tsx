import React from 'react';

export type CosmeticId = 
  | 'cos_neon_glow' 
  | 'cos_rainbow_sparkle' 
  | 'cos_fire_gold' 
  | 'cos_ruby_fire' 
  | 'cos_galaxy_void' 
  | 'cos_phoenix_wings';

interface CosmeticEffectsProps {
  cosmeticId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

interface WingConfig {
  width: string;
  height: string;
  leftOffset: string;
  rightOffset: string;
  crownSize: string;
  crownTop: string;
}

// Proportional wing framing so wings cup the avatar silhouette symmetrically from behind
const PHOENIX_SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', WingConfig> = {
  xs: {
    width: 'w-[12px]',
    height: 'h-[16px]',
    leftOffset: '-left-[7px]',
    rightOffset: '-right-[7px]',
    crownSize: 'text-[9px]',
    crownTop: '-top-1.5',
  },
  sm: {
    width: 'w-[15px]',
    height: 'h-[20px]',
    leftOffset: '-left-[9px]',
    rightOffset: '-right-[9px]',
    crownSize: 'text-[11px]',
    crownTop: '-top-2',
  },
  md: {
    width: 'w-[18px]',
    height: 'h-[25px]',
    leftOffset: '-left-[11px]',
    rightOffset: '-right-[11px]',
    crownSize: 'text-[13px]',
    crownTop: '-top-2.5',
  },
  lg: {
    width: 'w-[23px]',
    height: 'h-[32px]',
    leftOffset: '-left-[13px]',
    rightOffset: '-right-[13px]',
    crownSize: 'text-[16px]',
    crownTop: '-top-3',
  },
  xl: {
    width: 'w-[30px]',
    height: 'h-[40px]',
    leftOffset: '-left-[16px]',
    rightOffset: '-right-[16px]',
    crownSize: 'text-[20px]',
    crownTop: '-top-4',
  },
  '2xl': {
    width: 'w-[38px]',
    height: 'h-[50px]',
    leftOffset: '-left-[20px]',
    rightOffset: '-right-[20px]',
    crownSize: 'text-[26px]',
    crownTop: '-top-5',
  },
};

const APEX_CONFIG = {
  xs: { top: '-top-1.5', size: 'text-[9px]' },
  sm: { top: '-top-2', size: 'text-[11px]' },
  md: { top: '-top-2.5', size: 'text-[13px]' },
  lg: { top: '-top-3', size: 'text-[15px]' },
  xl: { top: '-top-3.5', size: 'text-[19px]' },
  '2xl': { top: '-top-4.5', size: 'text-[24px]' },
};

export const CosmeticEffects: React.FC<CosmeticEffectsProps> = ({
  cosmeticId,
  size = 'md',
  className = '',
}) => {
  if (!cosmeticId) return null;

  const isSmall = size === 'xs' || size === 'sm';
  const isLarge = size === 'xl' || size === '2xl';
  const apex = APEX_CONFIG[size] || APEX_CONFIG.md;

  switch (cosmeticId) {
    // =========================================================================
    // 1. CYBER ICE GLOW FRAME (Rare • Cyber)
    // =========================================================================
    case 'cos_neon_glow':
      return (
        <div className={`pointer-events-none absolute inset-0 z-10 ${className}`} aria-hidden="true">
          {/* Pulsing high-tech cyan laser ring */}
          <div className="absolute inset-0 rounded-full ring-2 ring-cyan-400 [animation:epic-cyber-glow_2s_ease-in-out_infinite]" />
          
          {/* Fast rotating orbital laser track with glowing photon spark */}
          <div className="absolute -inset-1 rounded-full [animation:epic-spin-cw_2.2s_linear_infinite]">
            <div className={`absolute -top-1 left-1/2 -translate-x-1/2 ${isSmall ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full bg-cyan-200 shadow-[0_0_10px_#22d3ee,0_0_16px_#06b6d4]`} />
          </div>

          {/* Symmetrical Cardinal Cyber Compass Nodes (Left, Right, Top only - bottom clear for level badge) */}
          {!isSmall && (
            <>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cyan-300 rounded-xs shadow-[0_0_6px_#06b6d4]" />
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-1.5 h-1.5 bg-cyan-300 rounded-xs shadow-[0_0_6px_#06b6d4]" />
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-1.5 bg-cyan-300 rounded-xs shadow-[0_0_6px_#06b6d4]" />
            </>
          )}

          {/* Frosted ice corner glints for larger display */}
          {isLarge && (
            <div className="absolute -inset-2 rounded-full border border-cyan-400/30 [animation:epic-spin-ccw_10s_linear_infinite]" />
          )}
        </div>
      );

    // =========================================================================
    // 2. RAINBOW PRISMATIC AURA (Rare • Prismatic)
    // =========================================================================
    case 'cos_rainbow_sparkle':
      return (
        <div className={`pointer-events-none absolute inset-0 z-10 ${className}`} aria-hidden="true">
          {/* Continuous rotating rainbow conic border */}
          <div 
            className="absolute -inset-1 rounded-full p-[2.5px] [animation:epic-spin-cw_4.5s_linear_infinite]"
            style={{
              background: 'conic-gradient(from 0deg, #10b981, #06b6d4, #6366f1, #d946ef, #f59e0b, #10b981)',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #fff calc(100% - 2.5px))',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #fff calc(100% - 2.5px))',
            }}
          />

          {/* Prismatic rainbow ambient aura */}
          <div className="absolute inset-0 rounded-full shadow-[0_0_14px_rgba(52,211,153,0.5),0_0_20px_rgba(217,70,239,0.3)]" />

          {/* Rotating Sparkle 1 (Top Apex) */}
          <div className="absolute -inset-1 rounded-full [animation:epic-spin-cw_3.5s_linear_infinite]">
            <div className={`absolute -top-1 left-1/2 -translate-x-1/2 ${isSmall ? 'text-[9px]' : 'text-xs'} select-none leading-none filter drop-shadow-[0_0_6px_rgba(245,158,11,0.9)]`}>
              ✨
            </div>
          </div>

          {/* Diagonal Orbit Sparkle 2 (Side-aligned, keeping bottom center open for level badge) */}
          <div className="absolute -inset-1 rounded-full [animation:epic-spin-ccw_4.8s_linear_infinite]">
            <div className={`absolute top-1/2 -right-1 -translate-y-1/2 ${isSmall ? 'text-[8px]' : 'text-[10px]'} select-none leading-none filter drop-shadow-[0_0_6px_rgba(6,182,212,0.9)]`}>
              💎
            </div>
          </div>
        </div>
      );

    // =========================================================================
    // 3. GOLDEN CHAMPION AURA (Epic • Prestige)
    // =========================================================================
    case 'cos_fire_gold': {
      return (
        <div className={`pointer-events-none absolute inset-0 z-10 ${className}`} aria-hidden="true">
          {/* Dual 24K gold glowing concentric rings */}
          <div className="absolute inset-0 rounded-full ring-2 md:ring-3 ring-amber-400 [animation:epic-gold-gleam_2.4s_ease-in-out_infinite]" />
          <div className="absolute -inset-1 rounded-full border border-amber-300/60 [animation:epic-spin-cw_12s_linear_infinite]" />

          {/* Floating Golden Champion Crown at the Apex — Centered at 12 o'clock */}
          <div className={`absolute ${apex.top} left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-20`}>
            <div className="[animation:epic-float-bob_2.2s_ease-in-out_infinite] flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <span className={`${apex.size} filter drop-shadow-[0_0_8px_rgba(245,158,11,1)] leading-none select-none`}>
                  👑
                </span>
                <div className="absolute -top-0.5 w-1.5 h-1.5 rounded-full bg-amber-200/80 blur-2xs [animation:epic-pulse-slow_1.5s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>

          {/* Floating gold dust particles along the sides */}
          {!isSmall && (
            <div className="absolute -inset-1 rounded-full [animation:epic-spin-cw_6s_linear_infinite]">
              <div className="absolute top-1 right-0 w-1.5 h-1.5 rounded-full bg-amber-200 shadow-[0_0_8px_#f59e0b]" />
              <div className="absolute top-1/2 -left-1 w-1.5 h-1.5 rounded-full bg-yellow-300 shadow-[0_0_6px_#fbbf24]" />
            </div>
          )}
        </div>
      );
    }

    // =========================================================================
    // 4. DRAGON RUBY CREST (Epic • Dragon Flame)
    // =========================================================================
    case 'cos_ruby_fire': {
      return (
        <div className={`pointer-events-none absolute inset-0 z-10 ${className}`} aria-hidden="true">
          {/* Blazing crimson magma border with heatwave pulsation */}
          <div className="absolute inset-0 rounded-full ring-2 md:ring-3 ring-rose-500 [animation:epic-ruby-burn_2s_ease-in-out_infinite]" />
          
          {/* Dragon Ruby Crest at the top — Symmetrically centered at 12 o'clock */}
          <div className={`absolute ${apex.top} left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-20`}>
            <div className="[animation:epic-float-bob_2s_ease-in-out_infinite] flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <span className={`${apex.size} filter drop-shadow-[0_0_8px_rgba(244,63,94,1)] leading-none select-none`}>
                  💎
                </span>
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[9px] filter drop-shadow-[0_0_6px_#f43f5e] select-none leading-none">
                  🔥
                </span>
              </div>
            </div>
          </div>

          {/* Rising Living Magma Embers on lower flanks (bottom center clear for level badge) */}
          {!isSmall && (
            <>
              <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f97316] [animation:epic-ember-float-1_2s_infinite]" />
              <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_#e11d48] [animation:epic-ember-float-2_2.4s_infinite_0.4s]" />
            </>
          )}
        </div>
      );
    }

    // =========================================================================
    // 5. COSMIC GALAXY CROWN (Mythic • Celestial)
    // =========================================================================
    case 'cos_galaxy_void': {
      return (
        <div className={`pointer-events-none absolute inset-0 z-10 ${className}`} aria-hidden="true">
          {/* Interstellar violet nebula vortex ring */}
          <div className="absolute inset-0 rounded-full ring-2 md:ring-3 ring-purple-500 [animation:epic-galaxy-pulse_2.8s_ease-in-out_infinite]" />
          <div 
            className="absolute -inset-1 rounded-full p-[2px] [animation:epic-spin-cw_8s_linear_infinite]"
            style={{
              background: 'conic-gradient(from 180deg, #a855f7, #6366f1, #3b82f6, #ec4899, #a855f7)',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #fff calc(100% - 2px))',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #fff calc(100% - 2px))',
            }}
          />

          {/* Hovering Cosmic Galaxy Crown — Perfectly centered at 12 o'clock */}
          <div className={`absolute ${apex.top} left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-20`}>
            <div className="[animation:epic-float-bob_2.8s_ease-in-out_infinite] flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <span className={`${apex.size} filter drop-shadow-[0_0_10px_rgba(168,85,247,1)] leading-none select-none`}>
                  🌌
                </span>
                <div className="absolute -top-0.5 w-2 h-2 rounded-full bg-purple-300/80 blur-2xs [animation:epic-pulse-slow_1.8s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>

          {/* Orbiting Planetary Star 1 (Violet) */}
          <div className="absolute -inset-1 rounded-full [animation:epic-spin-cw_3.2s_linear_infinite]">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-purple-200 shadow-[0_0_10px_#a855f7,0_0_18px_#c084fc]" />
          </div>

          {/* Orbiting Planetary Star 2 (Cyan - positioned on side flank, clear of level badge) */}
          <div className="absolute -inset-1 rounded-full [animation:epic-spin-ccw_5s_linear_infinite]">
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-200 shadow-[0_0_8px_#06b6d4]" />
          </div>

          {/* Orbiting Planetary Star 3 (Magenta) */}
          {!isSmall && (
            <div className="absolute -inset-1.5 rounded-full [animation:epic-spin-cw_7.2s_linear_infinite]">
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-pink-300 shadow-[0_0_8px_#ec4899]" />
            </div>
          )}
        </div>
      );
    }

    // =========================================================================
    // 6. BLAZING PHOENIX WINGS (LEGENDARY • Solar God)
    // =========================================================================
    case 'cos_phoenix_wings': {
      const cfg = PHOENIX_SIZE_MAP[size] || PHOENIX_SIZE_MAP.md;

      return (
        <div className={`pointer-events-none absolute inset-0 z-10 ${className}`} aria-hidden="true">
          {/* Left Phoenix Wing: Symmetrically centered on vertical axis */}
          <div 
            className={`absolute top-1/2 -translate-y-1/2 ${cfg.leftOffset} ${cfg.width} ${cfg.height} origin-center [animation:epic-wing-left_2.2s_ease-in-out_infinite] z-0 pointer-events-none`}
          >
            <svg 
              className="w-full h-full text-amber-500 filter drop-shadow-[0_0_6px_rgba(245,158,11,0.85)]" 
              viewBox="0 0 100 100" 
              fill="none"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="phoenix-left-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fde047" />
                </linearGradient>
                <linearGradient id="phoenix-left-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#fef08a" />
                </linearGradient>
                <linearGradient id="phoenix-left-grad-3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fde047" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>

              {/* Primary Outer Wing Feathers - Attaching at right edge (x=98) */}
              <path 
                d="M98 68 C80 44, 52 26, 12 16 C32 30, 48 44, 66 54 C46 50, 26 48, 10 44 C30 58, 52 66, 72 70 C52 70, 34 72, 26 74 C46 84, 74 84, 98 78 Z" 
                fill="url(#phoenix-left-grad-1)" 
                opacity="0.95"
              />
              {/* Secondary Layer of Glowing Feathers */}
              <path 
                d="M98 70 C82 50, 58 36, 26 28 C44 40, 58 50, 76 58 C56 56, 38 54, 22 50 C40 62, 62 70, 98 74 Z" 
                fill="url(#phoenix-left-grad-2)" 
                opacity="0.9"
              />
              {/* Inner Radiant Core Highlight */}
              <path 
                d="M98 72 C84 58, 68 48, 44 42 C60 52, 74 60, 98 70 Z" 
                fill="url(#phoenix-left-grad-3)" 
                opacity="0.95"
              />
            </svg>
          </div>

          {/* Right Phoenix Wing: Symmetrically centered on vertical axis */}
          <div 
            className={`absolute top-1/2 -translate-y-1/2 ${cfg.rightOffset} ${cfg.width} ${cfg.height} origin-center [animation:epic-wing-right_2.2s_ease-in-out_infinite] z-0 pointer-events-none`}
          >
            <svg 
              className="w-full h-full text-amber-500 filter drop-shadow-[0_0_6px_rgba(245,158,11,0.85)]" 
              viewBox="0 0 100 100" 
              fill="none"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="phoenix-right-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fde047" />
                </linearGradient>
                <linearGradient id="phoenix-right-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#fef08a" />
                </linearGradient>
                <linearGradient id="phoenix-right-grad-3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fde047" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>

              {/* Mirrored Right Wing Feathers - Attaching at left edge (x=2) */}
              <path 
                d="M2 68 C20 44, 48 26, 88 16 C68 30, 52 44, 34 54 C54 50, 74 48, 90 44 C70 58, 48 66, 28 70 C48 70, 66 72, 74 74 C54 84, 26 84, 2 78 Z" 
                fill="url(#phoenix-right-grad-1)" 
                opacity="0.95"
              />
              {/* Secondary Layer of Glowing Feathers */}
              <path 
                d="M2 70 C18 50, 42 36, 74 28 C56 40, 42 50, 24 58 C44 56, 62 54, 78 50 C60 62, 38 70, 2 74 Z" 
                fill="url(#phoenix-right-grad-2)" 
                opacity="0.9"
              />
              {/* Inner Radiant Core Highlight */}
              <path 
                d="M2 72 C16 58, 32 48, 56 42 C40 52, 26 60, 2 70 Z" 
                fill="url(#phoenix-right-grad-3)" 
                opacity="0.95"
              />
            </svg>
          </div>

          {/* Intense divine solar prominence flare border */}
          <div className="absolute inset-0 rounded-full ring-2 md:ring-3 ring-amber-400 [animation:epic-solar-flare_2.2s_ease-in-out_infinite]" />

          {/* Solar Corona Rays rotating around avatar */}
          <div 
            className="absolute -inset-1 rounded-full p-[2px] [animation:epic-spin-cw_6s_linear_infinite]"
            style={{
              background: 'conic-gradient(from 0deg, #f59e0b, #ef4444, #f59e0b, #facc15, #f59e0b)',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #fff calc(100% - 2px))',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #fff calc(100% - 2px))',
            }}
          />

          {/* Solar Phoenix Flame Crown — Symmetrically centered at 12 o'clock */}
          <div className={`absolute ${cfg.crownTop} left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-20`}>
            <div className="[animation:epic-float-bob_2s_ease-in-out_infinite] flex items-center justify-center">
              <span className={`${cfg.crownSize} filter drop-shadow-[0_0_10px_rgba(245,158,11,1)] leading-none select-none`}>
                ☀️
              </span>
            </div>
          </div>

          {/* Ascending Celestial Solar Embers on lower flanks (bottom center clear for level badge) */}
          {!isSmall && (
            <>
              <div className="absolute -bottom-0.5 left-1 w-1.5 h-1.5 rounded-full bg-yellow-300 shadow-[0_0_8px_#f59e0b] [animation:epic-ember-float-1_2s_infinite]" />
              <div className="absolute -bottom-0.5 right-1 w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_#ef4444] [animation:epic-ember-float-2_2.2s_infinite_0.5s]" />
            </>
          )}
        </div>
      );
    }

    default:
      return null;
  }
};
