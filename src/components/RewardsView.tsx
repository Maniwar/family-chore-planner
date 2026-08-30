import React, { useState } from 'react';
import { 
  Award, 
  Gift, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  X, 
  Trash2, 
  DollarSign, 
  Gamepad2, 
  Film, 
  IceCream, 
  Star,
  Check,
  ChevronRight,
  Filter,
  User
} from 'lucide-react';
import { RewardItem, RewardClaim, HouseholdMember } from '../types';
import { Avatar } from './Avatar';
import { useBottomSheet } from '../hooks/useBottomSheet';
import { BottomSheetGrabber } from './BottomSheetGrabber';
import { soundFX } from '../utils/audio';
import { ThemePreset, THEMES, isGlassTheme } from '../utils/theme';

interface RewardsViewProps {
  rewards: RewardItem[];
  claims: RewardClaim[];
  members: HouseholdMember[];
  isMomMode: boolean;
  currentTheme?: ThemePreset;
  onClaimReward: (rewardId: string, memberId: string, note?: string) => void;
  onApproveClaim: (claimId: string, parentNote?: string) => void;
  onDeliverClaim: (claimId: string, parentNote?: string) => void;
  onRejectClaim?: (claimId: string, parentNote?: string) => void;
  onAddNewReward: (reward: Omit<RewardItem, 'id'>) => void;
  onDeleteReward: (rewardId: string) => void;
  onNavigateToRedemptions?: () => void;
}

type RewardCategory = 'all' | 'treat' | 'allowance' | 'screentime' | 'activity' | 'privilege';

