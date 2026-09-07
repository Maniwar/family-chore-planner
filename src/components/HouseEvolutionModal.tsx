import React, { useState } from 'react';
import { 
  Home, 
  Sparkles, 
  Trophy, 
  Users, 
  Check, 
  Lock, 
  Crown, 
  Zap, 
  X, 
  ArrowRight, 
  ShieldCheck,
  Award,
  Flame,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HouseholdMember, HouseholdInfo } from '../types';
import { calculateHouseProgression, HOUSE_LEVELS, HouseLevelInfo } from '../utils/houseProgression';
import { Avatar } from './Avatar';
import { ThemePreset, THEMES, isGlassTheme } from '../utils/theme';
import { soundFX } from '../utils/audio';

interface HouseEvolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: HouseholdMember[];
  householdInfo?: HouseholdInfo;
  currentTheme?: ThemePreset;
  highlightMemberId?: string;
}

export const HouseEvolutionModal: React.FC<HouseEvolutionModalProps> = ({
  isOpen,
  onClose,
  members,
  householdInfo,
  currentTheme = 'rose',
  highlightMemberId,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'contributions' | 'tiers'>('contributions');
  const theme = THEMES[currentTheme] || THEMES.rose;
  const isGlass = isGlassTheme(currentTheme);

  const houseProg = calculateHouseProgression(members, householdInfo);
  const houseName = householdInfo?.familyName || 'Our Family Home';

  return (
    <div 
      className={`fixed inset-0 z-[75] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150 ${
        isGlass ? 'backdrop-blur-md bg-slate-900/50' : 'bg-slate-900/60'
      }`}
    >
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <div 
        className={`relative w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl border shadow-2xl flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom-4 duration-200 ${
          isGlass ? 'apple-glass-card border-white/40' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
          isGlass ? 'border-white/20' : 'border-slate-100 dark:border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-xs ${houseProg.currentLevel.badgeClass}`}>
              {houseProg.currentLevel.badgeEmoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {houseName} Evolution
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black border ${houseProg.currentLevel.badgeClass}`}>
                  House Lv. {houseProg.currentLevel.level}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {houseProg.currentLevel.epicSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFX.playPop();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 pt-3 shrink-0 flex items-center gap-2">
          <button
            onClick={() => {
              soundFX.playPop();
              setActiveTab('contributions');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'contributions'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Player EXP & Impact</span>
          </button>

          <button
            onClick={() => {
              soundFX.playPop();
              setActiveTab('tiers');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'tiers'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>House Levels & Perks</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Main House Epic Card */}
          <div className={`relative overflow-hidden rounded-3xl p-4 sm:p-5 text-white bg-gradient-to-br ${houseProg.currentLevel.bannerGradient} ${houseProg.currentLevel.auraGlow}`}>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-2xl sm:text-3xl">{houseProg.currentLevel.badgeEmoji}</span>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-white/80 block">
                      Current House Rank
                    </span>
                    <h3 className="text-lg sm:text-xl font-black tracking-tight text-white drop-shadow-xs">
                      {houseProg.currentLevel.title}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-white/90 leading-relaxed max-w-md pt-1">
                  {houseProg.currentLevel.description}
                </p>
              </div>

              {/* Total House EXP Box */}
              <div className="bg-black/25 backdrop-blur-md rounded-2xl p-3 border border-white/20 shrink-0 text-center sm:min-w-[130px]">
                <span className="text-[10px] uppercase font-bold text-white/70 block">
                  Combined House EXP
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-300">
                  {houseProg.totalHouseXp.toLocaleString()}
                </span>
                <span className="text-[10px] text-white/80 block font-semibold">
                  from {houseProg.totalFamilyMembers} helpers
                </span>
              </div>
            </div>

            {/* House Progress Bar */}
            <div className="relative z-10 mt-4 space-y-1.5 pt-2 border-t border-white/20">
              <div className="flex items-center justify-between text-xs font-bold text-white/90">
                <span>
                  {houseProg.isMaxLevel ? 'Ultimate Peak Reached!' : `Progress to House Lv. ${houseProg.nextLevel?.level}`}
                </span>
                <span className="text-amber-200">
                  {houseProg.isMaxLevel 
                    ? '100% (Max Tier)' 
                    : `${houseProg.pointsToNextLevel} XP needed`}
                </span>
              </div>

              <div className="h-3 w-full bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/20">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${houseProg.levelProgressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-amber-300 via-yellow-200 to-white rounded-full shadow-xs"
                />
              </div>

              {houseProg.nextLevel && (
                <div className="flex items-center justify-between text-[10px] text-white/80 font-medium">
                  <span>Lv. {houseProg.currentLevel.level} ({houseProg.currentLevel.minXp} XP)</span>
                  <span className="font-bold text-amber-200">
                    Next: {houseProg.nextLevel.badgeEmoji} {houseProg.nextLevel.title} ({houseProg.nextLevel.minXp} XP)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* TAB 1: PLAYER EXP & HOUSE IMPACT */}
          {activeTab === 'contributions' && (
            <div className="space-y-4">
              {/* How Automatic House Leveling Works Banner */}
              <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                isGlass 
                  ? 'apple-glass-card border-white/20 text-slate-800 dark:text-slate-200' 
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
              }`}>
                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-xs text-amber-900 dark:text-amber-200">
                      Automatic Family Synergy
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      As each family member earns points and levels up, your collective efforts automatically power up the House Level! Every chore completed contributes directly to the next epic evolution.
                    </p>
                  </div>
                </div>
              </div>

              {/* Combined Visual Contribution Bar */}
              <div className={`p-4 rounded-2xl border space-y-2.5 ${
                isGlass ? 'apple-glass-card border-white/20' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    <span>House Power Contribution Share</span>
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {houseProg.totalHouseXp} Total XP
                  </span>
                </div>

                {/* Multi-colored Stacked Bar */}
                <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-inner">
                  {houseProg.memberContributions.map((contrib) => {
                    if (contrib.playerXp <= 0) return null;
                    return (
                      <div
                        key={contrib.member.id}
                        style={{ width: `${contrib.contributionPercent}%` }}
                        className={`h-full transition-all duration-300 ${contrib.member.avatarColor || 'bg-indigo-500'}`}
                        title={`${contrib.member.name}: ${contrib.playerXp} XP (${contrib.contributionPercent}%)`}
                      />
                    );
                  })}
                </div>

                {/* Member Legend Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {houseProg.memberContributions.map((contrib) => (
                    <div 
                      key={contrib.member.id}
                      className="flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <span className={`w-2 h-2 rounded-full ${contrib.member.avatarColor || 'bg-indigo-500'}`} />
                      <span className="text-slate-800 dark:text-slate-200">{contrib.member.name}</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-black">{contrib.contributionPercent}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Individual Player Impact Cards */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-1">
                  Individual Helper Breakdown
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {houseProg.memberContributions.map((contrib) => {
                    const isHighlighted = highlightMemberId === contrib.member.id;
                    return (
                      <div
                        key={contrib.member.id}
                        className={`p-3.5 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
                          isHighlighted
                            ? 'ring-2 ring-amber-400 bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700'
                            : isGlass
                            ? 'apple-glass-card border-white/20'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {contrib.isLeadContributor && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[10px] font-black border border-amber-300 dark:border-amber-700">
                            <Crown className="w-3 h-3 text-amber-500" />
                            <span>Lead Pillar</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <Avatar member={contrib.member} size="md" />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-black text-slate-900 dark:text-white truncate">
                                {contrib.member.name}
                              </span>
                              <span className="text-xs">{contrib.badgeEmoji}</span>
                            </div>

                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                              Helper Lv. {contrib.playerLevel} • {contrib.playerLevelTitle}
                            </span>
                          </div>
                        </div>

                        {/* Player Metrics & Share */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-2 gap-2">
                          <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-500 dark:text-slate-400 block">
                              Player Lifetime EXP
                            </span>
                            <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                              {contrib.playerXp.toLocaleString()} XP
                            </span>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-500 dark:text-slate-400 block">
                              House Impact
                            </span>
                            <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                              {contrib.contributionPercent}% Power
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {contrib.member.name} has completed approx. <span className="font-bold text-slate-700 dark:text-slate-300">{contrib.choresCompletedEstimate} chores</span>, fueling {contrib.contributionPercent}% of the current House Evolution!
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HOUSE LEVELS & PERKS ROADMAP */}
          {activeTab === 'tiers' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 px-1 font-medium">
                Every House Level unlocks more epic family prestige, printable house crests, and household perks!
              </div>

              <div className="space-y-2.5">
                {HOUSE_LEVELS.map((lvl) => {
                  const isCurrent = lvl.level === houseProg.currentLevel.level;
                  const isUnlocked = lvl.level <= houseProg.currentLevel.level;

                  return (
                    <div
                      key={lvl.level}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCurrent
                          ? `ring-2 ring-amber-400 ${isGlass ? 'apple-glass-card' : 'bg-amber-50/50 dark:bg-amber-950/30'} ${lvl.borderClass}`
                          : isUnlocked
                          ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                          : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 ${lvl.badgeClass}`}>
                            {lvl.badgeEmoji}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                Level {lvl.level}: {lvl.title}
                              </h4>
                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
                                  Current Home Tier
                                </span>
                              )}
                              {isUnlocked && !isCurrent && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Achieved</span>
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {lvl.epicSubtitle} • Required: <span className="font-bold text-slate-700 dark:text-slate-300">{lvl.minXp.toLocaleString()} Combined XP</span>
                            </p>
                          </div>
                        </div>

                        {!isUnlocked && (
                          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 shrink-0">
                            <Lock className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {lvl.description}
                      </p>

                      {/* Unlocked Perks */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-500 dark:text-slate-400 block mb-1.5">
                          Tier Privileges & Rewards:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {lvl.unlockedPerks.map((perk, idx) => (
                            <span
                              key={idx}
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                                isUnlocked
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>{perk}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between shrink-0 ${
          isGlass ? 'border-white/20' : 'border-slate-100 dark:border-slate-800'
        }`}>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Keep completing chores together to level up the house!
          </div>

          <button
            onClick={() => {
              soundFX.playPop();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 transition-transform active:scale-95 cursor-pointer shadow-xs min-h-[40px]"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
