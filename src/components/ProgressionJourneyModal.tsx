import React, { useState } from 'react';
import { 
  Trophy, 
  Sparkles, 
  Zap, 
  Flame, 
  Lock, 
  Unlock, 
  Check, 
  ChevronRight, 
  ShieldCheck, 
  Crown, 
  Gem,
  Award,
  ArrowRight,
  Gift
} from 'lucide-react';
import { HouseholdMember } from '../types';
import { PROGRESSION_LEVELS, getMemberProgression, COSMETIC_ITEMS, CosmeticAvatarItem } from '../utils/progression';
import { Avatar } from './Avatar';
import { soundFX } from '../utils/audio';
import { ThemePreset, THEMES, isGlassTheme } from '../utils/theme';

interface ProgressionJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: HouseholdMember[];
  selectedMemberId: string;
  onSelectMember: (id: string) => void;
  onEquipCosmetic: (memberId: string, cosmeticId: string) => void;
  currentTheme?: ThemePreset;
  onNavigateToRewards?: () => void;
}

export const ProgressionJourneyModal: React.FC<ProgressionJourneyModalProps> = ({
  isOpen,
  onClose,
  members,
  selectedMemberId,
  onSelectMember,
  onEquipCosmetic,
  currentTheme = 'rose',
  onNavigateToRewards,
}) => {
  if (!isOpen) return null;

  const theme = THEMES[currentTheme] || THEMES.rose;
  const isGlass = isGlassTheme(currentTheme);

  const eligibleKids = members.filter(m => m.role !== 'parent');
  const activeMember = members.find(m => m.id === selectedMemberId) || eligibleKids[0] || members[0];
  const progression = getMemberProgression(activeMember);

  const [activeTab, setActiveTab] = useState<'track' | 'cosmetics'>('track');

  return (
    <div 
      className={`fixed inset-0 z-[75] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150 ${
        isGlass ? 'backdrop-blur-md bg-slate-900/40' : 'bg-slate-900/60'
      }`}
    >
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <div 
        className={`relative w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl border shadow-2xl flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom-4 duration-200 ${
          isGlass ? 'apple-glass-card border-white/40' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}
      >
        {/* Header with Title and Member Switcher */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <Trophy className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                <span>Hero Progression Track</span>
                <span className="text-xs bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  Game Theory Engine
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unlock tiers, avatar cosmetics, and legendary cash payouts through daily chore consistency.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Member Selector Bar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Player:
          </span>
          {members.map(m => {
            const isSelected = m.id === activeMember.id;
            const mProg = getMemberProgression(m);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  onSelectMember(m.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[36px] active:scale-95 border ${
                  isSelected
                    ? isGlass 
                      ? 'bg-white text-slate-900 border-white shadow-xs font-black' 
                      : `${theme.primaryBg} ${theme.primaryText} border-transparent shadow-xs font-black`
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>{m.avatarEmoji || '🧑'}</span>
                <span>{m.name.split(' ')[0]}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-amber-500 text-white text-[10px] font-black">
                  Lv.{mProg.currentLevel.level}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Hero Status Card */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <Avatar
                photoUrl={activeMember.avatarPhotoUrl}
                emoji={activeMember.avatarEmoji}
                name={activeMember.name}
                size="lg"
                className="shadow-sm"
                cosmeticClass={
                  COSMETIC_ITEMS.find(c => c.id === activeMember.equippedCosmeticId)?.cssClass
                }
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {activeMember.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-500 text-white shadow-2xs">
                    {progression.currentLevel.badgeEmoji} Level {progression.currentLevel.level}
                  </span>
                </div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  {progression.currentLevel.title} • {progression.xp} Lifetime XP
                </p>
                {progression.streakMultiplier > 1.0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-md mt-1">
                    <Flame className="w-3 h-3 fill-rose-500" />
                    {activeMember.streakDays}d Streak Active ({progression.streakMultiplier}x XP Multiplier!)
                  </span>
                )}
              </div>
            </div>

            {/* Level XP Progress Meter */}
            <div className="w-full sm:w-60 bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                <span>Level {progression.currentLevel.level} Progress</span>
                <span className="font-black text-amber-600 dark:text-amber-400">
                  {progression.nextLevel ? `${progression.progressPercent}%` : 'MAX LEVEL'}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${progression.progressPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 text-right">
                {progression.nextLevel 
                  ? `${progression.pointsToNext} XP needed for Level ${progression.nextLevel.level}`
                  : 'Highest Rank Achieved 👑'}
              </p>
            </div>
          </div>

          {/* Sub-Tab navigation: Levels Track vs Avatar Cosmetics Locker */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                setActiveTab('track');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer min-h-[34px] flex items-center gap-1.5 ${
                activeTab === 'track'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/40'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Progression Tiers ({PROGRESSION_LEVELS.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                setActiveTab('cosmetics');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer min-h-[34px] flex items-center gap-1.5 ${
                activeTab === 'cosmetics'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Avatar Cosmetics & Frames</span>
              <span className="px-1.5 py-0.2 rounded-md bg-cyan-500 text-white text-[9px] font-black">
                NEW
              </span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'track' ? (
            /* Levels Track View */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Game Theory Progression Path
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Lifetime XP Never Decreases on Reward Spend
                </span>
              </div>

              {PROGRESSION_LEVELS.map((lvl) => {
                const isUnlocked = progression.xp >= lvl.minPoints;
                const isCurrent = progression.currentLevel.level === lvl.level;

                return (
                  <div
                    key={lvl.level}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-start sm:items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 shadow-xs ring-1 ring-amber-400/50'
                        : isUnlocked
                          ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border ${
                        isUnlocked
                          ? 'bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-700'
                          : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
                      }`}>
                        {isUnlocked ? lvl.badgeEmoji : <Lock className="w-5 h-5 text-slate-400" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">
                            Level {lvl.level}: {lvl.title}
                          </h4>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
                              Current Rank
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {lvl.minPoints} XP required • <span className="font-bold text-amber-700 dark:text-amber-300">{lvl.perk}</span>
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {isUnlocked ? (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Unlocked</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Need {lvl.minPoints - progression.xp} XP</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Avatar Cosmetics Locker View */
            <div className="space-y-4">
              <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 rounded-2xl flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-xs text-cyan-950 dark:text-cyan-200 leading-relaxed font-medium">
                  <strong>Kid Cosmetic Showcase:</strong> Just like micro-transaction games, kids can redeem points for in-app vanity items (cyber neon rings, golden champion borders, galaxy crowns) that display directly on their profile picture in all chore schedules!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COSMETIC_ITEMS.map((item) => {
                  const isLevelEligible = progression.currentLevel.level >= item.minLevel;
                  const isUnlocked = activeMember.unlockedCosmeticIds?.includes(item.id);
                  const isEquipped = activeMember.equippedCosmeticId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                        isEquipped
                          ? 'bg-cyan-50/70 dark:bg-cyan-950/40 border-cyan-400 dark:border-cyan-700 ring-2 ring-cyan-400/40'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="relative">
                          <Avatar
                            photoUrl={activeMember.avatarPhotoUrl}
                            emoji={activeMember.avatarEmoji}
                            name={activeMember.name}
                            size="md"
                            cosmeticClass={item.cssClass}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {item.description}
                          </p>
                          <span className="inline-block text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md mt-1">
                            Requires Lv.{item.minLevel} • {item.pointCost} pts
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div>
                        {isEquipped ? (
                          <button
                            type="button"
                            onClick={() => {
                              soundFX.playPop();
                              onEquipCosmetic(activeMember.id, '');
                            }}
                            className="w-full py-2 rounded-xl text-xs font-black bg-cyan-600 hover:bg-cyan-700 text-white flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Equipped (Tap to Unequip)</span>
                          </button>
                        ) : isUnlocked ? (
                          <button
                            type="button"
                            onClick={() => {
                              soundFX.playFanfare();
                              onEquipCosmetic(activeMember.id, item.id);
                            }}
                            className="w-full py-2 rounded-xl text-xs font-black bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-900 flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs"
                          >
                            <span>Equip Frame</span>
                          </button>
                        ) : !isLevelEligible ? (
                          <div className="w-full py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Unlocks at Level {item.minLevel}</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              if (onNavigateToRewards) onNavigateToRewards();
                            }}
                            className="w-full py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            <span>Claim in Store ({item.pointCost} pts)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Current balance: <strong className="text-amber-600 dark:text-amber-400 font-black">{activeMember.currentPoints} pts</strong> available to spend
          </p>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