export const RewardsView: React.FC<RewardsViewProps> = ({
  rewards,
  claims,
  members,
  isMomMode,
  currentTheme = 'rose',
  onClaimReward,
  onApproveClaim,
  onDeliverClaim,
  onRejectClaim,
  onAddNewReward,
  onDeleteReward,
  onNavigateToRedemptions,
}) => {
  const theme = THEMES[currentTheme] || THEMES.rose;
  const [showAddModal, setShowAddModal] = useState(false);
  const [claimModalReward, setClaimModalReward] = useState<RewardItem | null>(null);
  const [selectedFilterMemberId, setSelectedFilterMemberId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<RewardCategory>('all');
  const [selectedClaimMemberId, setSelectedClaimMemberId] = useState<string>(
    members.find(m => m.role !== 'parent')?.id || members[0]?.id || ''
  );
  const [claimNote, setClaimNote] = useState<string>('');

  // New reward form state
  const [newTitle, setNewTitle] = useState('');
  const [newPoints, setNewPoints] = useState(50);
  const [newCategory, setNewCategory] = useState<'treat' | 'allowance' | 'screentime' | 'activity' | 'privilege'>('treat');
  const [newDesc, setNewDesc] = useState('');

  const pendingClaims = claims.filter(c => c.status === 'pending');
  const activeMember = members.find(m => m.id === selectedFilterMemberId);

  const handleCreateReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    soundFX.playPop();
    onAddNewReward({
      title: newTitle.trim(),
      pointCost: Number(newPoints) || 50,
      category: newCategory,
      description: newDesc.trim(),
      icon: 'Gift',
    });

    setShowAddModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewPoints(50);
  };

  const handleConfirmClaim = () => {
    if (!claimModalReward || !selectedClaimMemberId) return;
    soundFX.playFanfare();
    onClaimReward(claimModalReward.id, selectedClaimMemberId);
    setClaimModalReward(null);
  };

  const getCategoryInfo = (cat: string) => {
    switch (cat) {
      case 'screentime': 
        return { label: 'Screen Time', emoji: '🎮', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'activity': 
        return { label: 'Outing / Activity', emoji: '🎟️', badge: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'treat': 
        return { label: 'Treat / Food', emoji: '🍦', badge: 'bg-pink-50 text-pink-700 border-pink-200' };
      case 'allowance': 
        return { label: 'Allowance', emoji: '💵', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'privilege':
        return { label: 'Privilege', emoji: '🌟', badge: 'bg-amber-50 text-amber-800 border-amber-200' };
      default: 
        return { label: cat, emoji: '🎁', badge: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const filteredRewards = rewards.filter((reward) => {
    if (selectedCategory !== 'all' && reward.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-3 sm:space-y-5 pb-16 sm:pb-6">
      
      {/* Header & Primary Action Bar */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-xs flex items-center justify-between gap-2 min-w-0 ${isGlassTheme(currentTheme) ? 'apple-glass-panel border-white/40' : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'}`}>
        <div className="min-w-0 flex-1">
          <h1 className={`text-lg sm:text-2xl font-black tracking-tight leading-tight truncate ${theme.appTextClass || 'text-slate-900 dark:text-white'}`}>
            Rewards & Store
          </h1>
          <p className={`text-[11px] sm:text-xs font-medium truncate ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-500 dark:text-slate-400'}`}>
            Redeem chore points for perks, treats & allowance
          </p>
        </div>

        {isMomMode && (
          <button
            onClick={() => {
              soundFX.playPop();
              setShowAddModal(true);
            }}
            className={`inline-flex items-center justify-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black shadow-2xs transition-all active:scale-95 cursor-pointer min-h-[36px] shrink-0 ${isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : `${theme.primaryBg} ${theme.primaryHover} ${theme.primaryText}`}`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Reward</span>
          </button>
        )}
      </div>

      {/* Sleek Family Points Balance Strip (Horizontal Ribbon) */}
      <div className={`rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 shadow-2xs border ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20 text-slate-900' : `${theme.heroBannerBg} ${theme.heroBannerText} ${theme.heroBannerBorder} ${theme.heroBannerGlow}`}`}>
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider opacity-80">
            Family Points Balance
          </span>
          <span className="text-[10px] sm:text-[11px] font-medium opacity-85 truncate max-w-[170px]">
            {selectedFilterMemberId === 'all' ? 'Tap member to see affordability' : `Filtered: ${activeMember?.name.split(' ')[0]}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 -mx-0.5 px-0.5">
          <button
            onClick={() => {
              soundFX.playPop();
              setSelectedFilterMemberId('all');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] sm:min-h-[44px] touch-target active:scale-95 border ${
              selectedFilterMemberId === 'all'
                ? 'bg-white text-slate-900 border-white shadow-xs font-black'
                : isGlassTheme(currentTheme) ? 'bg-white/30 text-slate-800 border-white/40 hover:bg-white/40' : 'bg-white/15 text-white border-white/20 hover:bg-white/25'
            }`}
          >
            <span>👨‍👩‍👧‍👦 All Kids</span>
          </button>

          {members.map((member) => {
            const isSelected = selectedFilterMemberId === member.id;
            return (
              <button
                key={member.id}
                onClick={() => {
                  soundFX.playPop();
                  setSelectedFilterMemberId(isSelected ? 'all' : member.id);
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] sm:min-h-[44px] touch-target active:scale-95 border ${
                  isSelected
                    ? 'bg-white text-slate-900 border-white shadow-xs font-black scale-[1.02]'
                    : isGlassTheme(currentTheme) ? 'bg-white/30 text-slate-800 border-white/40 hover:bg-white/40' : 'bg-white/15 text-white border-white/20 hover:bg-white/25'
                }`}
              >
                <Avatar photoUrl={member.avatarPhotoUrl} emoji={member.avatarEmoji} name={member.name} size="xs" showBorder={false} />
                <span className="truncate max-w-[75px]">{member.name.split(' ')[0]}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black ${
                  isSelected ? `${theme.primaryBg} ${theme.primaryText}` : 'bg-black/20 text-white'
                }`}>
                  ⭐ {member.currentPoints}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pending Claims Queue (Compact Notice & List) */}
      {pendingClaims.length > 0 && (
        <div className={`rounded-2xl border p-3 sm:p-4 shadow-2xs space-y-2.5 ${isGlassTheme(currentTheme) ? 'apple-glass-card border-amber-200/50' : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300/80 dark:border-amber-800'}`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Pending Reward Requests ({pendingClaims.length})</span>
            </h3>
            <div className="flex items-center gap-2">
              {onNavigateToRedemptions && (
                <button
                  onClick={() => {
                    soundFX.playPop();
                    onNavigateToRedemptions();
                  }}
                  className={`text-[11px] font-black px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${isGlassTheme(currentTheme) ? 'bg-amber-200/50 text-amber-950 border border-amber-300/60 hover:bg-amber-200/70 shadow-xs backdrop-blur-md' : 'text-amber-900 dark:text-amber-200 bg-amber-200/80 dark:bg-amber-900/60 hover:bg-amber-300 dark:hover:bg-amber-800'}`}
                >
                  <span>Track & Manage</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            {pendingClaims.map((claim) => (
              <div key={claim.id} className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-2 shadow-2xs ${isGlassTheme(currentTheme) ? 'apple-glass-card border-amber-200/50' : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800/80'}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-xs font-black text-slate-900 dark:text-white truncate">{claim.memberName}</span>
                    <span className="text-[11px] font-black text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.2 rounded-md shrink-0">
                      ⭐ {claim.pointCost} pts
                    </span>
                  </div>
                  <p className={`text-[11px] font-medium ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-600 dark:text-slate-400'} truncate mt-0.5`}>{claim.rewardTitle}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isMomMode ? (
                    <button
                      onClick={() => {
                        soundFX.playComplete();
                        onApproveClaim(claim.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg active:scale-95 text-xs font-black shadow-2xs transition-all cursor-pointer min-h-[38px] flex items-center gap-1 ${isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-1 rounded-lg">
                      Pending ⏳
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter Chips */}
      <div className={`flex items-center gap-2 overflow-x-auto scrollbar-none p-2 sm:p-3 rounded-2xl sm:rounded-3xl border shadow-xs ${isGlassTheme(currentTheme) ? 'apple-glass-panel border-white/40' : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/90 dark:border-slate-800'}`}>
        {[
          { id: 'all', label: 'All Rewards', emoji: '🎁' },
          { id: 'treat', label: 'Treats & Snacks', emoji: '🍦' },
          { id: 'screentime', label: 'Screen Time', emoji: '🎮' },
          { id: 'activity', label: 'Outings', emoji: '🎟️' },
          { id: 'allowance', label: 'Allowance', emoji: '💵' },
          { id: 'privilege', label: 'Privileges', emoji: '🌟' },
        ].map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                soundFX.playPop();
                setSelectedCategory(cat.id as RewardCategory);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[38px] active:scale-95 ${
                isSelected
                  ? (isGlassTheme(currentTheme) ? `bg-white/60 shadow-2xs font-extrabold border border-white/80 ${theme.appTextClass || 'text-slate-900 dark:text-white'}` : `${theme.primaryBg} ${theme.primaryText} shadow-2xs font-extrabold`)
                  : isGlassTheme(currentTheme) ? `bg-white/40 hover:bg-white/60 border border-white/50 font-bold shadow-sm ${theme.appTextClass || 'text-slate-900 dark:text-white'}` : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Rewards Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
        {filteredRewards.map((reward) => {
          const catInfo = getCategoryInfo(reward.category);
          
          // Check affordability for selected member
          const memberPoints = activeMember ? activeMember.currentPoints : 0;
          const canAfford = !activeMember || memberPoints >= reward.pointCost;
          const pointsNeeded = activeMember ? Math.max(0, reward.pointCost - memberPoints) : 0;
          const progressPercent = activeMember ? Math.min(100, Math.round((memberPoints / reward.pointCost) * 100)) : 100;

          return (
            <div
              key={reward.id}
              className={`${
                isGlassTheme(currentTheme) ? 'apple-glass-card' : theme.cardBg
              } rounded-2xl border ${
                isGlassTheme(currentTheme) ? 'border-white/20' : theme.cardBorder
              } p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all`}
            >
              <div>
                {/* Category & Cost Badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${catInfo.badge}`}>
                    <span>{catInfo.emoji}</span>
                    <span>{catInfo.label}</span>
                  </span>

                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-800 shadow-2xs flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                    <span>{reward.pointCost} pts</span>
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className={`text-sm sm:text-base font-extrabold mb-1 leading-snug break-words ${theme.appTextClass || 'text-slate-900 dark:text-white'}`}>
                  {reward.title}
                </h3>

                {reward.description && (
                  <p className={`text-[12px] ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-500 dark:text-slate-400'} mb-2.5 line-clamp-2 leading-relaxed`}>
                    {reward.description}
                  </p>
                )}

                {/* Affordability Progress when a specific member is selected */}
                {activeMember && (
                  <div className={`my-2 p-2 rounded-xl border space-y-1 ${isGlassTheme(currentTheme) ? 'bg-white/10 border-white/20' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700/60'}`}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`font-semibold truncate ${isGlassTheme(currentTheme) ? 'text-slate-900' : 'text-slate-600 dark:text-slate-300'}`}>{activeMember.name.split(' ')[0]}'s Progress:</span>
                      <span className={`font-extrabold ${canAfford ? (isGlassTheme(currentTheme) ? 'text-emerald-300' : 'text-emerald-600 dark:text-emerald-400') : (isGlassTheme(currentTheme) ? 'text-amber-300' : 'text-amber-700 dark:text-amber-400')}`}>
                        {canAfford ? 'Ready to Claim! 🎉' : `Need ${pointsNeeded} more pts`}
                      </span>
                    </div>
                    <div className={`w-full rounded-full h-1.5 overflow-hidden ${isGlassTheme(currentTheme) ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${canAfford ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button Strip */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 mt-1">
                <button
                  onClick={() => {
                    soundFX.playPop();
                    if (activeMember) {
                      setSelectedClaimMemberId(activeMember.id);
                    }
                    setClaimModalReward(reward);
                  }}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold shadow-2xs transition-all cursor-pointer min-h-[40px] touch-target active:scale-95 ${
                    isGlassTheme(currentTheme) && canAfford ? 'apple-glass-button-primary' : isGlassTheme(currentTheme) && !canAfford ? 'apple-glass-button opacity-50 cursor-not-allowed' :
                    canAfford
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>{canAfford ? 'Redeem Reward' : 'Check Requirements'}</span>
                </button>

                {isMomMode && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${reward.title}" from rewards catalog?`)) {
                        soundFX.playPop();
                        onDeleteReward(reward.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                    title="Delete Reward"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Kid-Friendly Guide: How Points & Quality Grading Work */}
      <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-amber-50/50 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-800/80 rounded-2xl border border-indigo-100 dark:border-slate-700/80 p-3.5 sm:p-4.5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
              💡
            </div>
            <div>
              <h3 className={`text-xs sm:text-sm font-black ${theme.appTextClass || 'text-slate-900 dark:text-white'}`}>
                How to Earn Maximum Points
              </h3>
              <p className={`text-[11px] ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-500 dark:text-slate-400'} font-medium`}>
                Finish chores on time with top quality to buy what you want from the store!
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className={`p-2.5 rounded-xl border space-y-1 ${isGlassTheme(currentTheme) ? 'bg-white/20 border-indigo-200/50' : 'bg-white/80 dark:bg-slate-900/80 border-indigo-100/80 dark:border-slate-700'}`}>
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-emerald-700 dark:text-emerald-300">🌟 Top Quality (A+)</span>
              <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded-md">100% Pts</span>
            </div>
            <p className={`text-[11px] ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-600 dark:text-slate-400'} leading-snug`}>
              Follow all checklist steps & take clean photo proof to get 5 Stars and full points.
            </p>
          </div>

          <div className={`p-2.5 rounded-xl border space-y-1 ${isGlassTheme(currentTheme) ? 'bg-white/20 border-amber-200/50' : 'bg-white/80 dark:bg-slate-900/80 border-amber-100/80 dark:border-slate-700'}`}>
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-amber-700 dark:text-amber-300">⏰ On-Time Bonus</span>
              <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded-md">0% Penalty</span>
            </div>
            <p className={`text-[11px] ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-600 dark:text-slate-400'} leading-snug`}>
              Finish on time. 1 day late keeps 90%, 2 days keeps 75%, 3+ days keeps 50%.
            </p>
          </div>

          <div className={`p-2.5 rounded-xl border space-y-1 ${isGlassTheme(currentTheme) ? 'bg-white/20 border-purple-200/50' : 'bg-white/80 dark:bg-slate-900/80 border-purple-100/80 dark:border-slate-700'}`}>
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-purple-700 dark:text-purple-300">🔄 Quick Redos</span>
              <span className="text-[10px] font-black bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-1.5 py-0.2 rounded-md">Full Recovery</span>
            </div>
            <p className={`text-[11px] ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-600 dark:text-slate-400'} leading-snug`}>
              If Mom asks for a quick redo, fix the missing item right away to earn your points!
            </p>
          </div>
        </div>
      </div>

      {filteredRewards.length === 0 && (
        <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Gift className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No rewards in this category</p>
          <p className={`text-xs ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-500 dark:text-slate-400'} mt-0.5`}>Try selecting "All Rewards" or add a new custom reward.</p>
        </div>
      )}

      {/* Claim Modal - Mobile iOS Bottom Sheet */}
      {claimModalReward && (
        <div className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150 ${isGlassTheme(currentTheme) ? 'bg-slate-900/15 backdrop-blur-md' : 'bg-slate-900/60 backdrop-blur-xs'}`}>
          <div 
            className="fixed inset-0"
            onClick={() => setClaimModalReward(null)}
          />
          <div 
            className={`relative rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-4 sm:p-5 shadow-2xl border space-y-3.5 animate-in slide-in-from-bottom duration-200 max-h-[90vh] overflow-y-auto safe-area-pb z-10 ${isGlassTheme(currentTheme) ? 'apple-glass-panel border-white/30' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
            
            {/* Top Drag Handle for Mobile */}
            <div className="sm:hidden pt-1 pb-0.5 flex justify-center">
              <div className={`w-12 h-1.5 rounded-full transition-colors ${isGlassTheme(currentTheme) ? 'bg-white/40' : 'bg-slate-300 dark:bg-slate-600'}`} />
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Claim Reward</h3>
                <p className={`text-xs ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-500 dark:text-slate-400'} font-medium`}>Request redemption from family store</p>
              </div>
              <button 
                onClick={() => setClaimModalReward(null)} 
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 text-center">
              <span className="text-2xl mb-1 block">🎁</span>
              <h4 className="text-sm font-black text-amber-950 dark:text-amber-100">{claimModalReward.title}</h4>
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mt-0.5">Cost: {claimModalReward.pointCost} Points</p>
            </div>

            <div>
              <label className={`block text-[11px] font-black ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-600 dark:text-slate-400'} uppercase tracking-wider mb-2`}>
                Who is claiming this reward?
              </label>
              <div className="space-y-1.5">
                {members.filter(m => m.role !== 'parent').map((m) => {
                  const hasEnough = m.currentPoints >= claimModalReward.pointCost;
                  const isSelected = selectedClaimMemberId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={!hasEnough}
                      onClick={() => {
                        soundFX.playPop();
                        setSelectedClaimMemberId(m.id);
                      }}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer min-h-[44px] ${
                        !hasEnough 
                          ? 'opacity-50 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                          : isSelected
                            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/20'
                            : (isGlassTheme(currentTheme) ? 'apple-glass-card border-white/40 text-slate-900' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750')
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar photoUrl={m.avatarPhotoUrl} emoji={m.avatarEmoji} name={m.name} size="xs" showBorder={false} />
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{m.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[11px] font-black ${hasEnough ? 'text-amber-800 dark:text-amber-300' : 'text-slate-400'}`}>
                          {m.currentPoints} pts
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-amber-600 font-bold" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={`block text-[11px] font-black uppercase tracking-wider ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-600 dark:text-slate-400'} mb-1`}>
                Note for Mom (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Can we do this on Friday night?"
                value={claimNote}
                onChange={(e) => setClaimNote(e.target.value)}
                className={`w-full text-xs p-2.5 rounded-xl border font-medium focus:ring-2 focus:ring-rose-500 transition-all ${isGlassTheme(currentTheme) ? 'bg-white/40 border-white/40 focus:bg-white/60 text-slate-900 placeholder-slate-500' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'}`}
              />
            </div>

            <div className="pt-2 flex gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setClaimModalReward(null)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold min-h-[40px] cursor-pointer ${isGlassTheme(currentTheme) ? 'text-slate-900 hover:bg-white/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!claimModalReward || !selectedClaimMemberId) return;
                  soundFX.playFanfare();
                  onClaimReward(claimModalReward.id, selectedClaimMemberId, claimNote.trim() || undefined);
                  setClaimModalReward(null);
                  setClaimNote('');
                }}
                disabled={!selectedClaimMemberId || (members.find(m => m.id === selectedClaimMemberId)?.currentPoints || 0) < claimModalReward.pointCost}
                className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold active:scale-95 shadow-2xs cursor-pointer min-h-[40px] disabled:opacity-50 ${isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
              >
                Confirm Claim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Reward Modal - Mobile iOS Bottom Sheet */}
      {showAddModal && (
        <AddRewardModalComponent 
          onClose={() => setShowAddModal(false)}
          currentTheme={currentTheme}
          isGlassTheme={isGlassTheme}
          onSave={(rewardData: any) => {
            onAddNewReward(rewardData);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
};


function AddRewardModalComponent({ onClose, currentTheme, isGlassTheme, onSave }: any) {
  const [newTitle, setNewTitle] = React.useState('');
  const [newPoints, setNewPoints] = React.useState(50);
  const [newCategory, setNewCategory] = React.useState<'treat' | 'allowance' | 'screentime' | 'activity' | 'privilege'>('treat');
  const [newDesc, setNewDesc] = React.useState('');
  
  const { sheetStyle, handleDismiss, dragHandleProps } = useBottomSheet({ onClose });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    soundFX.playPop();
    onSave({
      title: newTitle.trim(),
      pointCost: Number(newPoints) || 50,
      category: newCategory,
      description: newDesc.trim(),
      icon: 'Gift',
    });
  };

  return (
    <div className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150 ${isGlassTheme(currentTheme) ? 'bg-slate-900/15 backdrop-blur-md' : 'bg-slate-900/60 backdrop-blur-xs'}`}>
      <div 
        className="fixed inset-0"
        onClick={handleDismiss}
      />
      <div 
        style={sheetStyle}
        className={`relative rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl border flex flex-col animate-in slide-in-from-bottom duration-200 max-h-[90vh] z-10 ${isGlassTheme(currentTheme) ? 'apple-glass-panel border-white/30' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
        <div className="shrink-0 border-b border-slate-200/50 dark:border-slate-800/50 pb-2 bg-white/10 dark:bg-black/10 rounded-t-3xl">
          <BottomSheetGrabber dragHandleProps={dragHandleProps} onClose={handleDismiss} />
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto safe-area-pb space-y-3.5">
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Add New Family Reward</h3>
            <p className={`text-xs ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-500 dark:text-slate-400'} font-medium`}>Create a perk or treat kids can work toward</p>
          </div>
          <button 
            onClick={handleDismiss}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={`block text-[11px] font-black uppercase tracking-wider ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-600 dark:text-slate-400'} mb-1`}>
              Reward Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pizza Night Topping Choice"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className={`w-full text-xs sm:text-sm p-2.5 sm:p-3 rounded-xl border font-semibold min-h-[40px] focus:ring-2 focus:ring-rose-500 transition-all ${isGlassTheme(currentTheme) ? 'bg-white/40 border-white/40 focus:bg-white/60 text-slate-900 placeholder-slate-500' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'}`}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={`block text-[11px] font-black uppercase tracking-wider ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-600 dark:text-slate-400'} mb-1`}>
                Point Cost
              </label>
              <input
                type="number"
                min="5"
                max="1000"
                value={newPoints}
                onChange={(e) => setNewPoints(Number(e.target.value))}
                className={`w-full text-xs sm:text-sm p-2.5 sm:p-3 rounded-xl border font-black text-amber-900 dark:text-amber-200 min-h-[40px] focus:ring-2 focus:ring-rose-500 transition-all ${isGlassTheme(currentTheme) ? 'bg-white/40 border-white/20 focus:bg-white/60' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'}`}
              />
            </div>
            <div>
              <label className={`block text-[11px] font-black uppercase tracking-wider ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-600 dark:text-slate-400'} mb-1`}>
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className={`w-full text-xs sm:text-sm p-2.5 sm:p-3 rounded-xl border font-semibold min-h-[40px] focus:ring-2 focus:ring-rose-500 transition-all ${isGlassTheme(currentTheme) ? 'bg-white/40 border-white/40 focus:bg-white/60 text-slate-900 placeholder-slate-500' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'}`}
              >
                <option value="treat">🍦 Treat / Food</option>
                <option value="screentime">🎮 Screen Time</option>
                <option value="activity">🎟️ Outing / Activity</option>
                <option value="allowance">💵 Cash Allowance</option>
                <option value="privilege">🌟 Special Privilege</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className={`block text-[11px] font-black uppercase tracking-wider ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-600 dark:text-slate-400'} mb-1`}>
              Description / Redemption Rules
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Can be redeemed on Friday or weekend family movie night"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className={`w-full text-xs sm:text-sm p-2.5 rounded-xl border font-medium focus:ring-2 focus:ring-rose-500 transition-all ${isGlassTheme(currentTheme) ? 'bg-white/40 border-white/40 focus:bg-white/60 text-slate-900 placeholder-slate-500' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'}`}
            />
          </div>
          
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleDismiss}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold min-h-[40px] cursor-pointer ${isGlassTheme(currentTheme) ? 'text-slate-900 hover:bg-white/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2.5 rounded-xl text-xs font-black active:scale-95 shadow-2xs min-h-[40px] cursor-pointer transition-all ${isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'}`}
            >
              Save Reward
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
